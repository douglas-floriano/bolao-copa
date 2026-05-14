'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Lock } from 'lucide-react';
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

  async function load() {
    setLoading(true);
    const { data } = await api.get('/matches', { params: { phase: phaseFilter } });
    setMatches(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [phaseFilter]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-black">Jogos</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(phases).map(([k, v]) => (
            <Button
              key={k}
              size="sm"
              variant={phaseFilter === k ? 'premium' : 'outline'}
              onClick={() => setPhaseFilter(k)}
            >
              {v}
            </Button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {matches.map((m) => <MatchCard key={m.id} match={m} canPredict={!!user} onSaved={load} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function clean(v: string) {
  const s = v.replace(/\D/g, '').replace(/^0+(\d)/, '$1').slice(0, 2);
  return s;
}

function MatchCard({ match, canPredict, onSaved }: { match: Match; canPredict: boolean; onSaved: () => void }) {
  const myPred = match.predictions?.[0];
  const [home, setHome] = useState(myPred ? String(myPred.home_score) : '');
  const [away, setAway] = useState(myPred ? String(myPred.away_score) : '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (myPred) {
      setHome(String(myPred.home_score));
      setAway(String(myPred.away_score));
    }
  }, [myPred?.home_score, myPred?.away_score]);

  const locked = new Date(match.kickoff_at).getTime() - Date.now() < 60 * 60 * 1000;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  async function save() {
    setBusy(true);
    try {
      await api.put(`/matches/${match.id}/prediction`, {
        home_score: Number(home),
        away_score: Number(away),
      });
      toast.success('Palpite salvo!');
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao salvar palpite.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <Card className="space-y-4 min-h-[280px] flex flex-col">
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

        <div className="mt-auto pt-2 border-t border-border/40 space-y-2">
          {myPred && (
            <div className="text-xs flex items-center gap-2">
              <span className="text-muted-foreground">Seu palpite:</span>
              <span className="font-bold">{myPred.home_score} × {myPred.away_score}</span>
              {isFinished && (
                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${myPred.exact ? 'bg-gold/20 text-gold' : myPred.winner ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  +{myPred.points} pts
                </span>
              )}
            </div>
          )}
          {canPredict && !locked && !isFinished && match.home_team && match.away_team ? (
            <div className="flex items-center gap-2">
              <Input inputMode="numeric" placeholder="0" value={home} onChange={(e) => setHome(clean(e.target.value))} className="w-16 text-center" />
              <span className="text-muted-foreground">×</span>
              <Input inputMode="numeric" placeholder="0" value={away} onChange={(e) => setAway(clean(e.target.value))} className="w-16 text-center" />
              <Button size="sm" variant="premium" onClick={save} disabled={busy || home === '' || away === ''} className="ml-auto">
                {busy ? '...' : myPred ? 'Atualizar' : 'Palpitar'}
              </Button>
            </div>
          ) : !canPredict ? (
            <div className="text-xs text-muted-foreground italic">Faça login para palpitar.</div>
          ) : isFinished ? null : (
            <div className="text-xs text-amber-500 italic">Palpites encerrados para esta partida.</div>
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
