'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);

  async function load() {
    const { data } = await api.get('/matches', { params: { phase: 'group' } });
    setMatches(data.data ?? data);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/'); return; }
    load();
  }, [user]);

  if (!user?.is_admin) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Painel administrativo</h1>
      <p className="text-muted-foreground">Lance resultados oficiais. Pontuação e classificação recalculam automaticamente.</p>
      <div className="space-y-2">
        {matches.map((m) => <AdminMatchRow key={m.id} match={m} onSaved={load} />)}
      </div>
    </div>
  );
}

function AdminMatchRow({ match, onSaved }: { match: any; onSaved: () => void }) {
  const [h, setH] = useState<string>(match.home_score ?? '');
  const [a, setA] = useState<string>(match.away_score ?? '');

  async function save(status: string) {
    try {
      const payload: any = { status };
      if (status === 'scheduled') {
        payload.home_score = null;
        payload.away_score = null;
      } else {
        payload.home_score = Number(h);
        payload.away_score = Number(a);
      }
      await api.put(`/admin/matches/${match.id}/result`, payload);
      toast.success(
        status === 'scheduled' ? 'Status revertido para Agendado' :
        status === 'live' ? 'Marcado como Ao vivo' :
        'Resultado salvo · ranking recalculado'
      );
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    }
  }

  return (
    <Card className="!p-4 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="text-xs text-muted-foreground">{formatDate(match.kickoff_at)}</div>
        <div className="font-bold">{match.home_team?.name ?? '?'} × {match.away_team?.name ?? '?'}</div>
      </div>
      <Input type="number" min={0} value={h} onChange={(e) => setH(e.target.value)} className="w-20 text-center" />
      <span>×</span>
      <Input type="number" min={0} value={a} onChange={(e) => setA(e.target.value)} className="w-20 text-center" />
      <span className={`text-xs font-bold px-2 py-1 rounded ${match.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' : match.status === 'finished' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
        {match.status === 'live' ? 'AO VIVO' : match.status === 'finished' ? 'ENCERRADO' : 'AGENDADO'}
      </span>
      {match.status !== 'scheduled' && (
        <Button size="sm" variant="ghost" onClick={() => save('scheduled')}>Reverter</Button>
      )}
      <Button size="sm" variant="outline" onClick={() => save('live')} disabled={match.status === 'live'}>Ao vivo</Button>
      <Button size="sm" variant="premium" onClick={() => save('finished')}>Encerrar</Button>
    </Card>
  );
}
