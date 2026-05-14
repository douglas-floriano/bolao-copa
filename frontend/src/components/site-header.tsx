'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';

const publicNav = [
  { href: '/matches', label: 'Jogos' },
  { href: '/standings', label: 'Tabela' },
];
const authNav = [
  { href: '/leagues', label: 'Ligas' },
];
const adminNav = [
  { href: '/ranking', label: 'Ranking' },
];

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const { user, clear } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            Bolão Copa 2026
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {publicNav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
              {n.label}
            </Link>
          ))}
          {mounted && user && authNav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
              {n.label}
            </Link>
          ))}
          {mounted && user?.is_admin && adminNav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
              {n.label}
            </Link>
          ))}
          {mounted && user?.is_admin && (
            <Link href="/admin" className="px-3 py-2 text-sm font-semibold text-accent">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="theme">
            {mounted ? (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <span className="h-4 w-4" />}
          </Button>
          {mounted && user ? (
            <Button variant="outline" size="sm" onClick={clear}>
              Sair
            </Button>
          ) : mounted ? (
            <Button asChild size="sm" variant="premium">
              <Link href="/login">Entrar</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
