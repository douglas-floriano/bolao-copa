'use client';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echo: Echo | null = null;

export function getEcho() {
  if (typeof window === 'undefined') return null;
  if (echo) return echo;
  (window as any).Pusher = Pusher;
  echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST!,
    wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 6001),
    forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === 'https',
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: 'mt1',
  });
  return echo;
}
