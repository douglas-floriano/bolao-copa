'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';
import { formatDate } from '@/lib/utils';

const phases: Record<string, string> = {
  group: 'Fase de Grupos', round_of_32: 'Round of 32', round_of_16: 'Oitavas',
  quarter: 'Quartas', semi: 'Semifinal', third_place: '3º Lugar', final: 'Final',
};

type Team = { id: number; name: string; code: string };
type Group = { id: number; name: string };
type Match = {
  id: number; phase: string; status: string; kickoff_at: string; stadium: string;
  home_team: Team | null; away_team: Team | null;
  home_score: number | null; away_score: number | null;
  group: Group | null;
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [phase, setPhase] = useState('group');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get('/matches', { params: { phase, per_page: 100 } });
    setMatches(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/'); return; }
    load();
  }, [user, phase]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => m.group?.name && set.add(m.group.name));
    return Array.from(set).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (groupFilter !== 'all' && m.group?.name !== groupFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [matches, groupFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: matches.length,
    scheduled: matches.filter((m) => m.status === 'scheduled').length,
    live: matches.filter((m) => m.status === 'live').length,
    finished: matches.filter((m) => m.status === 'finished').length,
  }), [matches]);

  function updateMatchLocal(updated: Match) {
    setMatches((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
  }

  if (!user?.is_admin) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black">Painel administrativo</h1>
        <p className="text-muted-foreground text-sm">
          Lance resultados oficiais. Pontuação, classificação e bracket recalculam automaticamente.
        </p>
        <div className="flex gap-4 text-xs">
          <span className="text-muted-foreground">Total: <b className="text-foreground">{counts.total}</b></span>
          <span className="text-muted-foreground">Agendados: <b className="text-foreground">{counts.scheduled}</b></span>
          <span className="text-red-500">Ao vivo: <b>{counts.live}</b></span>
          <span className="text-emerald-500">Encerrados: <b>{counts.finished}</b></span>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(phases).map(([k, v]) => (
            <Button key={k} size="sm" variant={phase === k ? 'premium' : 'outline'} onClick={() => { setPhase(k); setGroupFilter('all'); }}>
              {v}
            </Button>
          ))}
        </div>

        {phase === 'group' && groups.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Grupo:</span>
            <Button size="sm" variant={groupFilter === 'all' ? 'default' : 'ghost'} onClick={() => setGroupFilter('all')}>Todos</Button>
            {groups.map((g) => (
              <Button key={g} size="sm" variant={groupFilter === g ? 'default' : 'ghost'} onClick={() => setGroupFilter(g)}>
                {g}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Status:</span>
          {[
            { k: 'all',       l: 'Todos' },
            { k: 'scheduled', l: 'Agendados' },
            { k: 'live',      l: 'Ao vivo' },
            { k: 'finished',  l: 'Encerrados' },
          ].map(({ k, l }) => (
            <Button key={k} size="sm" variant={statusFilter === k ? 'default' : 'ghost'} onClick={() => setStatusFilter(k)}>
              {l}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum jogo nesta seleção.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => <AdminMatchRow key={m.id} match={m} onUpdated={updateMatchLocal} />)}
        </div>
      )}
    </div>
  );
}

function clean(v: string) {
  return v.replace(/\D/g, '').replace(/^0+(\d)/, '$1').slice(0, 2);
}

function AdminMatchRow({ match, onUpdated }: { match: Match; onUpdated: (m: Match) => void }) {
  const [h, setH] = useState<string>(match.home_score?.toString() ?? '');
  const [a, setA] = useState<string>(match.away_score?.toString() ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setH(match.home_score?.toString() ?? '');
    setA(match.away_score?.toString() ?? '');
  }, [match.home_score, match.away_score]);

  async function save(status: string) {
    setBusy(true);
    try {
      const payload: any = { status };
      if (status === 'scheduled') {
        payload.home_score = null;
        payload.away_score = null;
      } else {
        payload.home_score = Number(h || 0);
        payload.away_score = Number(a || 0);
      }
      const { data } = await api.put(`/admin/matches/${match.id}/result`, payload);
      toast.success(
        status === 'scheduled' ? `${match.home_team?.code}×${match.away_team?.code}: revertido` :
        status === 'live'      ? `${match.home_team?.code}×${match.away_team?.code}: ao vivo` :
        `${match.home_team?.code} ${data.home_score}×${data.away_score} ${match.away_team?.code} · encerrado`
      );
      onUpdated({ ...match, ...data });
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally {
      setBusy(false);
    }
  }

  const statusBadge =
    match.status === 'live' ? 'bg-red-500/20 text-red-500 animate-pulse' :
    match.status === 'finished' ? 'bg-emerald-500/20 text-emerald-500' :
    'bg-muted text-muted-foreground';

  return (
    <Card className="!p-4 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[260px]">
        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
          {match.group ? `Grupo ${match.group.name} · ` : ''}{formatDate(match.kickoff_at)}
        </div>
        <div className="font-bold">
          {match.home_team?.name ?? '?'} <span className="text-muted-foreground">×</span> {match.away_team?.name ?? '?'}
        </div>
      </div>
      <Input inputMode="numeric" value={h} onChange={(e) => setH(clean(e.target.value))} className="w-16 text-center font-bold" placeholder="0" />
      <span className="text-muted-foreground">×</span>
      <Input inputMode="numeric" value={a} onChange={(e) => setA(clean(e.target.value))} className="w-16 text-center font-bold" placeholder="0" />
      <span className={`text-[10px] font-bold px-2 py-1 rounded ${statusBadge}`}>
        {match.status === 'live' ? 'AO VIVO' : match.status === 'finished' ? 'ENCERRADO' : 'AGENDADO'}
      </span>
      {match.status !== 'scheduled' && (
        <Button size="sm" variant="ghost" onClick={() => save('scheduled')} disabled={busy}>Reverter</Button>
      )}
      <Button size="sm" variant="outline" onClick={() => save('live')} disabled={busy || match.status === 'live'}>Ao vivo</Button>
      <Button size="sm" variant="premium" onClick={() => save('finished')} disabled={busy}>Encerrar</Button>
    </Card>
  );
}
