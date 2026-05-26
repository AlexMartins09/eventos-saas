'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Event } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'lotado'>('todos');

  // Carregar eventos ao montar a tela
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Formatar data no padrão PT-BR
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtrar eventos baseado em busca e status
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todos' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <main className="flex-grow">
        {/* HERO SECTION - EDGE TO EDGE IMMERSIVE ARTWORK */}
        <section 
          className="relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden pt-16 pb-24 md:py-32 shadow-2xl"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Luzes decorativas de fundo extras */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          {/* Máscara gradiente premium para fundir com a cor de fundo #090d16 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/70 to-[#090d16]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/85 via-transparent to-[#090d16]/20 pointer-events-none" />

          <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-6 backdrop-blur-sm animate-fade-in">
              ✨ Nova Versão 2026
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-3xl drop-shadow-md">
              A melhor experiência em <br/>
              <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Gestão de Eventos
              </span>
            </h1>
            <p className="text-zinc-300 text-lg mb-8 leading-relaxed max-w-2xl drop-shadow">
              Crie eventos extraordinários, venda ingressos online em segundos, acompanhe relatórios avançados e faça check-in ágil com leitor de QR Code integrado na câmera.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a
                href="#event-catalog"
                className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 transition-all cursor-pointer"
              >
                Explorar Eventos
              </a>
              <Link
                href="/cadastro?role=ADMIN"
                className="rounded-xl border border-zinc-700/60 bg-[#0f172a]/35 px-7 py-3.5 text-sm font-bold text-zinc-300 hover:text-white hover:bg-[#0f172a]/70 backdrop-blur-sm transition-all"
              >
                Organizar um Evento
              </Link>
            </div>
          </div>
        </section>

        {/* CONTAINER DO RESTANTE DA PÁGINA (PESQUISA, FILTROS E GRID DE EVENTOS) */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* PESQUISA E FILTROS */}
        <section id="event-catalog" className="mb-12 scroll-mt-24">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Eventos Disponíveis</h2>
              <p className="text-zinc-500 text-sm mt-1">Garanta sua vaga nos melhores eventos da atualidade</p>
            </div>

            {/* Pesquisador */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar evento, cidade ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-[#0c1220]/80 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>

              {/* Filtros rápidos */}
              <div className="flex gap-2">
                {(['todos', 'ativo', 'lotado'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {filter === 'todos' ? 'Todos' : filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRID DE EVENTOS */}
          {loading ? (
            /* SKELETON LOADING GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-zinc-800/40 bg-zinc-900/20 overflow-hidden h-[390px] flex flex-col">
                  <div className="h-44 w-full bg-zinc-800/30 animate-pulse" />
                  <div className="p-6 flex-grow flex flex-col gap-3">
                    <div className="h-4 w-1/4 bg-zinc-800/30 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-zinc-800/30 rounded animate-pulse mt-2" />
                    <div className="h-4 w-5/6 bg-zinc-800/30 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-zinc-800/30 rounded animate-pulse mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            /* LISTAGEM DE CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((e, index) => (
                <div
                  key={e.id}
                  className="group rounded-3xl border border-zinc-800/50 bg-[#0f172a]/30 overflow-hidden flex flex-col hover:border-brand-500/30 transition-all duration-300 animate-slide-in shadow-lg relative min-h-[360px]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Full Background Banner */}
                  <div
                    className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background: e.banner_url?.startsWith('linear-gradient')
                        ? e.banner_url
                        : '#1e293b',
                      backgroundImage: e.banner_url?.startsWith('http')
                        ? `url(${e.banner_url})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />

                  {/* Dark Gradient Mask Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/85 to-black/25 z-10 pointer-events-none" />

                  {/* Badges de Topo */}
                  <div className="relative z-20 p-4 flex justify-between items-start pointer-events-none">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#090d16]/80 text-zinc-300 border border-zinc-700/20 backdrop-blur-sm">
                      {e.is_paid ? `R$ ${Number(e.price || 0).toFixed(2).replace('.', ',')}` : 'Gratuito'}
                    </span>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider border shadow-md ${
                        e.status === 'ativo'
                          ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                          : e.status === 'lotado'
                          ? 'bg-amber-950/80 border-amber-500/30 text-amber-400'
                          : 'bg-zinc-950/80 border-zinc-700/30 text-zinc-400'
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>

                  {/* Content (Overlaid on Bottom) */}
                  <div className="relative z-20 p-6 mt-auto flex flex-col h-full justify-end">
                    <p className="text-[10px] font-bold tracking-wider text-brand-400 uppercase mb-1">
                      📅 {formatEventDate(e.event_date)}
                    </p>
                    <h3 className="font-display font-extrabold text-lg text-white group-hover:text-brand-400 transition-colors mb-2 line-clamp-1">
                      {e.title}
                    </h3>
                    <p className="text-zinc-400 text-xs line-clamp-2 mb-4 leading-relaxed opacity-85">
                      {e.description}
                    </p>

                    <div className="border-t border-zinc-800/40 pt-3 flex items-center justify-between">
                      <div className="text-[10px]">
                        <span className="text-zinc-500">Local:</span>
                        <p className="text-zinc-300 font-medium truncate max-w-[130px]">{e.location}</p>
                      </div>
                      
                      <Link
                        href={`/evento/${e.slug}`}
                        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                          e.status === 'encerrado'
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed pointer-events-none'
                            : 'bg-[#090d16]/75 border border-brand-500/30 text-brand-400 hover:bg-brand-600 hover:text-white hover:border-transparent'
                        }`}
                      >
                        {e.status === 'encerrado' ? 'Encerrado' : 'Garantir Vaga'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY STATE SCREEN */
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#0f172a]/10 p-12 text-center max-w-md mx-auto animate-scale-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900/50 mx-auto text-zinc-500 border border-zinc-800/40 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold font-display text-white mb-2">Nenhum evento encontrado</h3>
              <p className="text-zinc-500 text-sm mb-6">
                Não conseguimos encontrar nenhum evento correspondente à sua pesquisa ou filtro atual. Tente reajustar suas buscas.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todos');
                }}
                className="rounded-lg bg-zinc-850 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </section>
      </div>
    </main>

    <Footer />
  </div>
  );
}
