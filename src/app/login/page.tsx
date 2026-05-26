'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Login() {
  const { login, error, clearError, authenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se já estiver autenticado, redireciona imediatamente
  useEffect(() => {
    if (authenticated) {
      router.push(redirect);
    }
    return () => clearError();
  }, [authenticated, redirect, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      toast.success('Login realizado com sucesso! Bem-vindo de volta.');
      router.push(redirect);
      router.refresh();
    } else {
      toast.error(error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-scale-in">
          {/* Caixa de Login Glassmorphism */}
          <div className="rounded-3xl border border-zinc-800/80 bg-[#0f172a]/45 p-8 shadow-2xl backdrop-blur-md">
            
            {/* Header da Caixa */}
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-3xl text-white">Bem-vindo de volta</h2>
              <p className="text-zinc-500 text-sm mt-2">Insira suas credenciais para gerenciar seus eventos</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Campo Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Endereço de E-mail
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

              {/* Campo Senha */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Sua Senha
                  </label>
                  
                  {/* Link falso de recuperação para demonstrar conformidade sem quebrar rota */}
                  <button
                    type="button"
                    onClick={() => toast.info('Funcionalidade de recuperação simulada. As senhas dos usuários de teste são "admin123" e "user123".')}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                
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
                    Autenticando...
                  </>
                ) : (
                  'Entrar na Plataforma'
                )}
              </button>
            </form>

            {/* Rodapé da Caixa */}
            <div className="mt-8 text-center text-sm border-t border-zinc-800/40 pt-6">
              <span className="text-zinc-500">Novo por aqui? </span>
              <Link
                href={`/cadastro?redirect=${encodeURIComponent(redirect)}`}
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Crie uma conta gratuita
              </Link>
            </div>

            {/* Dica visível de demonstração */}
            <div className="mt-6 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-center">
              <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">🚀 Contas de Demonstração</span>
              <span className="text-[11px] text-zinc-400 block">Admin: <strong className="text-white">admin@eventflow.com</strong> (admin123)</span>
              <span className="text-[11px] text-zinc-400 block">User: <strong className="text-white">participante@gmail.com</strong> (user123)</span>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
