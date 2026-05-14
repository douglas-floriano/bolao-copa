'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';
import { useRouter } from 'next/navigation';

export default function LeaguesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  async function load() {
    const { data } = await api.get('/leagues');
    setLeagues(data);
  }
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    load();
  }, [user]);

  async function create() {
    if (!name) return;
    await api.post('/leagues', { name });
    toast.success('Liga criada!');
    setName(''); load();
  }
  async function join() {
    try {
      await api.post('/leagues/join', { invite_code: code });
      toast.success('Entrou na liga!');
      setCode(''); load();
    } catch { toast.error('Código inválido.'); }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Ligas privadas</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Criar nova liga</CardTitle></CardHeader>
          <div className="flex gap-2">
            <Input placeholder="Nome da liga" value={name} onChange={(e) => setName(e.target.value)} />
            <Button variant="premium" onClick={create}>Criar</Button>
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>Entrar com convite</CardTitle></CardHeader>
          <div className="flex gap-2">
            <Input placeholder="Código de convite" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <Button onClick={join}>Entrar</Button>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {leagues.map((l) => (
          <Card key={l.id}>
            <CardHeader><CardTitle>{l.name}</CardTitle></CardHeader>
            <p className="text-sm text-muted-foreground">Convite: <code className="bg-muted/40 px-2 py-1 rounded">{l.invite_code}</code></p>
          </Card>
        ))}
      </div>
    </div>
  );
}
