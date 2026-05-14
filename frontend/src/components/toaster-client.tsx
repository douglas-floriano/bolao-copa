'use client';
import dynamic from 'next/dynamic';

export const ToasterDynamic = dynamic(
  () => import('sonner').then((m) => m.Toaster),
  { ssr: false },
);
