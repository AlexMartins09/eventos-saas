'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Cadastro() {
  const { register, error, clearError, authenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  // Obter role pré-selecionada da URL se existir
  const urlRole = searchParams.get('role');
  const initialRole = urlRole === 'ADMIN' ? 'ADMIN' : 'PARTICIPANTE';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PARTICIPANTE'>(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se já estiver logado, redireciona
  useEffect(() => {
    if (authenticated) {
      router.push(redirect);
    }
    return () => clearError();
  }, [authenticated, redirect, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Preencha os campos obrigatórios (*).');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const success = await register(name, email, phone, password, role);
    setIsSubmitting(false);

    if (success) {
      toast.success('Conta criada com sucesso! Sessão iniciada.');
      router.push(redirect);
      router.refresh();
    } else {
      toast.error(error || 'Erro ao realizar cadastro. Tente outro e-mail.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg animate-scale-in">
          {/* Caixa de Cadastro Glassmorphic */}
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/45 p-8 shadow-2xl backdrop-blur-md">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-white">Criar nova conta</h2>
              <p className="text-zinc-500 text-sm mt-2">Junte-se à maior rede inteligente de eventos e ingressos</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* CARTÕES SELETORES DE PERFIL (ROLE) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Selecione seu Perfil de Usuário
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Card Participante */}
                  <button
                    type="button"
                    onClick={() => setRole('PARTICIPANTE')}
                    className={`rounded-2xl p-4 text-left border cursor-pointer transition-all duration-300 ${
                      role === 'PARTICIPANTE'
                        ? 'bg-brand-500/10 border-brand-500/50 text-white shadow-md shadow-brand-500/10'
                        : 'bg-[#0c1220]/60 border-zinc-800/60 text-zinc-400 hover:border-zinc-700/60 hover:bg-[#0c1220]/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${role === 'PARTICIPANTE' ? 'text-brand-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-bold font-display text-sm">Participante</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Quero descobrir eventos e garantir ingressos online com QR Code.
                    </p>
                  </button>

                  {/* Card Admin */}
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`rounded-2xl p-4 text-left border cursor-pointer transition-all duration-300 ${
                      role === 'ADMIN'
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-[#0c1220]/60 border-zinc-800/60 text-zinc-400 hover:border-zinc-700/60 hover:bg-[#0c1220]/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg className={`w-5 h-5 ${role === 'ADMIN' ? 'text-indigo-400' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-bold font-display text-sm">Organizador</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Quero publicar eventos, acompanhar relatórios e ler QR Codes.
                    </p>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>

              {/* Duas colunas para e-mail e telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Crie uma Senha Forte * (mín. 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-[#0c1220]/90 text-white placeholder-zinc-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
                />
              </div>

              {/* Botão Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 py-3.5 text-sm font-semibold text-white hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-600/15 hover:shadow-brand-600/35 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cadastrando...
                  </>
                ) : (
                  'Registrar Conta Segura'
                )}
              </button>
            </form>

            {/* Rodapé */}
            <div className="mt-8 text-center text-sm border-t border-zinc-800/40 pt-6">
              <span className="text-zinc-500">Já tem uma conta? </span>
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Faça login aqui
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
