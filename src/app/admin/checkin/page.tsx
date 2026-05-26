'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import jsQR from 'jsqr';

interface ScanLog {
  id: string;
  name?: string;
  code: string;
  status: 'LIBERADO' | 'UTILIZADO' | 'INVALIDO';
  message: string;
  timestamp: Date;
}

export default function CameraCheckin() {
  const { toast } = useToast();

  // Estados do Scanner
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'LIBERADO' | 'UTILIZADO' | 'INVALIDO' | null;
    message: string;
    name?: string;
  }>({ status: null, message: '' });

  // Estados do Formulário Manual
  const [manualCode, setManualCode] = useState('');
  const [isValidatingManual, setIsValidatingManual] = useState(false);

  // Histórico de Leituras Recentes
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);

  // Referências para vídeo e canvas offscreen
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Parar câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // --- AUDIO SYNTHESISER VIA WEB AUDIO API (Edge-safe, zero MP3 assets) ---
  const playBeep = (type: 'success' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.value = 850; // Crisp high success tone
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // Double low error beep
        osc.frequency.value = 280; // Low alert tone
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch (e) {
      console.warn('[Web Audio] Navegador bloqueou áudio ou erro de reprodução:', e);
    }
  };

  // --- LIGAR CÂMERA ---
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraActive(true);
    setScanResult({ status: null, message: '' });

    try {
      const constraints = {
        video: { facingMode: 'environment', width: 640, height: 480 } // Preferir câmera traseira no celular
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Impedir tela cheia no iOS
        videoRef.current.play();
        
        // Iniciar loop de análise de frames
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error('[Camera] Erro ao abrir câmera:', err);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // --- DESLIGAR CÂMERA ---
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // --- LOOP DE SCANNER DE FRAMES ---
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Verificar se o vídeo está pronto
    if (video.readyState === video.HAVE_CURRENT_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Desenhar frame no canvas invisível
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Chamar jsQR para analisar os pixels do frame
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      // Se encontrou um QR Code e não está processando outra validação
      if (code && code.data && !isProcessingRef.current) {
        isProcessingRef.current = true;
        
        // Processar os dados descriptografados
        processScannedData(code.data);
      }
    }

    // Continuar loop se câmera continuar ativa
    if (cameraActive) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // --- TRATAMENTO DOS DADOS DO QR CODE DETECTADO ---
  const processScannedData = async (rawData: string) => {
    let token = rawData;
    
    // Tentar decodificar se o payload for JSON (nosso formato padrão)
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && parsed.token) {
        token = parsed.token;
      }
    } catch {
      // Se não for JSON, trata o texto puro como token direto
    }

    // 1. Chamar API de validação no backend
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (res.ok) {
        const statusCode = data.status_code; // 'LIBERADO', 'UTILIZADO', 'INVALIDO'
        const isLiberado = statusCode === 'LIBERADO';

        // Tocar som correspondente
        playBeep(isLiberado ? 'success' : 'error');

        // Mostrar tela de feedback visual
        setScanResult({
          status: statusCode,
          message: data.message,
          name: data.participant_name
        });

        // Adicionar ao log recente
        const newLog: ScanLog = {
          id: crypto.randomUUID(),
          code: token.substring(0, 8).toUpperCase(),
          name: data.participant_name,
          status: statusCode,
          message: data.message,
          timestamp: new Date()
        };
        setRecentScans(prev => [newLog, ...prev.slice(0, 4)]);

        if (isLiberado) {
          toast.success(`Entrada Liberada! Bem-vindo, ${data.participant_name}.`);
        } else {
          toast.error(`${data.message}`);
        }
      }
    } catch (err) {
      toast.error('Erro de conexão ao processar QR Code.');
    } finally {
      // Manter a tela de feedback por 2.5s antes de liberar o scanner para novo check-in
      setTimeout(() => {
        setScanResult({ status: null, message: '' });
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  // --- SUBMIT DO VALIDADOR MANUAL ---
  const handleManualValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode) return;

    setIsValidatingManual(true);
    setScanResult({ status: null, message: '' });

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: manualCode })
      });

      const data = await res.json();

      if (res.ok) {
        const statusCode = data.status_code || (data.success ? 'LIBERADO' : 'INVALIDO');
        const isLiberado = statusCode === 'LIBERADO';

        playBeep(isLiberado ? 'success' : 'error');

        setScanResult({
          status: statusCode,
          message: data.message,
          name: data.participant_name
        });

        // Registrar log
        const newLog: ScanLog = {
          id: crypto.randomUUID(),
          code: manualCode.substring(0, 8).toUpperCase(),
          name: data.participant_name,
          status: statusCode,
          message: data.message,
          timestamp: new Date()
        };
        setRecentScans(prev => [newLog, ...prev.slice(0, 4)]);

        if (isLiberado) {
          toast.success(`Entrada Liberada! Bem-vindo, ${data.participant_name}.`);
          setManualCode(''); // limpa input
        } else {
          toast.error(data.message || 'Código de ingresso inválido.');
        }

        // Timer para limpar feedback
        setTimeout(() => {
          setScanResult({ status: null, message: '' });
        }, 2500);

      } else {
        playBeep('error');
        setScanResult({
          status: 'INVALIDO',
          message: data.error || 'Ingresso inválido!'
        });
        toast.error(data.error || 'Código de ingresso inválido.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao processar código manual.');
    } finally {
      setIsValidatingManual(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-3xl text-white">Validar Entrada (Check-in)</h2>
        <p className="text-zinc-500 text-sm mt-0.5">Escanear ingressos com a câmera ou digitar o código de validação</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* COLUNA ESQUERDA: CÂMERA SCANNER (3/5 de largura) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            
            {/* CANVAS INTERNO INVISÍVEL PARA ANÁLISE DE FRAMES */}
            <canvas ref={canvasRef} className="hidden" />

            {/* SCREEN DE CÂMERA ATIVA */}
            {cameraActive ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-[#060910] flex items-center justify-center max-w-[480px]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                
                {/* Efeito Visual do Laser Vermelho Barcode */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 shadow-md shadow-rose-500/50 animate-bounce duration-[2000ms] pointer-events-none" />

                {/* Brackets decorativos de escaneamento */}
                <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-brand-400 pointer-events-none" />
                <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-brand-400 pointer-events-none" />
                <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-brand-400 pointer-events-none" />
                <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-brand-400 pointer-events-none" />

                {/* OVERLAY DE FEEDBACK RÁPIDO AO VALIDAR QR CODE (Glow Screens) */}
                {scanResult.status && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md animate-scale-in ${
                    scanResult.status === 'LIBERADO'
                      ? 'bg-emerald-950/90 text-emerald-200'
                      : scanResult.status === 'UTILIZADO'
                      ? 'bg-amber-950/90 text-amber-200'
                      : 'bg-rose-950/90 text-rose-200'
                  }`}>
                    {/* Ícone */}
                    <div className="mb-4">
                      {scanResult.status === 'LIBERADO' ? (
                        <svg className="w-14 h-14 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-14 h-14 text-rose-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    
                    <h3 className="font-display font-extrabold text-2xl tracking-tight leading-tight">
                      {scanResult.message}
                    </h3>
                    
                    {scanResult.name && (
                      <p className="text-sm font-semibold mt-2 opacity-90 font-mono">
                        👤 {scanResult.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* SCREEN DE INICIALIZAR SCANNER */
              <div className="text-center space-y-4 max-w-sm py-8">
                <div className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 mx-auto flex">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold font-display text-white">Leitor de QR Code</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Para efetuar validações em tempo real via câmera de vídeo, clique no botão abaixo para ativar a media stream.
                </p>
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white hover:bg-brand-500 shadow-md transition-all cursor-pointer"
                >
                  {cameraLoading ? 'Inicializando...' : 'Ativar Câmera Scanner'}
                </button>
              </div>
            )}

            {/* Controles de Câmera Ativa */}
            {cameraActive && (
              <button
                onClick={stopCamera}
                className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Desativar Leitor Câmera
              </button>
            )}

          </div>
        </div>

        {/* COLUNA DIREITA: MANUAL VALIDATOR & SCAN LOGS (2/5 de largura) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* VALIDADOR MANUAL (Para Ambientes Virtuais ou Backup) */}
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Validação Manual (Backup)</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Insira o código do ingresso se a câmera estiver inacessível</p>
            </div>

            <form onSubmit={handleManualValidate} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Código de Inscrição / Token UUID..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isValidatingManual}
                className="flex-grow px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isValidatingManual || !manualCode}
                className="rounded-xl bg-zinc-800 hover:bg-brand-600 border border-zinc-700 hover:border-brand-500 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isValidatingManual ? '...' : 'Validar'}
              </button>
            </form>
          </div>

          {/* HISTÓRICO DE LEITURAS RECENTES */}
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 shadow-2xl backdrop-blur-md space-y-4 flex flex-col h-[280px]">
            <div>
              <h3 className="font-display font-bold text-base text-white">Registros Recentes</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Leituras efetuadas nesta sessão de check-in</p>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-1">
              {recentScans.length > 0 ? (
                recentScans.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between p-3 rounded-xl border animate-slide-in ${
                      log.status === 'LIBERADO'
                        ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
                        : log.status === 'UTILIZADO'
                        ? 'bg-amber-950/10 border-amber-500/20 text-amber-400'
                        : 'bg-rose-950/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="text-xs font-bold block leading-tight truncate">
                        {log.name || 'Convidado'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">
                        Token: #{log.code} | {log.message}
                      </span>
                    </div>

                    <span className="text-[9px] font-bold shrink-0 font-mono text-zinc-500">
                      {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-600 text-xs font-semibold">
                  Nenhum ingresso verificado recentemente.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
