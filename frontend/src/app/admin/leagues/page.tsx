'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Medal, Award, Coins, Users, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';

type RankRow = {
  id: number; name: string; level: number;
  points: number; entry_paid: number; paid: boolean;
  position: number; prize_percent: number; prize_amount: number;
};

const fmt = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

export default function AdminLeaguesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [rankings, setRankings] = useState<Record<number, RankRow[]>>({});
  const [open, setOpen] = useState<Record<number, boolean>>({});

  async function load() {
    const { data } = await api.get('/leagues');
    setLeagues(data);
  }

  async function loadRanking(leagueId: number) {
    if (rankings[leagueId]) return;
    const { data } = await api.get(`/leagues/${leagueId}/ranking`);
    setRankings((prev) => ({ ...prev, [leagueId]: data }));
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/'); return; }
    load();
  }, [user]);

  function toggle(leagueId: number) {
    const next = !open[leagueId];
    setOpen((p) => ({ ...p, [leagueId]: next }));
    if (next) loadRanking(leagueId);
  }

  if (!user?.is_admin) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Ligas</h1>
        <p className="text-muted-foreground text-sm">Visualize ranking, pagamentos e prêmios de cada liga.</p>
      </header>

      {leagues.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Nenhuma liga criada.{' '}
          <Link href="/leagues" className="text-primary underline">Criar agora</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((l) => {
            const isOpen = !!open[l.id];
            const rank = rankings[l.id] ?? [];
            const pool = rank.reduce((s, r) => s + Number(r.entry_paid || 0), 0);
            const paidCount = rank.filter((r) => Number(r.entry_paid) > 0).length;
            return (
              <Card key={l.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => toggle(l.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-muted/20 transition text-left"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="flex-1">
                    <div className="font-bold text-lg">{l.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                      <span>Código: <code className="bg-muted/40 px-1.5 py-0.5 rounded">{l.invite_code}</code></span>
                      <span>·</span>
                      <span>Entrada: {fmt(Number(l.entry_fee ?? 0))}</span>
                    </div>
                  </div>
                  <Link href={`/leagues/${l.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" title="Abrir liga">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </button>

                {isOpen && (
                  <div className="border-t border-border/30 p-4 space-y-4 bg-background/40">
                    <div className="grid grid-cols-3 gap-3">
                      <Stat icon={Coins} label="Bolada" value={fmt(pool)} color="text-gold" />
                      <Stat icon={Users} label="Membros" value={rank.length.toString()} color="text-primary" />
                      <Stat icon={Trophy} label="Pagos" value={`${paidCount}/${rank.length}`} color="text-emerald-500" />
                    </div>

                    {rank.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4 text-sm">Sem membros.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/30">
                              <th className="text-left py-2 w-10">#</th>
                              <th className="text-left">Membro</th>
                              <th className="text-right">Pontos</th>
                              <th className="text-center">Pago</th>
                              <th className="text-right pr-2">Prêmio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rank.map((r, i) => {
                              const icons = [Trophy, Medal, Award];
                              const colors = ['text-gold', 'text-silver', 'text-bronze'];
                              const Icon = icons[i];
                              return (
                                <tr key={r.id} className="border-b border-border/10">
                                  <td className="py-2">
                                    {Icon ? <Icon className={`h-4 w-4 ${colors[i]}`} /> : <span className="text-xs text-muted-foreground">{r.position}</span>}
                                  </td>
                                  <td className="font-medium">{r.name} <span className="text-xs text-muted-foreground">· nv {r.level}</span></td>
                                  <td className="text-right font-bold text-primary">{r.points}</td>
                                  <td className="text-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${Number(r.entry_paid) > 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                      {Number(r.entry_paid) > 0 ? fmt(Number(r.entry_paid)) : 'pendente'}
                                    </span>
                                  </td>
                                  <td className="text-right pr-2 font-black text-gold">
                                    {r.prize_amount > 0 ? fmt(r.prize_amount) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="rounded-xl p-3 bg-muted/30 flex items-center gap-3">
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-black">{value}</div>
      </div>
    </div>
  );
}
