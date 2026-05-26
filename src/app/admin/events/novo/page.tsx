'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

// Gradientes premium predefinidos para banners
const GRADIENT_PRESETS = [
  { name: 'Indigo Aura', css: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  { name: 'Midnight Eclipse', css: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Sunset Volcano', css: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)' },
  { name: 'Emerald Oasis', css: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
];

export default function NovoEvento() {
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [whatsappContact, setwhatsappContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para armazenar dados do evento criado com sucesso
  const [createdEvent, setCreatedEvent] = useState<{ title: string; slug: string } | null>(null);

  // Estados do Banner
  const [bannerType, setBannerType] = useState<'preset' | 'url'>('preset');
  const [selectedPreset, setSelectedPreset] = useState(GRADIENT_PRESETS[0].css);
  const [bannerUrl, setBannerUrl] = useState('');

  // Estado do slug ao vivo
  const [liveSlug, setLiveSlug] = useState('');

  // Gerar slug dinamicamente a partir do título para feedback visual ao vivo
  useEffect(() => {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setLiveSlug(slug);
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !location || !eventDate || !maxParticipants) {
      toast.error('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (isPaid) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        toast.error('Por favor, informe um preço válido para o evento pago.');
        return;
      }
      if (!whatsappContact || whatsappContact.trim() === '') {
        toast.error('Por favor, informe o WhatsApp para o acerto do pagamento.');
        return;
      }
    }

    setIsSubmitting(true);
    const finalBanner = bannerType === 'preset' ? selectedPreset : bannerUrl;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          event_date: new Date(eventDate).toISOString(),
          max_participants: parseInt(maxParticipants),
          is_paid: isPaid,
          price: isPaid ? parseFloat(price) : undefined,
          whatsapp_contact: isPaid ? whatsappContact : undefined,
          banner_url: finalBanner
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Evento "${title}" criado com sucesso!`);
        // Armazenar o evento criado para exibir o painel de link
        setCreatedEvent({ title, slug: data.slug || liveSlug });
      } else {
        toast.error(data.error || 'Erro ao criar evento.');
      }
    } catch (err) {
      toast.error('Erro de conexão com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZAR TELA DE SUCESSO E COMPARTILHAMENTO ---
  if (createdEvent) {
    const publicUrl = `${window.location.origin}/evento/${createdEvent.slug}`;
    const whatsappMessage = `Olá! Inscrições abertas para o evento *${createdEvent.title}*! Garanta sua vaga pelo link: ${publicUrl}`;
    const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

    const handleCopy = () => {
      navigator.clipboard.writeText(publicUrl);
      toast.success('Link do participante copiado para a área de transferência!');
    };

    return (
      <div className="space-y-6 animate-scale-in">
        <div>
          <h2 className="font-display font-extrabold text-3xl text-white">Evento Lançado! 🚀</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Seu evento foi criado e já está no ar para inscrições.</p>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/45 p-8 shadow-2xl backdrop-blur-md text-center max-w-xl mx-auto space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white font-display leading-tight">{createdEvent.title}</h3>
            <p className="text-xs text-zinc-500">Link público gerado para compartilhamento:</p>
          </div>

          {/* Box de Link */}
          <div className="rounded-xl border border-zinc-800 bg-[#0c1220] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="text-left w-full truncate pr-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Link de Inscrição</span>
              <span className="text-xs text-brand-400 font-mono select-all truncate block mt-1">{publicUrl}</span>
            </div>
            
            <button
              onClick={handleCopy}
              type="button"
              className="w-full sm:w-auto shrink-0 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/30"
            >
              Copiar Link
            </button>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/40">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.717-1.465L0 24zm10.109-4.8c1.555.924 3.09 1.417 4.793 1.418 5.485 0 9.948-4.614 9.952-10.282.002-2.747-1.062-5.328-2.997-7.264-1.936-1.935-4.51-3.001-7.256-3.002-5.498 0-9.96 4.609-9.964 10.281-.002 1.91.498 3.774 1.448 5.412L4.67 20.358l4.475-1.176.241.143.78.275z"/>
              </svg>
              Divulgar no WhatsApp
            </a>

            <button
              onClick={() => {
                router.push('/admin');
                router.refresh();
              }}
              type="button"
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-6 py-3 text-xs font-bold text-zinc-300 hover:text-white transition-all text-center cursor-pointer"
            >
              Ir para Painel Geral
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-3xl text-white">Publicar Novo Evento</h2>
        <p className="text-zinc-500 text-sm mt-0.5">Cadastre um novo evento na plataforma e inicie as vendas online</p>
      </div>

      {/* Formulário Wizard */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Título do Evento + Live Slug */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Next.js Summit 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
            />
            {liveSlug && (
              <p className="text-[10px] text-zinc-500 font-mono">
                🔗 Link público do evento: <span className="text-brand-400">/evento/{liveSlug}</span>
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Descrição Detalhada do Evento *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Escreva tudo sobre o evento: cronograma, palestrantes, público-alvo e benefícios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all resize-y"
            />
          </div>

          {/* Duas colunas para Data/Hora e Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Data e Hora */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Data & Horário de Início *
              </label>
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white focus:outline-none focus:border-brand-500 text-sm transition-all"
              />
            </div>

            {/* Local */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Localização / Endereço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP ou Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
              />
            </div>

          </div>

          {/* Vagas, Preço e Tipo de Inscrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vagas */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Quantidade Máxima de Vagas *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Ex: 100"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white focus:outline-none focus:border-brand-500 text-sm transition-all font-mono"
              />
            </div>

            {/* Inscrição Paga */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Tipo de Inscrição
              </label>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold border transition-all cursor-pointer ${
                    !isPaid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ✓ Inscrição Gratuita
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold border transition-all cursor-pointer ${
                    isPaid
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  $ Inscrição Paga
                </button>
              </div>
            </div>

          </div>

          {/* Configurações do Evento Pago */}
          {isPaid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800/40 pt-6 animate-scale-in">
              {/* Preço */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Preço do Ingresso (R$) *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Ex: 49.90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white focus:outline-none focus:border-brand-500 text-sm transition-all font-mono"
                />
              </div>

              {/* WhatsApp de Contato */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  WhatsApp do Organizador (DDD + número) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 11999999999"
                  value={whatsappContact}
                  onChange={(e) => setwhatsappContact(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-sm transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-500">
                  * Informe apenas números com DDD (ex: 11999999999) para gerar o link do WhatsApp automático.
                </p>
              </div>
            </div>
          )}

          {/* DESIGN DO BANNER (PRESETS VS URL) */}
          <div className="space-y-4 border-t border-zinc-800/60 pt-6">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Design de Banner do Evento
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBannerType('preset')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase border cursor-pointer transition-all ${
                    bannerType === 'preset'
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Glow Gradients
                </button>
                <button
                  type="button"
                  onClick={() => setBannerType('url')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase border cursor-pointer transition-all ${
                    bannerType === 'url'
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Link de Imagem
                </button>
              </div>
            </div>

            {bannerType === 'preset' ? (
              /* SELEÇÃO DE GRADIENTES PREMIUM */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {GRADIENT_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.css;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPreset(preset.css)}
                      disabled={isSubmitting}
                      className={`h-20 rounded-2xl relative overflow-hidden border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-white ring-2 ring-brand-500 shadow-lg' 
                          : 'border-zinc-800/60 hover:border-zinc-600'
                      }`}
                      style={{ background: preset.css }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                        <span className="text-[10px] font-extrabold text-white text-center leading-tight">
                          {preset.name} {isSelected && '✓'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* INSERIR URL DA IMAGEM */
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/sua-imagem-banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-500">
                  Insira uma URL pública direta para a imagem (.jpg, .png).
                </p>
              </div>
            )}
          </div>

          {/* BOTÕES DE SUBMIT */}
          <div className="flex gap-4 border-t border-zinc-800/60 pt-6">
            <Link
              href="/admin"
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-all text-center"
            >
              Cancelar
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-grow rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-xs font-extrabold text-white hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-600/15 hover:shadow-brand-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Publicando Evento...
                </>
              ) : (
                'Publicar Evento Oficial'
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
