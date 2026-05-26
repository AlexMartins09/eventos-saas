'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mx-auto mb-4" />
          <p className="text-zinc-400">Verificando credenciais de organizador...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Links do painel lateral
  const navLinks = [
    {
      name: 'Painel Geral',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: 'Validar Entrada',
      href: '/admin/checkin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* BARRA LATERAL DE NAVEGAÇÃO INTERNA */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-zinc-800/80 bg-[#0f172a]/30 p-5 space-y-6 sticky top-24 backdrop-blur-md">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Menu Organizador</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Gerenciador administrativo</p>
              </div>

              {/* Lista de Links */}
              <nav className="space-y-1.5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer ${
                        isActive
                          ? 'bg-brand-500/10 border-brand-500/35 text-brand-400'
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 hover:border-zinc-800'
                      }`}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-zinc-800/60 pt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="text-xs font-semibold text-zinc-300 block leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-zinc-500 block truncate">{user?.email}</span>
                </div>
              </div>

            </div>
          </aside>

          {/* ÁREA DE CONTEÚDO PRINCIPAL DO PAINEL */}
          <section className="lg:col-span-3 min-h-[480px]">
            {children}
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
