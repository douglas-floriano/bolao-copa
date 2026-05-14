'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/admin', label: 'Resultados' },
  { href: '/admin/users', label: 'Usuários' },
  { href: '/admin/leagues', label: 'Ligas' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-border/40 pb-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition',
              path === t.href ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
