'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Trophy, Plus, X, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';
import { useRouter } from 'next/navigation';

type Prize = { position: number; percent: number };

export default function LeaguesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  async function load() {
    const { data } = await api.get('/leagues');
    setLeagues(data);
  }
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  async function join() {
    try {
      await api.post('/leagues/join', { invite_code: code });
      toast.success('Entrou na liga!');
      setCode(''); setShowJoin(false); load();
    } catch { toast.error('Código inválido.'); }
  }

  async function leave(l: any) {
    if (!confirm(`Sair da liga "${l.name}"?`)) return;
    try {
      await api.delete(`/leagues/${l.id}/leave`);
      toast.success('Você saiu da liga');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black">Ligas privadas</h1>
          <p className="text-sm text-muted-foreground">
            {user.is_admin ? 'Todas as ligas do campeonato' : 'Suas ligas e prêmios'}
          </p>
        </div>
        <div className="flex gap-2">
          {!user.is_admin && (
            <Button variant="outline" onClick={() => setShowJoin((v) => !v)} className="gap-2">
              <KeyRound className="h-4 w-4" /> Entrar com convite
            </Button>
          )}
          {user.is_admin && (
            <Button variant="premium" onClick={() => setShowCreate((v) => !v)} className="gap-2">
              <Plus className="h-4 w-4" /> Nova liga
            </Button>
          )}
        </div>
      </header>

      {showJoin && !user.is_admin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Entrar com convite</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => setShowJoin(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <div className="flex gap-2">
            <Input placeholder="Código de convite" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <Button variant="premium" onClick={join}>Entrar</Button>
          </div>
        </Card>
      )}

      {showCreate && user.is_admin && (
        <CreateLeagueForm
          onCancel={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}

      {leagues.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          {user.is_admin ? 'Nenhuma liga criada ainda. Clique em "Nova liga".' : 'Você ainda não está em nenhuma liga. Use um código de convite para entrar.'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagues.map((l) => (
            <Card key={l.id} className="hover:ring-2 hover:ring-primary/40 transition flex flex-col">
              <Link href={`/leagues/${l.id}`} className="flex-1">
                <CardHeader>
                  <CardTitle className="cursor-pointer flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" /> {l.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Entrada R$ {Number(l.entry_fee ?? 0).toFixed(2).replace('.', ',')}
                    {l.members_count !== undefined && ` · ${l.members_count} membros`}
                  </p>
                </CardHeader>
                <p className="text-xs text-muted-foreground cursor-pointer">
                  Convite: <code className="bg-muted/40 px-2 py-0.5 rounded">{l.invite_code}</code>
                </p>
              </Link>
              {!user.is_admin && l.owner_id !== user.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 text-destructive hover:bg-destructive/10 self-start"
                  onClick={() => leave(l)}
                >
                  Sair da liga
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateLeagueForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [entryFee, setEntryFee] = useState('50');
  const [prizes, setPrizes] = useState<Prize[]>([
    { position: 1, percent: 60 },
    { position: 2, percent: 30 },
    { position: 3, percent: 10 },
  ]);
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

  async function create() {
    if (!name) return toast.error('Informe nome da liga');
    if (Math.abs(totalPct - 100) > 0.01) return toast.error(`Soma das porcentagens deve ser 100% (atual: ${totalPct}%)`);
    setBusy(true);
    try {
      await api.post('/leagues', {
        name,
        entry_fee: Number(entryFee || 0),
        prize_distribution: prizes,
      });
      toast.success('Liga criada!');
      onCreated();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    } finally { setBusy(false); }
  }

  return (
    <Card className="ring-2 ring-primary/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Nova liga</CardTitle>
          <Button size="icon" variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
            <Input placeholder="Amigos da firma" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Valor por pessoa (R$)</label>
            <Input type="number" min="0" step="1" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Distribuição dos prêmios</label>
            <Button size="sm" variant="ghost" onClick={addPrize}><Plus className="h-3 w-3" /> Adicionar</Button>
          </div>
          <div className="space-y-2">
            {prizes.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm font-bold w-10">{p.position}º</span>
                <Input type="number" min="0" max="100" value={p.percent} onChange={(e) => setPct(i, e.target.value)} className="w-24" />
                <span className="text-sm text-muted-foreground">%</span>
                {prizes.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => rmPrize(i)} className="h-7 w-7 ml-auto">×</Button>
                )}
              </div>
            ))}
          </div>
          <div className={`text-xs mt-2 ${Math.abs(totalPct - 100) > 0.01 ? 'text-destructive' : 'text-emerald-500'}`}>
            Soma: {totalPct}% {Math.abs(totalPct - 100) > 0.01 ? '(deve ser 100%)' : '✓'}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/30">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button variant="premium" onClick={create} disabled={busy}>{busy ? 'Criando...' : 'Criar liga'}</Button>
      </div>
    </Card>
  );
}
