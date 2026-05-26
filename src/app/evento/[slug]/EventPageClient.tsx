'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Event } from '@/lib/types';
import confetti from 'canvas-confetti';

interface EventPageClientProps {
  slug: string;
}

export default function EventPageClient({ slug }: EventPageClientProps) {
  const { user, authenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [remainingSpots, setRemainingSpots] = useState<number>(0);
  const [alreadyRegisteredId, setAlreadyRegisteredId] = useState<string | null>(null);

  // Estados para Checkout do Visitante (Inline Signup vs Login)
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPassword, setGuestPassword] = useState('');

  // Estados para Login Rápido + Checkout
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Carregar dados do evento
  useEffect(() => {
    async function loadEventData() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/events`);
        if (res.ok) {
          const eventsList = (await res.json()) as Event[];
          const found = eventsList.find((e) => e.slug === slug);
          if (found) {
            setEvent(found);
            
            // Buscar inscrições deste evento de forma pública para calcular vagas restantes
            let registeredCount = 0;
            try {
              const listRes = await fetch(`/api/registrations?event_id=${found.id}&count_only=true`);
              if (listRes.ok) {
                const listData = await listRes.json();
                registeredCount = typeof listData.count === 'number' ? listData.count : 0;
              }
            } catch {
              // Fallback
            }
            
            const currentSpots = Math.max(0, found.max_participants - registeredCount);
            setRemainingSpots(currentSpots);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar evento:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEventData();
  }, [slug]);

  // Verificar inscrições do usuário autenticado após carregar o evento
  useEffect(() => {
    async function checkMyRegistration() {
      if (authenticated && user && event?.id) {
        try {
          const res = await fetch(`/api/registrations?event_id=${event.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.registered && data.registrationId) {
              setAlreadyRegisteredId(data.registrationId);
            } else {
              setAlreadyRegisteredId(null);
            }
          }
        } catch (e) {
          console.error('Erro ao verificar inscrição:', e);
        }
      } else {
        setAlreadyRegisteredId(null);
      }
    }
    checkMyRegistration();
  }, [authenticated, user?.id, event?.id]);

  // Executar Inscrição do Usuário Logado
  const handleRegisterAuthenticated = async () => {
    if (!event) return;
    setIsRegistering(true);

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Inscrição confirmada com sucesso! Divirta-se!');
        
        // Efeito de Confete Premium
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Redireciona para o ingresso após 1.5s
        setTimeout(() => {
          router.push(`/confirmacao/${data.registrationId}`);
        }, 1500);

      } else {
        if (res.status === 409 && data.registrationId) {
          toast.info('Você já está inscrito neste evento! Redirecionando para seu ingresso...');
          router.push(`/confirmacao/${data.registrationId}`);
        } else {
          toast.error(data.error || 'Erro ao realizar inscrição.');
        }
      }
    } catch (err) {
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Executar Inscrição + Cadastro de Visitante
  const handleRegisterGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (activeTab === 'signup') {
      if (!guestName || !guestEmail || !guestPassword) {
        toast.error('Preencha os campos obrigatórios (*).');
        return;
      }
      if (guestPassword.length < 6) {
        toast.error('A senha deve conter no mínimo 6 caracteres.');
        return;
      }

      setIsRegistering(true);
      try {
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: event.id,
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            password: guestPassword
          })
        });

        const data = await res.json();

        if (res.ok) {
          toast.success('Conta criada e inscrição confirmada com sucesso!');
          
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          setTimeout(() => {
            router.push(`/confirmacao/${data.registrationId}`);
          }, 1500);
        } else {
          if (res.status === 409 && data.registrationId) {
            toast.info('E-mail já inscrito! Redirecionando para seu ingresso...');
            router.push(`/confirmacao/${data.registrationId}`);
          } else {
            toast.error(data.error || 'Erro ao realizar cadastro e inscrição.');
          }
        }
      } catch (err) {
        toast.error('Erro ao conectar com o servidor.');
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Login + Checkout Rápido
      if (!loginEmail || !loginPassword) {
        toast.error('Preencha e-mail e senha.');
        return;
      }

      setIsRegistering(true);
      try {
        // 1. Efetuar Login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });

        if (!loginRes.ok) {
          const loginErr = await loginRes.json();
          toast.error(loginErr.error || 'Falha ao autenticar.');
          setIsRegistering(false);
          return;
        }

        // 2. Realizar Inscrição após Login bem-sucedido
        const regRes = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: event.id })
        });

        const regData = await regRes.json();

        if (regRes.ok) {
          toast.success('Login efetuado e inscrição confirmada!');
          
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          setTimeout(() => {
            router.push(`/confirmacao/${regData.registrationId}`);
          }, 1500);
        } else {
          if (regRes.status === 409 && regData.registrationId) {
            toast.info('Você já está inscrito! Redirecionando para o ingresso...');
            router.push(`/confirmacao/${regData.registrationId}`);
          } else {
            toast.error(regData.error || 'Erro ao realizar inscrição.');
          }
        }
      } catch (err) {
        toast.error('Erro de conexão.');
      } finally {
        setIsRegistering(false);
      }
    }
  };

  // Formatar data
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando detalhes do evento...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Evento não encontrado</h2>
          <p className="text-zinc-500 mb-6">O link que você seguiu pode estar quebrado ou o evento foi removido pelo organizador.</p>
          <button onClick={() => router.push('/')} className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white">
            Voltar para Início
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLotado = event.status === 'lotado';
  const isEncerrado = event.status === 'encerrado' || new Date(event.event_date) < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: DETALHES DO EVENTO (2/3 de largura) */}
          <div className="lg:col-span-2 space-y-8 animate-slide-in">
            {/* Banner Gigante Premium */}
            <div
              className="w-full h-80 rounded-3xl relative overflow-hidden border border-zinc-800 shadow-2xl flex items-end p-6 md:p-8"
              style={{
                background: event.banner_url?.startsWith('linear-gradient') ? event.banner_url : '#1e293b',
                backgroundImage: event.banner_url?.startsWith('http') ? `url(${event.banner_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-3">
                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider border shadow-md ${
                  event.status === 'ativo'
                    ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400'
                    : event.status === 'lotado'
                    ? 'bg-amber-950/90 border-amber-500/30 text-amber-400'
                    : 'bg-zinc-950/90 border-zinc-700/30 text-zinc-400'
                }`}>
                  {event.status}
                </span>

                <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight drop-shadow-md">
                  {event.title}
                </h1>
              </div>
            </div>

            {/* Informações Rápidas (Grid de Detalhes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Data e Hora */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-5 flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quando</span>
                  <p className="text-zinc-200 text-sm font-semibold mt-1 leading-relaxed capitalize">
                    {formatEventDate(event.event_date)}
                  </p>
                </div>
              </div>

              {/* Local */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-5 flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Onde</span>
                  <p className="text-zinc-200 text-sm font-semibold mt-1 leading-relaxed">
                    {event.location}
                  </p>
                </div>
              </div>

              {/* Investimento */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-5 flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Investimento</span>
                  <p className="text-zinc-200 text-sm font-semibold mt-1 leading-relaxed">
                    {event.is_paid ? `R$ ${Number(event.price || 0).toFixed(2).replace('.', ',')}` : 'Entrada Gratuita'}
                  </p>
                </div>
              </div>

              {/* Vagas */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-5 flex items-start gap-4 shadow-sm">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Capacidade</span>
                  <p className="text-zinc-200 text-sm font-semibold mt-1 leading-relaxed">
                    {isLotado ? 'Esgotado' : `${event.max_participants} vagas`}
                  </p>
                </div>
              </div>

            </div>

            {/* Descrição Detalhada */}
            <div className="rounded-3xl border border-zinc-800/85 bg-[#0f172a]/15 p-6 md:p-8 shadow-sm">
              <h3 className="font-display font-bold text-xl text-white mb-4">Sobre o Evento</h3>
              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line space-y-4">
                {event.description}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: CHECKOUT / INSCRIÇÃO (1/3 de largura) */}
          <div className="lg:col-span-1 animate-scale-in">
            <div className="sticky top-24 rounded-3xl border border-zinc-800/90 bg-[#0f172a]/55 p-6 shadow-2xl backdrop-blur-md space-y-6">
              
              <div>
                <h3 className="font-display font-bold text-xl text-white">Garantir Ingresso</h3>
                <p className="text-xs text-zinc-500 mt-1">Inscreva-se instantaneamente abaixo</p>
              </div>

              {/* SEÇÃO DINÂMICA DE CHECKOUT */}
              {isEncerrado ? (
                /* ESTADO 1: EVENTO ENCERRADO */
                <div className="text-center p-6 border border-zinc-800 bg-zinc-950/20 rounded-2xl">
                  <span className="text-rose-500 text-xs font-bold uppercase tracking-wider block mb-2">🚫 Inscrições Fechadas</span>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Este evento já aconteceu ou as inscrições foram encerradas pelo organizador.</p>
                  <button disabled className="w-full rounded-xl bg-zinc-800 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed">
                    Evento Encerrado
                  </button>
                </div>
              ) : isLotado ? (
                /* ESTADO 2: EVENTO LOTADO */
                <div className="text-center p-6 border border-amber-900/30 bg-amber-950/5 rounded-2xl">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-wider block mb-2">⚠️ Vagas Esgotadas</span>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Infelizmente, todas as vagas para este evento foram preenchidas. Fique atento a novas sessões.</p>
                  <button disabled className="w-full rounded-xl bg-zinc-800 py-3 text-xs font-bold text-zinc-600 cursor-not-allowed">
                    Lotação Esgotada
                  </button>
                </div>
              ) : event.is_paid ? (
                /* ESTADO NOVO: EVENTO PAGO - REDIRECIONAR PARA WHATSAPP */
                <div className="space-y-4">
                  <div className="p-5 border border-amber-500/20 bg-[#1e1b18]/40 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        💰 Evento Pago
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-widest">Valor do Ingresso</span>
                      <span className="text-3xl font-extrabold text-white block font-mono">
                        R$ {Number(event.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Para garantir a sua vaga neste evento pago, realize o acerto diretamente com o organizador via WhatsApp. Clique no botão abaixo para iniciar o contato e receber as instruções de PIX/pagamento.
                    </p>
                  </div>

                  <a
                    href={`https://api.whatsapp.com/send?phone=${event.whatsapp_contact?.replace(/\D/g, '')}&text=${encodeURIComponent(
                      `Olá! Gostaria de garantir minha vaga e realizar o pagamento para o evento *${event.title}* no valor de R$ ${Number(event.price || 0).toFixed(2).replace('.', ',')}. Como posso proceder para confirmar minha inscrição?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl bg-[#25D366] hover:bg-[#20ba5a] py-4 text-xs font-bold text-white shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.717-1.465L0 24zm10.109-4.8c1.555.924 3.09 1.417 4.793 1.418 5.485 0 9.948-4.614 9.952-10.282.002-2.747-1.062-5.328-2.997-7.264-1.936-1.935-4.51-3.001-7.256-3.002-5.498 0-9.96 4.609-9.964 10.281-.002 1.91.498 3.774 1.448 5.412L4.67 20.358l4.475-1.176.241.143.78.275z"/>
                    </svg>
                    Pagar e Confirmar via WhatsApp
                  </a>
                </div>
              ) : authenticated ? (
                /* ESTADO 3: USUÁRIO JÁ ESTÁ AUTENTICADO */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/10">
                    <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">✓ Logado como</span>
                    <span className="text-sm font-semibold text-white block">{user?.name}</span>
                    <span className="text-xs text-zinc-400 block">{user?.email}</span>
                  </div>

                  {alreadyRegisteredId ? (
                    <div className="space-y-2">
                      <div className="p-3 text-center rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        Você já está inscrito neste evento! 🎉
                      </div>
                      <button
                        onClick={() => router.push(`/ingresso/${alreadyRegisteredId}`)}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/15 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Ver Meu Ingresso
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegisterAuthenticated}
                      disabled={isRegistering}
                      className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-sm font-bold text-white hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/15 hover:shadow-brand-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRegistering ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Inscrevendo...
                        </>
                      ) : (
                        'Garantir Minha Vaga Grátis'
                      )}
                    </button>
                  )}
                </div>
              ) : (
                /* ESTADO 4: USUÁRIO CONVIDADO / CADASTRO & LOGIN INLINE */
                <div className="space-y-4">
                  {/* Tabs Seletoras */}
                  <div className="flex border-b border-zinc-800">
                    <button
                      onClick={() => setActiveTab('signup')}
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${
                        activeTab === 'signup' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Inscrição Rápida
                    </button>
                    <button
                      onClick={() => setActiveTab('login')}
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${
                        activeTab === 'login' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Já tenho conta
                    </button>
                  </div>

                  <form onSubmit={handleRegisterGuest} className="space-y-4">
                    {activeTab === 'signup' ? (
                      /* FORMULARIO CADASTRO INLINE */
                      <div className="space-y-3">
                        <input
                          type="text"
                          required
                          placeholder="Nome Completo *"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                        <input
                          type="email"
                          required
                          placeholder="E-mail *"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp / Telefone"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Crie uma Senha * (mín 6 dig)"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                        <p className="text-[10px] text-zinc-500">
                          * Uma conta de participante será gerada para você baixar o ingresso e fazer check-in.
                        </p>
                      </div>
                    ) : (
                      /* FORMULARIO LOGIN EXPRESSO */
                      <div className="space-y-3">
                        <input
                          type="email"
                          required
                          placeholder="E-mail cadastrado"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Senha de acesso"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          disabled={isRegistering}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-[#0c1220] text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 text-xs transition-all"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-xs font-bold text-white hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/15 hover:shadow-brand-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRegistering ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processando...
                        </>
                      ) : activeTab === 'signup' ? (
                        'Criar Conta & Garantir Vaga'
                      ) : (
                        'Fazer Login & Confirmar Vaga'
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
