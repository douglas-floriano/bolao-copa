'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Medal, Award, Coins, Copy, Check, Users, Crown, TrendingUp, Settings, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/store/auth';

type RankRow = {
  id: number; name: string; level: number;
  points: number; entry_paid: number; paid: boolean;
  position: number; prize_percent: number; prize_amount: number;
};
type Prize = { position: number; percent: number; amount: number };
type LeagueData = {
  league: any;
  pool: number;
  prizes: Prize[];
};

const fmt = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

export default function LeagueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<LeagueData | null>(null);
  const [rank, setRank] = useState<RankRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    const [{ data: det }, { data: r }] = await Promise.all([
      api.get(`/leagues/${id}`),
      api.get(`/leagues/${id}/ranking`),
    ]);
    setData(det);
    setRank(r);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user, id]);

  function copyInvite() {
    if (!data?.league.invite_code) return;
    navigator.clipboard.writeText(data.league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Código copiado');
  }

  if (!user || !data) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  const totalPaid = rank.filter((r) => Number(r.entry_paid) > 0).length;
  const myRow = rank.find((r) => r.id === user.id);

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent border border-primary/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-widest text-primary font-bold">Liga privada</div>
            <h1 className="text-4xl font-black">{data.league.name}</h1>
            {data.league.description && <p className="text-muted-foreground">{data.league.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {rank.length} membros</span>
              <span>·</span>
              <span>{totalPaid}/{rank.length} pagos</span>
              <span>·</span>
              <span>Entrada {fmt(Number(data.league.entry_fee ?? 0))}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={copyInvite} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <code className="font-mono">{data.league.invite_code}</code>
            </Button>
            {user.is_admin && (
              <Button variant="premium" onClick={() => setEditOpen(true)} className="gap-2">
                <Settings className="h-4 w-4" /> Configurar liga
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {user.is_admin && editOpen && (
        <LeagueEditor
          league={data.league}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); load(); }}
        />
      )}

      {myRow && (
        <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
          <div className="flex items-center gap-4">
            <Crown className="h-10 w-10 text-primary" />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Sua posição</div>
              <div className="text-2xl font-black">{myRow.position}º · {myRow.points} pontos</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Você ganha</div>
              <div className="text-2xl font-black text-gold">{myRow.prize_amount > 0 ? fmt(myRow.prize_amount) : '—'}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gold/10">
                <Coins className="h-8 w-8 text-gold" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Bolada total</div>
                <div className="text-3xl font-black">{fmt(data.pool)}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Distribuição dos prêmios</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-3">
              {data.prizes.slice(0, 3).map((p, i) => {
                const icons = [Trophy, Medal, Award];
                const Icon = icons[i] ?? Trophy;
                const tint = i === 0 ? 'from-gold/30 to-gold/5 border-gold/40' : i === 1 ? 'from-silver/30 to-silver/5 border-silver/40' : 'from-bronze/30 to-bronze/5 border-bronze/40';
                const iconColor = i === 0 ? 'text-gold' : i === 1 ? 'text-silver' : 'text-bronze';
                return (
                  <div key={p.position} className={`text-center p-4 rounded-xl bg-gradient-to-br ${tint} border`}>
                    <Icon className={`h-8 w-8 mx-auto ${iconColor}`} />
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{p.position}º lugar</div>
                    <div className="text-xs text-muted-foreground">{p.percent}%</div>
                    <div className="text-lg font-black mt-1">{fmt(p.amount)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Ranking</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/40">
                <th className="text-left py-3 w-12">#</th>
                <th className="text-left">Membro</th>
                <th className="text-right">Pontos</th>
                <th className="text-center">Pagamento</th>
                <th className="text-right pr-2">Prêmio</th>
                {user.is_admin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rank.map((r, i) => {
                const icons = [Trophy, Medal, Award];
                const Icon = icons[i];
                const colors = ['text-gold', 'text-silver', 'text-bronze'];
                const isMe = r.id === user.id;
                return (
                  <tr key={r.id} className={`border-b border-border/20 ${isMe ? 'bg-primary/5' : 'hover:bg-muted/20'}`}>
                    <td className="py-3">
                      {Icon ? <Icon className={`h-5 w-5 ${colors[i]}`} /> : <span className="text-muted-foreground text-xs ml-1">{r.position}</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-emerald-500/40 flex items-center justify-center font-bold text-xs">
                          {r.name[0]}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            {r.name}
                            {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">você</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Nível {r.level}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right font-black text-primary">{r.points}</td>
                    <td className="text-center">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${Number(r.entry_paid) > 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {Number(r.entry_paid) > 0 ? `✓ ${fmt(Number(r.entry_paid))}` : 'pendente'}
                      </span>
                    </td>
                    <td className="text-right pr-2 font-black text-gold">
                      {r.prize_amount > 0 ? fmt(r.prize_amount) : <span className="text-muted-foreground font-normal">—</span>}
                    </td>
                    {user.is_admin && (
                      <td className="text-right">
                        <PayEditor leagueId={Number(id)} row={r} onSaved={load} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function LeagueEditor({ league, onClose, onSaved }: { league: any; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description ?? '');
  const [entryFee, setEntryFee] = useState(String(league.entry_fee ?? 0));
  const [prizes, setPrizes] = useState<{ position: number; percent: number }[]>(
    league.prize_distribution ?? [{ position: 1, percent: 60 }, { position: 2, percent: 30 }, { position: 3, percent: 10 }],
  );
  const [busy, setBusy] = useState(false);

  const totalPct = prizes.reduce((s, p) => s + Number(p.percent || 0), 0);

  function setPct(i: number, v: string) {
    setPrizes(prizes.map((p, idx) => idx === i ? { ...p, percent: Number(v) } : p));
  }
  function addPrize() {
    setPrizes([...prizes, { position: prizes.length + 1, percent: 0 }]);
  }
  function rmPrize(i: number) {
    setPrizes(prizes.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, position: idx + 1 })));
  }

  async function save() {
    if (Math.abs(totalPct - 100) > 0.01) {
      return toast.error(`Soma deve ser 100% (atual: ${totalPct}%)`);
    }
    setBusy(true);
    try {
      await api.put(`/leagues/${league.id}`, {
        name,
        description: description || null,
        entry_fee: Number(entryFee || 0),
        prize_distribution: prizes,
      });
      toast.success('Liga atualizada');
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally { setBusy(false); }
  }

  return (
    <Card className="ring-2 ring-primary/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Configurar liga</CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Valor da entrada (R$)</label>
            <Input type="number" min="0" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">
              Alterar não muda o que cada membro já pagou. Edite pagamento individual na tabela.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Distribuição dos prêmios</label>
            <Button size="sm" variant="ghost" onClick={addPrize}><Plus className="h-3 w-3" /> Adicionar</Button>
          </div>
          <div className="space-y-2">
            {prizes.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-bold w-10">{p.position}º</span>
                <Input type="number" min="0" max="100" step="0.01" value={p.percent} onChange={(e) => setPct(i, e.target.value)} className="w-24" />
                <span className="text-sm text-muted-foreground">%</span>
                {prizes.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => rmPrize(i)} className="h-7 w-7 ml-auto">×</Button>
                )}
              </div>
            ))}
          </div>
          <div className={`text-xs ${Math.abs(totalPct - 100) > 0.01 ? 'text-destructive' : 'text-emerald-500'}`}>
            Soma: {totalPct}% {Math.abs(totalPct - 100) > 0.01 ? '(deve ser 100%)' : '✓'}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/30">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="premium" onClick={save} disabled={busy}>{busy ? 'Salvando...' : 'Salvar alterações'}</Button>
      </div>
    </Card>
  );
}

function PayEditor({ leagueId, row, onSaved }: { leagueId: number; row: RankRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(String(row.entry_paid ?? 0));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVal(String(row.entry_paid ?? 0));
  }, [row.entry_paid]);

  async function save() {
    setBusy(true);
    try {
      const v = Number(val || 0);
      await api.put(`/leagues/${leagueId}/members/${row.id}/payment`, {
        entry_paid: v,
        paid: v > 0,
      });
      toast.success(`${row.name}: ${fmt(v)}`);
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="text-xs">
        Editar
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1 justify-end">
      <Input
        type="number"
        min="0"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-24 h-8 text-xs text-right"
        autoFocus
      />
      <Button size="sm" variant="premium" onClick={save} disabled={busy} className="h-8 px-2">✓</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="h-8 px-2">✗</Button>
    </div>
  );
}
