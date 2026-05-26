'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { EventStatus } from '@/lib/types';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalRegistrations: number;
  confirmedCheckins: number;
  registrationsPerEvent: { title: string; count: number }[];
  checkinRatio: { label: string; count: number }[];
}

interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  max_participants: number;
  registered_count: number;
  present_count: number;
  status: EventStatus;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Carregar dados de estatísticas do administrador
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setEvents(data.events);
      } else {
        toast.error('Erro ao compilar dados do painel.');
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Excluir Evento
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o evento "${title}"? Todas as inscrições ligadas a ele serão apagadas!`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Evento "${title}" excluído com sucesso.`);
        // Recarregar os dados locais para atualizar o painel
        await loadDashboardData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao excluir evento.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao excluir evento.');
    } finally {
      setDeletingId(null);
    }
  };

  // Formatar datas no padrão PT-BR
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="h-10 w-1/3 bg-zinc-800/30 rounded animate-pulse" />
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 animate-pulse" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 animate-pulse" />
          <div className="h-64 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 animate-pulse" />
        </div>
      </div>
    );
  }

  // Cálculos rápidos de percentual
  const checkinRate = stats?.totalRegistrations 
    ? Math.round((stats.confirmedCheckins / stats.totalRegistrations) * 100) 
    : 0;

  // Encontrar o maior número de inscrições para servir de base no gráfico
  const maxRegistrationCount = stats?.registrationsPerEvent.reduce(
    (max, item) => (item.count > max ? item.count : max), 
    1
  ) || 1;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-3xl text-white">Painel Organizador</h2>
          <p className="text-zinc-500 text-sm mt-0.5">Visão geral do desempenho e controle de ingressos</p>
        </div>
        
        <Link
          href="/admin/events/novo"
          className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/15 hover:shadow-brand-600/35 transition-all duration-300 flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Criar Novo Evento
        </Link>
      </div>

      {/* METRICAS KPI GRID (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card Total Eventos */}
        <div className="rounded-2xl border border-zinc-800/70 bg-[#0f172a]/20 p-5 shadow-sm">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block">Total de Eventos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-display">{stats?.totalEvents}</span>
            <span className="text-xs text-brand-400 font-medium">Cadastrados</span>
          </div>
        </div>

        {/* Card Eventos Ativos */}
        <div className="rounded-2xl border border-zinc-800/70 bg-[#0f172a]/20 p-5 shadow-sm">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block">Eventos Ativos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-display">{stats?.activeEvents}</span>
            <span className="text-xs text-zinc-500 font-medium">Recebendo vagas</span>
          </div>
        </div>

        {/* Card Total Inscritos */}
        <div className="rounded-2xl border border-zinc-800/70 bg-[#0f172a]/20 p-5 shadow-sm">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block">Ingressos Emitidos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-400 font-display">{stats?.totalRegistrations}</span>
            <span className="text-xs text-zinc-500 font-medium">Inscrições online</span>
          </div>
        </div>

        {/* Card Taxa de Check-in */}
        <div className="rounded-2xl border border-zinc-800/70 bg-[#0f172a]/20 p-5 shadow-sm">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block">Taxa de Presença</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-display">{checkinRate}%</span>
            <span className="text-xs text-emerald-400 font-medium font-mono">{stats?.confirmedCheckins} confirmados</span>
          </div>
        </div>

      </div>

      {/* GRAFICOS INTERATIVOS PREMIUM (Pure CSS/HTML) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Inscrições por Evento */}
        <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 shadow-sm flex flex-col h-[340px]">
          <div>
            <h3 className="font-display font-bold text-base text-white">Top Inscrições por Evento</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Maiores índices de preenchimento de vagas</p>
          </div>

          <div className="flex-grow flex flex-col justify-center gap-4 mt-6">
            {stats?.registrationsPerEvent && stats.registrationsPerEvent.length > 0 ? (
              stats.registrationsPerEvent.map((item, idx) => {
                const percentage = Math.round((item.count / maxRegistrationCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5 animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300 truncate max-w-[220px]">{item.title}</span>
                      <span className="text-white font-mono">{item.count} inscritos</span>
                    </div>
                    {/* Barra de Progresso Customizada */}
                    <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-500 shadow-md shadow-brand-500/10 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Nenhum dado de inscrição disponível para gerar o gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Presença e Faltas (Check-ins) */}
        <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 p-6 shadow-sm flex flex-col h-[340px]">
          <div>
            <h3 className="font-display font-bold text-base text-white">Comparecimento (Check-ins)</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Relação de participantes presentes vs faltantes</p>
          </div>

          <div className="flex-grow flex flex-col justify-center gap-6 mt-6">
            <div className="space-y-4">
              
              {/* Barra Única Comparativa */}
              <div className="w-full h-8 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex shadow-inner">
                {stats?.totalRegistrations && stats.totalRegistrations > 0 ? (
                  <>
                    {/* Presentes */}
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000"
                      style={{ width: `${checkinRate}%` }}
                      title={`${stats.confirmedCheckins} Presentes`}
                    >
                      {checkinRate > 15 && `${checkinRate}%`}
                    </div>
                    {/* Faltantes */}
                    <div
                      className="h-full bg-gradient-to-r from-zinc-800 to-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 transition-all duration-1000"
                      style={{ width: `${100 - checkinRate}%` }}
                      title={`${stats.totalRegistrations - stats.confirmedCheckins} Faltantes`}
                    >
                      {(100 - checkinRate) > 15 && `${100 - checkinRate}%`}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-semibold">
                    Sem inscrições realizadas
                  </div>
                )}
              </div>

              {/* Legenda Customizada */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                <div className="flex gap-3 items-start">
                  <div className="h-4 w-4 rounded bg-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Presentes</span>
                    <p className="text-lg font-bold text-white leading-tight mt-0.5">
                      {stats?.confirmedCheckins || 0}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-medium">Entrada efetuada</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="h-4 w-4 rounded bg-zinc-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Ausentes</span>
                    <p className="text-lg font-bold text-white leading-tight mt-0.5">
                      {stats ? stats.totalRegistrations - stats.confirmedCheckins : 0}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium">Aguardando check-in</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* CONSOLE DE EVENTOS ADMINISTRATIVOS (TABELA) */}
      <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/35 overflow-hidden shadow-sm">
        
        {/* Header Tabela */}
        <div className="p-6 border-b border-zinc-800/60 bg-[#0f172a]/15">
          <h3 className="font-display font-bold text-lg text-white">Eventos Sob Sua Gestão</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Monitore vendas, confira check-ins e altere dados em tempo real</p>
        </div>

        {/* Listagem */}
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 text-xs font-bold text-zinc-500 uppercase bg-[#090d16]/30">
                  <th className="p-5">Nome do Evento</th>
                  <th className="p-5">Data / Hora</th>
                  <th className="p-5 text-center">Vendas / Limite</th>
                  <th className="p-5 text-center">Comparecimento</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-900/10 transition-colors">
                    
                    {/* Nome do Evento */}
                    <td className="p-5 font-semibold text-white">
                      <Link href={`/evento/${e.slug}`} className="hover:text-brand-400 transition-colors line-clamp-1">
                        {e.title}
                      </Link>
                    </td>

                    {/* Data/Hora */}
                    <td className="p-5 text-zinc-400 text-xs font-mono">
                      {formatDate(e.event_date)}
                    </td>

                    {/* Vagas */}
                    <td className="p-5 text-center font-mono text-zinc-300">
                      <span className="font-bold text-white">{e.registered_count}</span>
                      <span className="text-zinc-600"> / {e.max_participants}</span>
                    </td>

                    {/* Comparecimento */}
                    <td className="p-5 text-center">
                      <span className="px-2 py-1 rounded bg-zinc-900 font-mono text-xs border border-zinc-800/60">
                        <strong className="text-emerald-400">{e.present_count}</strong>
                        <span className="text-zinc-600"> / {e.registered_count}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        e.status === 'ativo'
                          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                          : e.status === 'lotado'
                          ? 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                      }`}>
                        {e.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="p-5 text-right">
                      <div className="flex gap-2 justify-end">
                        
                        {/* Copiar Link Público */}
                        <button
                          onClick={() => {
                            const publicUrl = `${window.location.origin}/evento/${e.slug}`;
                            navigator.clipboard.writeText(publicUrl);
                            toast.success('Link do participante copiado para a área de transferência!');
                          }}
                          className="p-2 rounded-lg border border-zinc-800 hover:border-brand-500/30 hover:bg-brand-500/10 text-zinc-400 hover:text-brand-400 transition-all cursor-pointer"
                          title="Copiar Link de Inscrição"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 5h7m-7 4h7" />
                          </svg>
                        </button>

                        {/* Participantes */}
                        <Link
                          href={`/admin/events/${e.id}/participantes`}
                          className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30 text-zinc-400 hover:text-white transition-all"
                          title="Ver participantes e inscrições"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </Link>

                        {/* Editar */}
                        <Link
                          href={`/admin/events/${e.id}/editar`}
                          className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30 text-zinc-400 hover:text-white transition-all"
                          title="Editar detalhes do evento"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>

                        {/* Excluir */}
                        <button
                          onClick={() => handleDeleteEvent(e.id, e.title)}
                          disabled={deletingId === e.id}
                          className="p-2 rounded-lg border border-zinc-800 hover:border-rose-900/40 hover:bg-rose-950/20 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Excluir evento permanentemente"
                        >
                          {deletingId === e.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tabela Vazia */
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h4 className="text-base font-semibold text-white mb-1">Nenhum evento criado</h4>
            <p className="text-zinc-500 text-xs mb-4">Você ainda não possui nenhum evento cadastrado na plataforma.</p>
            <Link
              href="/admin/events/novo"
              className="inline-flex rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Criar Primeiro Evento
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}
