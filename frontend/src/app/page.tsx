'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Sparkles, Users } from 'lucide-react';

const features = [
  { icon: Target,    title: 'Palpites em tempo real', desc: 'Acompanhe placar, ranking e pontos atualizando ao vivo.' },
  { icon: Trophy,    title: 'Tabela oficial FIFA',     desc: 'Classificação com regras reais e avanço automático de fase.' },
  { icon: Sparkles,  title: 'Gamificação premium',     desc: 'XP, níveis, medalhas e conquistas no estilo fantasy game.' },
  { icon: Users,     title: 'Ligas privadas',          desc: 'Convide amigos por link e dispute o ranking entre vocês.' },
];

export default function Home() {
  return (
    <div className="space-y-24">
      <section className="text-center pt-16 pb-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
        >
          🏆 Copa do Mundo FIFA 2026 — 11/06 → 19/07
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight"
        >
          Faça seus palpites.
          <br />
          <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Domine o ranking.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          48 seleções. 104 jogos. 1 campeão. Plataforma premium de fantasy game para a Copa 2026.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <Button asChild size="lg" variant="premium">
            <Link href="/register">Começar agora →</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/matches">Ver jogos</Link>
          </Button>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="card-premium p-6 hover:-translate-y-1 transition"
          >
            <f.icon className="h-10 w-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
