'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ points: 0, exact: 0, winner: 0, predictions: 0 });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/predictions').then(({ data }) => {
      const arr = data.data ?? [];
      setStats({
        predictions: arr.length,
        points: arr.reduce((s: number, p: any) => s + p.points, 0),
        exact: arr.filter((p: any) => p.exact).length,
        winner: arr.filter((p: any) => p.winner).length,
      });
    });
  }, [user]);

  if (!user) return null;

  const cards = [
    { icon: Trophy, label: 'Pontuação total', value: stats.points, color: 'text-gold' },
    { icon: Target, label: 'Placares exatos', value: stats.exact, color: 'text-primary' },
    { icon: Flame,  label: 'Acertos de vencedor', value: stats.winner, color: 'text-orange-500' },
    { icon: TrendingUp, label: 'Total de palpites', value: stats.predictions, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black">Olá, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">Nível {user.level} · {user.xp} XP</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <c.icon className={`h-8 w-8 ${c.color} mb-3`} />
              <div className="text-3xl font-black">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
