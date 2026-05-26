'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/40 bg-[#060910] text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-white">
                Event<span className="text-brand-500">Flow</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Plataforma SaaS de gestão de eventos inteligente, moderna e segura.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Explorar
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">Suporte</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">Termos</span>
          </div>

          {/* Copyrights */}
          <div className="text-xs text-zinc-500 md:text-right">
            &copy; {new Date().getFullYear()} EventFlow. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
