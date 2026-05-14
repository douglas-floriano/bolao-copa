'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getEcho } from '@/lib/echo';
import { useAuth } from '@/store/auth';

type PrizeDetail = { league: string; position: number; amount: number };
type Row = {
  id: number; name: string; avatar?: string; level: number;
  points: number; exact_count: number; winner_count: number;
  total_prize?: number;
  prize_leagues?: PrizeDetail[];
};

const fmt = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

export default function RankingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get('/ranking');
    setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
    const echo = getEcho();
    const ch = echo?.channel('championship.1');
    ch?.listen('.ranking.updated', load);
    return () => { ch?.stopListening('.ranking.updated'); };
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Ranking Global</h1>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className={`flex items-center gap-4 !p-4 ${idx === 0 ? 'ring-2 ring-gold' : idx === 1 ? 'ring-2 ring-silver' : idx === 2 ? 'ring-2 ring-bronze' : ''}`}>
                <div className="w-10 text-center font-black text-lg">
                  {idx === 0 ? <Trophy className="h-6 w-6 text-gold mx-auto" /> :
                   idx === 1 ? <Medal className="h-6 w-6 text-silver mx-auto" /> :
                   idx === 2 ? <Award className="h-6 w-6 text-bronze mx-auto" /> :
                   <span className="text-muted-foreground">#{idx + 1}</span>}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center font-bold text-white">
                  {r.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">Nível {r.level} · {r.exact_count} exatos · {r.winner_count} vencedor</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">{r.points}</div>
                  <div className="text-xs text-muted-foreground">pontos</div>
                </div>
                {!!r.total_prize && r.total_prize > 0 && (
                  <div className="text-right border-l border-border/40 pl-4" title={r.prize_leagues?.map((p) => `${p.league}: ${p.position}º ${fmt(p.amount)}`).join('\n')}>
                    <div className="text-lg font-black text-gold">{fmt(r.total_prize)}</div>
                    <div className="text-xs text-muted-foreground">prêmio</div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
