'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Medal, Award, Coins, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  async function savePayment(uid: number, paid: number, isPaid: boolean) {
    try {
      await api.put(`/leagues/${id}/members/${uid}/payment`, { entry_paid: paid, paid: isPaid });
      toast.success('Pagamento atualizado');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    }
  }

  function copyInvite() {
    if (!data?.league.invite_code) return;
    navigator.clipboard.writeText(data.league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Código copiado');
  }

  if (!user || !data) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  const isOwner = data.league.owner_id === user.id || user.is_admin;
  const medals = [
    { icon: Trophy, color: 'text-gold' },
    { icon: Medal, color: 'text-silver' },
    { icon: Award, color: 'text-bronze' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black">{data.league.name}</h1>
          {data.league.description && <p className="text-muted-foreground">{data.league.description}</p>}
        </div>
        <Button variant="outline" onClick={copyInvite}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {data.league.invite_code}
        </Button>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <Coins className="h-10 w-10 text-gold" />
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Bolada total</div>
              <div className="text-3xl font-black">{fmt(data.pool)}</div>
            </div>
          </div>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Distribuição dos prêmios</CardTitle></CardHeader>
          <div className="grid grid-cols-3 gap-3">
            {data.prizes.map((p, i) => {
              const M = medals[i] ?? { icon: Trophy, color: 'text-muted-foreground' };
              return (
                <div key={p.position} className="text-center p-3 rounded-xl bg-muted/30">
                  <M.icon className={`h-7 w-7 mx-auto ${M.color}`} />
                  <div className="text-xs text-muted-foreground mt-1">{p.position}º lugar · {p.percent}%</div>
                  <div className="text-xl font-black mt-1">{fmt(p.amount)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking da liga</CardTitle></CardHeader>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-xs uppercase">
            <tr className="border-b border-border/40">
              <th className="text-left py-2">#</th>
              <th className="text-left">Membro</th>
              <th>Pontos</th>
              <th>Pago</th>
              <th>Prêmio</th>
              {isOwner && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rank.map((r, i) => {
              const M = medals[i];
              return (
                <tr key={r.id} className="border-b border-border/20 hover:bg-muted/20">
                  <td className="py-2 font-black">
                    {M ? <M.icon className={`h-5 w-5 ${M.color}`} /> : <span className="text-muted-foreground">{r.position}</span>}
                  </td>
                  <td className="font-medium">
                    {r.name} <span className="text-xs text-muted-foreground">· nv {r.level}</span>
                  </td>
                  <td className="text-center font-bold text-primary">{r.points}</td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${r.paid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      {fmt(r.entry_paid)} {r.paid ? '✓' : '⏳'}
                    </span>
                  </td>
                  <td className="text-center font-black text-gold">
                    {r.prize_amount > 0 ? fmt(r.prize_amount) : '—'}
                  </td>
                  {isOwner && <td><MemberPayEditor row={r} onSave={savePayment} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MemberPayEditor({ row, onSave }: { row: RankRow; onSave: (uid: number, paid: number, isPaid: boolean) => void }) {
  const [val, setVal] = useState(String(row.entry_paid));
  const [paid, setPaid] = useState(row.paid);
  return (
    <div className="flex items-center gap-1">
      <Input value={val} onChange={(e) => setVal(e.target.value)} className="w-20 h-8 text-xs text-center" />
      <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
      <Button size="sm" variant="ghost" onClick={() => onSave(row.id, Number(val), paid)}>OK</Button>
    </div>
  );
}
