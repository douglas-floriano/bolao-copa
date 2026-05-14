'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, MapPin, Lock, Pencil, Check, X, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';

type Team = { id: number; name: string; code: string; flag: string };
type Prediction = { home_score: number; away_score: number; points: number; exact: boolean; winner: boolean };
type Match = {
  id: number; phase: string; status: string; kickoff_at: string; stadium: string;
  home_team: Team | null; away_team: Team | null;
  home_score: number | null; away_score: number | null;
  home_placeholder?: string | null; away_placeholder?: string | null;
  predictions?: Prediction[];
  predictions_count?: number;
};

const phases: Record<string, string> = {
  group: 'Fase de Grupos', round_of_32: 'Round of 32', round_of_16: 'Oitavas',
  quarter: 'Quartas', semi: 'Semifinal', third_place: '3º Lugar', final: 'Final',
};

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [phaseFilter, setPhaseFilter] = useState<string>('group');
  const [predFilter, setPredFilter] = useState<'all' | 'pending' | 'done'>('all');

  async function load() {
    setLoading(true);
    const { data } = await api.get('/matches', { params: { phase: phaseFilter, per_page: 100 } });
    setMatches(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [phaseFilter]);

  const filtered = matches.filter((m) => {
    if (predFilter === 'all') return true;
    const has = (m.predictions?.length ?? 0) > 0;
    return predFilter === 'done' ? has : !has;
  });

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-black">Jogos</h1>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(phases).map(([k, v]) => (
              <Button key={k} size="sm" variant={phaseFilter === k ? 'premium' : 'outline'} onClick={() => setPhaseFilter(k)}>
                {v}
              </Button>
            ))}
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Palpites:</span>
            {[
              { k: 'all',     l: `Todos (${matches.length})` },
              { k: 'pending', l: `Sem palpite (${matches.filter((m) => !(m.predictions?.length)).length})` },
              { k: 'done',    l: `Já palpitei (${matches.filter((m) => (m.predictions?.length ?? 0) > 0).length})` },
            ].map(({ k, l }) => (
              <Button key={k} size="sm" variant={predFilter === k ? 'default' : 'ghost'} onClick={() => setPredFilter(k as any)}>
                {l}
              </Button>
            ))}
          </div>
        )}
      </header>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum jogo nesta seleção.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                canPredict={!!user}
                onLocalSave={(home, away) => {
                  setMatches((prev) =>
                    prev.map((x) =>
                      x.id === m.id
                        ? { ...x, predictions: [{ home_score: home, away_score: away, points: 0, exact: false, winner: false }] }
                        : x,
                    ),
                  );
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function clean(v: string) {
  const s = v.replace(/\D/g, '').replace(/^0+(\d)/, '$1').slice(0, 2);
  return s;
}

function MatchCard({ match, canPredict, onLocalSave }: { match: Match; canPredict: boolean; onLocalSave: (h: number, a: number) => void }) {
  const myPred = match.predictions?.[0];
  const [home, setHome] = useState(myPred ? String(myPred.home_score) : '');
  const [away, setAway] = useState(myPred ? String(myPred.away_score) : '');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setHome(myPred ? String(myPred.home_score) : '');
    setAway(myPred ? String(myPred.away_score) : '');
  }, [myPred?.home_score, myPred?.away_score]);

  const locked = new Date(match.kickoff_at).getTime() - Date.now() < 60 * 60 * 1000;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isAdminUser = (useAuth.getState().user as any)?.is_admin;
  const canEdit = canPredict && !isAdminUser && !locked && !isFinished && match.home_team && match.away_team;

  async function save() {
    setBusy(true);
    try {
      const h = Number(home);
      const a = Number(away);
      await api.put(`/matches/${match.id}/prediction`, { home_score: h, away_score: a });
      toast.success(`Palpite ${match.home_team?.code} ${h}×${a} ${match.away_team?.code} salvo!`);
      setEditing(false);
      onLocalSave(h, a);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar palpite.');
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setHome(myPred ? String(myPred.home_score) : '');
    setAway(myPred ? String(myPred.away_score) : '');
    setEditing(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`space-y-4 min-h-[330px] flex flex-col ${myPred ? 'ring-1 ring-primary/40' : ''}`}>
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span>{phases[match.phase]}</span>
          {isLive && <span className="text-red-500 font-bold animate-pulse">● AO VIVO</span>}
          {isFinished && <span className="text-emerald-500 font-bold">ENCERRADO</span>}
          {locked && !isFinished && !isLive && <span className="flex items-center gap-1 text-amber-500"><Lock className="h-3 w-3" /> Travado</span>}
        </div>

        <div className="grid grid-cols-3 items-center gap-3 min-h-[90px]">
          <TeamSide team={match.home_team} placeholder={match.home_placeholder} side="home" />
          <div className="text-center flex items-center justify-center h-full">
            {match.home_score !== null && match.away_score !== null ? (
              <div className="text-4xl font-black">{match.home_score}<span className="text-muted-foreground mx-2">×</span>{match.away_score}</div>
            ) : (
              <div className="text-3xl font-black text-muted-foreground">VS</div>
            )}
          </div>
          <TeamSide team={match.away_team} placeholder={match.away_placeholder} side="away" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(match.kickoff_at)}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.stadium}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-border/40">
          {!canPredict ? (
            <div className="text-xs text-muted-foreground italic text-center py-2">Faça login para palpitar.</div>
          ) : isAdminUser ? (
            <div className="text-xs text-amber-500 italic text-center py-2">Administradores não palpitam.</div>
          ) : myPred && !editing ? (
            <div className={`rounded-xl p-3 flex items-center gap-3 ${
              isFinished
                ? (myPred.exact ? 'bg-gold/10 ring-1 ring-gold/40' : myPred.winner ? 'bg-primary/10 ring-1 ring-primary/40' : 'bg-muted/40')
                : 'bg-primary/10 ring-1 ring-primary/30'
            }`}>
              <Sparkles className={`h-5 w-5 ${isFinished && myPred.exact ? 'text-gold' : 'text-primary'}`} />
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Seu palpite</div>
                <div className="text-xl font-black leading-none mt-0.5">{myPred.home_score} <span className="text-muted-foreground">×</span> {myPred.away_score}</div>
              </div>
              {isFinished ? (
                <span className={`px-3 py-1.5 rounded-lg text-sm font-black ${myPred.exact ? 'bg-gold text-black' : myPred.winner ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  +{myPred.points}
                </span>
              ) : canEdit ? (
                <Button size="icon" variant="ghost" onClick={() => setEditing(true)} title="Editar palpite">
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ) : canEdit ? (
            <div className="flex items-center gap-2">
              <Input inputMode="numeric" placeholder="0" value={home} onChange={(e) => setHome(clean(e.target.value))} className="w-16 text-center text-lg font-bold" />
              <span className="text-muted-foreground font-bold">×</span>
              <Input inputMode="numeric" placeholder="0" value={away} onChange={(e) => setAway(clean(e.target.value))} className="w-16 text-center text-lg font-bold" />
              <Button size="icon" variant="premium" onClick={save} disabled={busy || home === '' || away === ''} className="ml-auto" title="Salvar">
                <Check className="h-4 w-4" />
              </Button>
              {myPred && (
                <Button size="icon" variant="ghost" onClick={cancel} title="Cancelar">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-500 italic text-center py-2">
              {isFinished ? 'Você não palpitou neste jogo.' : 'Palpites encerrados para esta partida.'}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function TeamSide({ team, placeholder }: { team: Team | null; placeholder?: string | null; side?: string }) {
  if (!team) {
    return (
      <div className="flex flex-col items-center text-center h-[80px] justify-start">
        <div className="w-14 h-10 rounded bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
          {placeholder ?? '?'}
        </div>
        <span className="text-sm font-bold mt-1">—</span>
        <span className="text-xs text-muted-foreground">A definir</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center text-center h-[80px] justify-start">
      <Image src={team.flag} width={56} height={40} alt={team.code} className="rounded-md shadow-md" unoptimized />
      <span className="text-sm font-bold mt-1">{team.code}</span>
      <span className="text-xs text-muted-foreground line-clamp-1">{team.name}</span>
    </div>
  );
}
