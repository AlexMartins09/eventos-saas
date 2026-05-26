'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/ui/toast';
import { Registration } from '@/lib/types';

interface TicketPageClientProps {
  id: string;
}

export default function TicketPageClient({ id }: TicketPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

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
          toast.error('Não conseguimos localizar seu ingresso.');
        }
      } catch (err) {
        console.error('Erro ao buscar ingresso:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [id, toast]);

  // Download automático do QR Code como imagem PNG
  const handleDownloadTicket = () => {
    if (!registration) return;
    try {
      const link = document.createElement('a');
      link.href = registration.qr_code;
      link.download = `ingresso-eventflow-${registration.unique_token.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Ingresso baixado com sucesso! Salve no seu dispositivo.');
    } catch (err) {
      toast.error('Erro ao efetuar download do ingresso.');
    }
  };

  // Ação de Compartilhar
  const handleShare = async () => {
    const shareData = {
      title: `Confirmado: ${registration?.event?.title}`,
      text: `Acabei de garantir minha inscrição no evento "${registration?.event?.title}"! Garanta a sua vaga você também!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Compartilhado com sucesso!');
      } catch (err) {
        // Usuário cancelou ou falhou
      }
    } else {
      // Fallback: copiar para área de transferência
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link do ingresso copiado para a área de transferência!');
      } catch (err) {
        toast.error('Falha ao copiar link.');
      }
    }
  };

  // Gerador de Arquivo de Calendário .ics dinâmico em tempo de execução
  const handleAddToCalendar = () => {
    if (!registration || !registration.event) return;
    const event = registration.event;

    try {
      const dateStart = new Date(event.event_date);
      // Evento padrão dura 3 horas
      const dateEnd = new Date(dateStart.getTime() + 3600000 * 3);

      const formatIcsDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      };

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//EventFlow//Event Tickets//PT',
        'BEGIN:VEVENT',
        `UID:${registration.id}@eventflow.com`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(dateStart)}`,
        `DTEND:${formatIcsDate(dateEnd)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\\n\\nCódigo do Ingresso: #${registration.unique_token.substring(0, 8).toUpperCase()}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.slug}-calendario.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Arquivo de calendário (.ics) gerado! Adicione à sua agenda.');
    } catch (err) {
      toast.error('Erro ao adicionar ao calendário.');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando confirmação de ingresso...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!registration || !registration.event || !registration.user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ingresso não encontrado</h2>
          <p className="text-zinc-500 mb-6">Não conseguimos localizar nenhuma inscrição ativa correspondente a este código.</p>
          <button onClick={() => router.push('/')} className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white">
            Explorar Eventos
          </button>
        </main>
        <Footer />
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

      <main className="flex-grow max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center z-20 relative">
        {/* Luz decorativa */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-brand-600/5 blur-[120px] pointer-events-none" />
        
        {/* Banner de Sucesso */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display font-extrabold text-3xl text-white">Ingresso Oficial</h2>
          <p className="text-zinc-400 text-sm mt-1">Sua participação está devidamente confirmada e registrada.</p>
        </div>

        {/* CARTÃO DO INGRESSO FÍSICO MOCKUP (Rich Aesthetics) */}
        <div className="w-full max-w-md bg-[#0f172a]/65 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden animate-scale-in">
          
          {/* Luz decorativa */}
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-brand-500/10 blur-xl pointer-events-none" />

          {/* PARTE SUPERIOR DO INGRESSO: DETALHES DO EVENTO */}
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 animate-pulse">
                🎫 Ingresso Válido
              </span>
              <span className="text-xs font-bold text-zinc-500 font-mono">
                #{ticketCode}
              </span>
            </div>
            
            <h3 className="font-display font-extrabold text-xl text-white tracking-tight pt-1 leading-snug line-clamp-2">
              {event.title}
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="capitalize leading-relaxed font-medium">{formatEventDate(event.event_date)}</span>
              </div>
              
              <div className="flex items-center gap-2.5 text-zinc-300">
                <svg className="w-4 h-4 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="leading-relaxed font-medium">{event.location}</span>
              </div>
            </div>
          </div>

          {/* EFEITO FÍSICO DE TICKET CUT-OFF (Linha Dotted + Punches Laterais) */}
          <div className="relative flex items-center h-4 w-full">
            {/* Punch Esquerdo */}
            <div className="absolute -left-2.5 h-5 w-5 rounded-full bg-[#090d16] border-r border-zinc-800" />
            {/* Linha Dotted */}
            <div className="w-full border-t border-dashed border-zinc-700/60 mx-4" />
            {/* Punch Direito */}
            <div className="absolute -right-2.5 h-5 w-5 rounded-full bg-[#090d16] border-l border-zinc-800" />
          </div>

          {/* PARTE INFERIOR DO INGRESSO: PARTICIPANTE & QR CODE */}
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            
            {/* Dados do Participante */}
            <div className="w-full">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Participante</span>
              <span className="text-base font-bold text-white block mt-0.5">{user.name}</span>
              <span className="text-xs text-zinc-400 block">{user.email}</span>
            </div>

            {/* QR Code Real PNG Renderizado */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-inner flex items-center justify-center max-w-[200px] w-full transform hover:scale-[1.02] transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={registration.qr_code}
                alt="QR Code de validação de ingresso"
                className="w-full h-auto block select-none"
              />
            </div>

            <div className="text-[10px] text-zinc-500 leading-relaxed max-w-[240px]">
              Este QR Code contém informações criptografadas de validação e será escaneado no dia do evento.
            </div>

          </div>

        </div>

        {/* BOTÕES DE AÇÕES DIVERSAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md mt-8 animate-fade-in animate-delay-100">
          {/* Baixar Ingresso */}
          <button
            onClick={handleDownloadTicket}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-zinc-800 bg-[#0f172a]/30 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer text-center"
          >
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <span className="text-xs font-bold">Baixar Ticket</span>
          </button>

          {/* Adicionar ao Calendário */}
          <button
            onClick={handleAddToCalendar}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-zinc-800 bg-[#0f172a]/30 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer text-center"
          >
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xs font-bold">Na Agenda</span>
          </button>

          {/* Compartilhar */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-zinc-800 bg-[#0f172a]/30 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer text-center"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.636-2.531m0 7.578l-4.636-2.531m5.66-3.834a9 9 0 11-18 0 9 9 0 0118 0zm-2.02 6.364a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold">Compartilhar</span>
          </button>
        </div>

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
