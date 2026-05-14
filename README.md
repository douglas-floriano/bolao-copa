# 🏆 Bolão Copa do Mundo 2026

Sistema web moderno de **Bolão da Copa do Mundo FIFA 2026** (Canadá / México / EUA).
Plataforma estilo fantasy game premium: palpites, ranking em tempo real, classificação automática, avanço de fases, gamificação e ligas privadas.

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 14** (App Router) + React 18 + TypeScript |
| UI | **TailwindCSS** + **shadcn/ui** + **Framer Motion** + Lucide icons |
| Backend | **Laravel 11** + PHP 8.2 + Sanctum |
| DB | **PostgreSQL 16** |
| Cache / Queue | **Redis 7** + Laravel Horizon |
| Realtime | **Laravel Echo** + **Soketi** (Pusher protocol) |
| Infra | **Docker Compose** (dev + prod) |

## 📦 Estrutura monorepo

```
bolao-copa/
├── backend/        # API Laravel 11
├── frontend/       # SPA Next.js 14
├── docker/         # nginx + php-fpm configs
├── docker-compose.yml
└── README.md
```

## 🚀 Subir ambiente local

```bash
# 1. Clonar
git clone https://github.com/douglas-floriano/bolao-copa.git
cd bolao-copa

# 2. Copiar envs
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Subir stack
docker compose up -d --build

# 4. Instalar deps + migrar + semear Copa 2026
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed

# 5. Frontend
docker compose exec node yarn install
docker compose exec node yarn dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8000/api
- Soketi (WS): ws://localhost:6001

## 🎯 Funcionalidades

### Para usuário final
- Login / cadastro (JWT via Sanctum)
- Dashboard com pontuação, próximos jogos, evolução
- Palpites (placar) até **1h antes** da partida
- Ranking global + por rodada + por liga privada
- Gamificação (XP, níveis, medalhas, conquistas)
- Ligas privadas com convite por link
- Notificações em tempo real

### Para admin
- Lançar resultados oficiais → recálculo automático
- Configurar modo do bolão (grupos / completo)
- Configurar pontuação (placar exato, vencedor, etc.)
- Sincronizar / resetar campeonato
- Dashboard analítico, logs de auditoria

## 🏟️ Copa do Mundo FIFA 2026

| Período | 11/06/2026 → 19/07/2026 |
|---|---|
| Sedes | EUA (11) + México (3) + Canadá (2) — 16 estádios |
| Times | 48 |
| Grupos | 12 grupos de 4 (A–L) |
| Partidas | 104 |
| Formato | Top 2 + 8 melhores 3º lugares → Round of 32 → Oitavas → Quartas → Semi → Final |

### Critérios de desempate FIFA (aplicados nesta ordem)
1. Pontos no confronto direto
2. Saldo de gols no confronto direto
3. Gols marcados no confronto direto
4. Saldo de gols geral
5. Gols marcados geral
6. Fair play (cartões)
7. Ranking FIFA

## ⚙️ Modos do bolão

- **Modo 1 — Fase de grupos**: palpites só até a última partida da fase de grupos.
- **Modo 2 — Completo**: palpites até a Final.

Admin escolhe em `Configurações → Campeonato`.

## 📊 Pontuação padrão (configurável)

| Resultado | Pontos |
|---|---|
| Placar exato | **+5** |
| Acertou vencedor / empate | **+2** |
| Errou | 0 |

## 🔐 Segurança
- Sanctum (cookie + token)
- Rate limiting por rota
- CSRF + XSS sanitização
- Hash Argon2id
- Audit log de toda ação admin

## 📜 Licença
MIT
