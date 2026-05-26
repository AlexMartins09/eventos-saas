'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { useState } from 'react';

export default function Navbar() {
  const { user, authenticated, logout } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Você saiu da sua conta.');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-800/50 bg-[#090d16]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Event<span className="text-brand-500">Flow</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Explorar
            </Link>
            
            {authenticated && user?.role === 'ADMIN' && (
              <>
                <Link href="/admin" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/checkin" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Ler Ingressos
                </Link>
              </>
            )}

            {authenticated && user?.role === 'PARTICIPANTE' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/30">
                Participante
              </span>
            )}

            {authenticated && user?.role === 'ADMIN' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Organizador
              </span>
            )}
          </div>

          {/* Desktop Right Auth Controls */}
          <div className="hidden md:flex items-center gap-4">
            {authenticated ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-zinc-400">{user?.email}</div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-600/15 hover:shadow-brand-600/30 transition-all duration-300"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/50 bg-[#090d16] px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-zinc-300 hover:text-white py-1"
          >
            Explorar Eventos
          </Link>
          
          {authenticated && user?.role === 'ADMIN' && (
            <>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-zinc-300 hover:text-white py-1"
              >
                Dashboard Organizador
              </Link>
              <Link
                href="/admin/checkin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-brand-400 hover:text-brand-300 py-1"
              >
                Leitor de Ingressos (Check-in)
              </Link>
            </>
          )}

          <div className="border-t border-zinc-800 pt-3">
            {authenticated ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-zinc-400">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Sair da Conta
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium text-zinc-300 hover:text-white py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-500 shadow-md shadow-brand-600/20 transition-all"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
