'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, UserPlus, Shield, Search, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth';

type U = { id: number; name: string; email: string; is_admin: boolean; level: number; xp: number };

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<U[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', is_admin: false });
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/admin/users', { params: { search } });
    setUsers(data.data ?? data);
  }

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/'); return; }
    load();
  }, [user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/users', form);
      toast.success('Usuário criado');
      setForm({ name: '', email: '', password: '', is_admin: false });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar usuário');
    } finally { setBusy(false); }
  }

  async function toggleAdmin(u: U) {
    await api.put(`/admin/users/${u.id}`, { is_admin: !u.is_admin });
    toast.success(`${u.name} agora ${!u.is_admin ? 'é admin' : 'não é admin'}`);
    load();
  }

  async function remove(u: U) {
    if (!confirm(`Excluir ${u.name}? Isso apaga todos os palpites dele.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success('Usuário excluído');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro');
    }
  }

  if (!user?.is_admin) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Usuários</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Cadastrar novo</CardTitle></CardHeader>
        <form onSubmit={create} className="grid md:grid-cols-4 gap-3">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input type="password" placeholder="Senha (mín. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm flex-1">
              <input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} />
              Admin
            </label>
            <Button type="submit" variant="premium" disabled={busy}>{busy ? '...' : 'Criar'}</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de usuários</CardTitle>
          <div className="flex items-center gap-2 mt-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <Button variant="outline" onClick={load}>Filtrar</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-xs uppercase">
              <tr className="border-b border-border/40">
                <th className="text-left py-2">Nome</th>
                <th className="text-left">E-mail</th>
                <th>Nível</th>
                <th>Admin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const protectedUser = u.email === 'admin@bolaocopa.local';
                return (
                <tr key={u.id} className="border-b border-border/20 hover:bg-muted/20">
                  <td className="py-3 font-medium flex items-center gap-2">
                    {u.name}
                    {protectedUser && <Lock className="h-3 w-3 text-amber-500" />}
                  </td>
                  <td className="text-muted-foreground">{u.email}</td>
                  <td className="text-center">{u.level}</td>
                  <td className="text-center">
                    <button
                      onClick={() => !protectedUser && toggleAdmin(u)}
                      disabled={protectedUser}
                      className="inline-flex disabled:cursor-not-allowed"
                      title={protectedUser ? 'Conta protegida' : 'Alternar admin'}
                    >
                      <Shield className={`h-5 w-5 ${u.is_admin ? 'text-accent' : 'text-muted-foreground/30'}`} />
                    </button>
                  </td>
                  <td className="text-right">
                    {!protectedUser && (
                      <Button variant="ghost" size="icon" onClick={() => remove(u)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              );})}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
