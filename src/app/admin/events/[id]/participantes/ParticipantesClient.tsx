'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { Registration, Event } from '@/lib/types';

interface ParticipantesClientProps {
  id: string;
}

export default function ParticipantesClient({ id }: ParticipantesClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Carregar dados
  const loadData = async () => {
    if (!id) return;
    try {
      // 1. Buscar evento
      const eventRes = await fetch(`/api/events/${id}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
      } else {
        toast.error('Evento não localizado.');
        router.push('/admin');
        return;
      }

      // 2. Buscar inscrições
      const regsRes = await fetch(`/api/registrations?event_id=${id}`);
      if (regsRes.ok) {
        const regsData = await regsRes.json();
        setRegistrations(regsData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro de conexão ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Executar Check-in Manual
  const handleConfirmCheckin = async (regId: string, name: string) => {
    setTogglingId(regId);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: regId })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Check-in manual de ${name} realizado! Entrada Liberada.`);
        await loadData(); // Recarrega lista
      } else {
        toast.error(data.error || 'Erro ao processar check-in.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setTogglingId(null);
    }
  };

  // Desfazer Check-in Manual
  const handleUndoCheckin = async (regId: string, name: string) => {
    if (!confirm(`Deseja realmente cancelar o check-in de ${name}? O acesso dele será bloqueado até nova validação.`)) {
      return;
    }

    setTogglingId(regId);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: regId, undo: true })
      });

      const data = await res.json();

      if (res.ok) {
        toast.info(`Check-in de ${name} cancelado com sucesso.`);
        await loadData();
      } else {
        toast.error(data.error || 'Erro ao cancelar check-in.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setTogglingId(null);
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

  // Filtrar participantes por busca
  const filteredRegistrations = registrations.filter((r) => {
    const name = r.user?.name || '';
    const email = r.user?.email || '';
    const code = r.unique_token?.substring(0, 8) || '';
    
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // KPIs locais para este evento específico
  const totalInscritos = registrations.length;
  const totalConfirmados = registrations.filter((r) => r.checkin_done).length;
  const totalAusentes = totalInscritos - totalConfirmados;

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
        <p className="text-zinc-400">Buscando participantes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 mb-2">
            &larr; Voltar para Dashboard
          </Link>
          <h2 className="font-display font-extrabold text-2xl text-white line-clamp-1">
            Participantes: {event?.title}
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Gerenciador de inscrições e controle de acessos manual</p>
        </div>
      </div>

      {/* MINI CARDS DE PERFORMANCE */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-4 text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Inscritos</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{totalInscritos}</span>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-4 text-center">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Presentes</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{totalConfirmados}</span>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#0f172a]/20 p-4 text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Ausentes</span>
          <span className="text-2xl font-extrabold text-zinc-400 mt-1 block">{totalAusentes}</span>
        </div>
      </div>

      {/* CONSOLE DE PESQUISA */}
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Pesquisar por nome, e-mail ou código do ingresso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-[#0c1220]/80 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 text-xs transition-all"
          />
        </div>
      </div>

      {/* TABELA DE PARTICIPANTES */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0f172a]/35 overflow-hidden shadow-sm">
        
        {filteredRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/60 text-xs font-bold text-zinc-500 uppercase bg-[#090d16]/30">
                  <th className="p-4">Nome / Dados</th>
                  <th className="p-4">Código Ingresso</th>
                  <th className="p-4">Inscrito Em</th>
                  <th className="p-4">Status Entrada</th>
                  <th className="p-4">Horário Check-in</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-sm">
                {filteredRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/10 transition-colors">
                    
                    {/* Dados do usuário */}
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-white block leading-tight">{r.user?.name}</span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">{r.user?.email}</span>
                        {r.user?.phone && (
                          <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">📞 {r.user.phone}</span>
                        )}
                      </div>
                    </td>

                    {/* Código do Ingresso */}
                    <td className="p-4 font-mono text-xs font-bold text-brand-400">
                      #{r.unique_token.substring(0, 8).toUpperCase()}
                    </td>

                    {/* Inscrito Em */}
                    <td className="p-4 text-zinc-400 text-xs font-mono">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Status Check-in */}
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        r.checkin_done
                          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
                      }`}>
                        {r.checkin_done ? 'Presente' : 'Ausente'}
                      </span>
                    </td>

                    {/* Horário do Check-in */}
                    <td className="p-4 text-zinc-400 text-xs font-mono">
                      {r.checkin_at ? formatDate(r.checkin_at) : '-'}
                    </td>

                    {/* Ações de Check-in Manual */}
                    <td className="p-4 text-right">
                      {r.checkin_done ? (
                        /* Botão Desfazer Check-in */
                        <button
                          onClick={() => handleUndoCheckin(r.id, r.user?.name || '')}
                          disabled={togglingId === r.id}
                          className="rounded-lg border border-rose-900/40 bg-rose-950/15 hover:bg-rose-950/30 text-rose-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {togglingId === r.id ? 'Cancelando...' : 'Desfazer'}
                        </button>
                      ) : (
                        /* Botão Confirmar Check-in */
                        <button
                          onClick={() => handleConfirmCheckin(r.id, r.user?.name || '')}
                          disabled={togglingId === r.id}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {togglingId === r.id ? 'Gravando...' : 'Confirmar Entry'}
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-500 text-sm">
            Nenhum participante encontrado para os filtros atuais.
          </div>
        )}

      </div>

    </div>
  );
}
