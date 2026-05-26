'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/ui/toast';
import { Registration } from '@/lib/types';
import confetti from 'canvas-confetti';

interface ConfirmationPageClientProps {
  id: string;
}

export default function ConfirmationPageClient({ id }: ConfirmationPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito de Confete Premium na montagem da página
  useEffect(() => {
    // Confete inicial
    confetti({
      particleCount: 180,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#4f46e5', '#7c3aed', '#10b981', '#ffffff']
    });

    // Segunda onda menor após 500ms
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 550);

    return () => clearTimeout(timer);
  }, []);

  // Carregar dados da inscrição
  useEffect(() => {
    async function loadTicket() {
      if (!id) return;
      try {
        const res = await fetch(`/api/registrations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRegistration(data);
        } else {
          toast.error('Ingresso não localizado.');
        }
      } catch (err) {
        console.error('Erro ao buscar ingresso:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [id, toast]);

  // Formatar data em português
  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadTicket = () => {
    if (!registration) return;
    try {
      const link = document.createElement('a');
      link.href = registration.qr_code;
      link.download = `confirmacao-eventflow-${registration.unique_token.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Confirmação salva no seu dispositivo.');
    } catch (err) {
      toast.error('Erro ao salvar QR Code.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#090d16] text-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4" />
        <p className="text-zinc-400 text-sm">Carregando sua confirmação de participação...</p>
      </div>
    );
  }

  if (!registration || !registration.event || !registration.user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#090d16] text-center px-4">
        <div className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-6 flex">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Confirmação não localizada</h2>
        <p className="text-zinc-500 text-sm max-w-sm">
          O código informado não corresponde a nenhuma participação ativa ou o link está incorreto.
        </p>
      </div>
    );
  }

  const event = registration.event;
  const user = registration.user;
  const ticketCode = registration.unique_token.substring(0, 8).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] overflow-hidden select-none">
      
      {/* CABEÇALHO ULTRA RESTRITO - SEM NAVEGAÇÃO OU LINKS */}
      <header className="w-full py-5 border-b border-zinc-800/40 bg-[#090d16]/60 backdrop-blur-md z-30">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Event<span className="text-brand-500">Flow</span>
          </span>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL - FOCO ABSOLUTO NO TICKET */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-10 md:py-16 z-20 relative">
        {/* Luzes decorativas de fundo desfocadas */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-brand-600/5 blur-[120px] pointer-events-none" />
        
        {/* Banner de Sucesso */}
        <div className="text-center mb-8 animate-fade-in max-w-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-scale-in">
            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight leading-snug">
            Participação Confirmada!
          </h2>
          <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
            Seu ingresso digital foi gerado. Apresente o QR Code na entrada do evento.
          </p>
        </div>

        {/* CARTÃO DO INGRESSO FÍSICO ULTRA PREMIUM */}
        <div className="w-full max-w-md bg-[#0f172a]/55 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden animate-scale-in">
          
          {/* Brilho sutil no topo do card */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

          {/* PARTE SUPERIOR DO INGRESSO: EVENTO */}
          <div className="p-7.5 md:p-8 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                🎫 Presença Confirmada
              </span>
              <span className="text-xs font-bold text-zinc-500 font-mono tracking-wider">
                #{ticketCode}
              </span>
            </div>
            
            <h3 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-tight leading-snug pt-1">
              {event.title}
            </h3>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="capitalize leading-relaxed font-medium">{formatEventDate(event.event_date)}</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-zinc-300">
                <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="leading-relaxed font-medium">{event.location}</span>
              </div>
            </div>
          </div>

          {/* EFEITO TICKET CUT-OFF */}
          <div className="relative flex items-center h-4 w-full select-none">
            <div className="absolute -left-2.5 h-5 w-5 rounded-full bg-[#090d16] border-r border-zinc-800/80" />
            <div className="w-full border-t border-dashed border-zinc-700/40 mx-4" />
            <div className="absolute -right-2.5 h-5 w-5 rounded-full bg-[#090d16] border-l border-zinc-800/80" />
          </div>

          {/* PARTE INFERIOR: PARTICIPANTE & QR CODE */}
          <div className="p-7.5 md:p-8 flex flex-col items-center text-center space-y-6">
            
            {/* Dados do Participante */}
            <div className="w-full">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Participante</span>
              <span className="text-base font-bold text-white block mt-0.5">{user.name}</span>
              <span className="text-xs text-zinc-400 block">{user.email}</span>
            </div>

            {/* QR Code de Inscrição */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-md flex items-center justify-center max-w-[190px] w-full transform hover:scale-[1.02] transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={registration.qr_code}
                alt="QR Code de validação de ingresso"
                className="w-full h-auto block select-none"
              />
            </div>

            {/* Código de Participante */}
            <div className="w-full">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Código do Ingresso</span>
              <span className="text-sm font-bold font-mono text-brand-400 block mt-1 tracking-wider">
                {ticketCode}
              </span>
            </div>

            <div className="text-[10px] text-zinc-500 leading-relaxed max-w-[250px]">
              Salve este comprovante. O QR Code será digitalizado pela equipe organizadora na entrada para validar o seu check-in.
            </div>

          </div>

        </div>

        {/* BOTÃO DE SALVAR */}
        <button
          onClick={handleDownloadTicket}
          className="mt-8 flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-800 bg-[#0f172a]/40 hover:bg-[#0f172a]/70 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs font-bold font-display"
        >
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Salvar QR Code de Confirmação
        </button>

      </main>

      {/* RODAPÉ ULTRA RESTRITO - SEM NAVEGAÇÃO OU LINKS */}
      <footer className="w-full py-6 border-t border-zinc-800/40 bg-[#090d16]/30 text-center z-30">
        <p className="text-[10px] text-zinc-600 font-medium tracking-wide leading-relaxed">
          EventFlow © 2026 • Sistema SaaS de Gestão de Eventos • Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
