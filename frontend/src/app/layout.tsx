import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeaderDynamic } from '@/components/site-header-client';
import { ToasterDynamic } from '@/components/toaster-client';

export const metadata: Metadata = {
  title: 'Bolão Copa do Mundo 2026',
  description: 'Plataforma premium de palpites da Copa 2026 — Canadá / México / EUA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="min-h-screen bg-hero-gradient">
            <SiteHeaderDynamic />
            <main className="container py-8">{children}</main>
          </div>
          <ToasterDynamic richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
