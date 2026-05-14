'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Row = {
  team: { id: number; name: string; code: string; flag: string };
  P: number; J: number; V: number; E: number; D: number; GP: number; GC: number; SG: number;
};
type GroupBlock = { group: string; rows: Row[] };

export default function StandingsPage() {
  const [groups, setGroups] = useState<GroupBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/standings').then(({ data }) => { setGroups(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Tabela — Fase de Grupos</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g, gi) => (
          <motion.div key={g.group} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle>Grupo {g.group}</CardTitle>
              </CardHeader>
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left">#</th>
                    <th className="text-left">Seleção</th>
                    <th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r, i) => (
                    <tr key={r.team.id} className={`border-t border-border/30 ${i < 2 ? 'bg-primary/5' : ''}`}>
                      <td className="font-bold">{i + 1}</td>
                      <td className="flex items-center gap-2 py-2">
                        <Image src={r.team.flag} width={20} height={14} alt={r.team.code} className="rounded-sm" unoptimized />
                        <span className="font-medium">{r.team.code}</span>
                      </td>
                      <td className="text-center font-bold text-primary">{r.P}</td>
                      <td className="text-center">{r.J}</td>
                      <td className="text-center">{r.V}</td>
                      <td className="text-center">{r.E}</td>
                      <td className="text-center">{r.D}</td>
                      <td className="text-center">{r.GP}</td>
                      <td className="text-center">{r.GC}</td>
                      <td className="text-center">{r.SG}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
