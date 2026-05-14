import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from 'sonner';

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
            <SiteHeader />
            <main className="container py-8">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
