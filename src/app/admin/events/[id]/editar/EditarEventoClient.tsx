'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

const GRADIENT_PRESETS = [
  { name: 'Indigo Aura', css: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  { name: 'Midnight Eclipse', css: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Sunset Volcano', css: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)' },
  { name: 'Emerald Oasis', css: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
];

interface EditarEventoClientProps {
  id: string;
}

export default function EditarEventoClient({ id }: EditarEventoClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('100');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [whatsappContact, setwhatsappContact] = useState('');
  const [status, setStatus] = useState<'ativo' | 'encerrado' | 'lotado'>('ativo');

  // Estados do Banner
  const [bannerType, setBannerType] = useState<'preset' | 'url'>('preset');
  const [selectedPreset, setSelectedPreset] = useState(GRADIENT_PRESETS[0].css);
  const [bannerUrl, setBannerUrl] = useState('');

  // Estado do slug ao vivo
  const [liveSlug, setLiveSlug] = useState('');

  // Carregar dados existentes do evento
  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title);
          setDescription(data.description);
          setLocation(data.location);
          
          // Formatar data para o input datetime-local
          const date = new Date(data.event_date);
          // Ajusta timezone offset para preencher correto no input
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
          setEventDate(localDate.toISOString().slice(0, 16));
          
          setMaxParticipants(data.max_participants.toString());
          setIsPaid(data.is_paid);
          setPrice(data.price?.toString() || '');
          setwhatsappContact(data.whatsapp_contact || '');
          setStatus(data.status);

          // Verificar tipo de banner
          if (data.banner_url?.startsWith('linear-gradient')) {
            setBannerType('preset');
            setSelectedPreset(data.banner_url);
          } else {
            setBannerType('url');
            setBannerUrl(data.banner_url || '');
          }
        } else {
          toast.error('Erro ao carregar detalhes do evento.');
          router.push('/admin');
        }
      } catch (err) {
        toast.error('Falha de conexão.');
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id, router, toast]);

  // Atualizar slug dinamicamente
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
      toast.error('Preencha os campos obrigatórios (*).');
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
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
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
          banner_url: finalBanner,
          status
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Evento "${title}" atualizado com sucesso!`);
        router.push('/admin');
        router.refresh();
      } else {
        toast.error(data.error || 'Erro ao atualizar evento.');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
        <p className="text-zinc-400">Buscando dados do evento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-3xl text-white">Editar Evento</h2>
        <p className="text-zinc-500 text-sm mt-0.5">Modifique as informações gerais, vagas ou design do banner</p>
      </div>

      {/* Formulário */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 md:p-8 shadow-2xl backdrop-blur-md">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Título + Slug */}
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
                🔗 Novo link público (salve para atualizar): <span className="text-brand-400">/evento/{liveSlug}</span>
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
              placeholder="Escreva tudo sobre o evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all resize-y"
            />
          </div>

          {/* Data e Local */}
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
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white focus:outline-none focus:border-brand-500 text-sm transition-all font-mono"
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
                placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
              />
            </div>

          </div>

          {/* Vagas, Preço e Status Atual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Vagas */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Limite de Vagas *
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

            {/* Tipo Inscrição */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Tipo de Inscrição
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold border transition-all cursor-pointer ${
                    !isPaid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Grátis
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold border transition-all cursor-pointer ${
                    isPaid
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  Paga
                </button>
              </div>
            </div>

            {/* Status do Evento */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Status Atual do Evento
              </label>
              
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220] text-zinc-300 focus:outline-none focus:border-brand-500 text-xs font-semibold"
              >
                <option value="ativo">Ativo (Inscrições Abertas)</option>
                <option value="lotado">Lotado (Esgotado)</option>
                <option value="encerrado">Encerrado (Fechado)</option>
              </select>
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

          {/* DESIGN DO BANNER */}
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
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/sua-imagem-banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all font-mono"
                />
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
                  Gravando Alterações...
                </>
              ) : (
                'Salvar Alterações do Evento'
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
