import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'EventFlow - Plataforma SaaS de Gestão de Eventos',
  description: 'Crie eventos, gerencie inscrições online e valide ingressos via QR Code em tempo real. A plataforma ideal para organizadores e participantes.',
  keywords: 'eventos, ingressos, qr code, simpla, eventbrite, saas, nextjs, supabase',
  authors: [{ name: 'Antigravity AI' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EventFlow',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
