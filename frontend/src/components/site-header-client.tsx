'use client';
import dynamic from 'next/dynamic';

export const SiteHeaderDynamic = dynamic(
  () => import('./site-header').then((m) => m.SiteHeader),
  { ssr: false, loading: () => <div className="h-16 border-b border-border/40" /> },
);
