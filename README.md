# ImoBI Platform

Plataforma SaaS completa para imobiliárias brasileiras — CRM, WhatsApp com IA, Financeiro, Marketing e muito mais.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| Backend | Fastify 5, Node.js 22, TypeScript |
| Banco de Dados | PostgreSQL 16, Drizzle ORM |
| Cache / Filas | Redis 7, BullMQ |
| IA | Anthropic Claude (claude-sonnet-4-5) |
| WhatsApp | Meta Cloud API v21.0 |
| Pagamentos | Asaas (PIX, boleto) |
| Storage | Cloudflare R2 / AWS S3 |
| Monorepo | Turborepo + npm workspaces |

## Estrutura

```
imobi-platform/
├── apps/
│   ├── api/          # Fastify API (porta 3001)
│   └── web/          # Next.js frontend (porta 3000)
├── packages/
│   ├── db/           # Schema Drizzle ORM + migrations
│   ├── shared/       # Tipos, validators BR (CPF/CNPJ/CEP), utils
│   └── ui/           # Componentes shadcn/ui compartilhados
├── scripts/
│   └── init.sql      # Extensões PostgreSQL + RLS helper
└── docker-compose.yml
```

## Módulos

- **CRM** — Pipeline Kanban, lead scoring IA, timeline, atividades
- **WhatsApp + IA** — Chatbot Claude, handoff humano, templates Meta
- **Imóveis** — Cadastro completo, mídia, sincronização ZAP/VivaReal/OLX
- **Financeiro** — Comissões, fluxo de caixa, DRE, PIX/boleto via Asaas
- **Marketing** — Campanhas e-mail/WA, landing pages, rastreamento UTM
- **Administrativo** — Equipes, tarefas, documentos, notificações
- **Analytics** — Funil, desempenho por corretor, origens de leads
- **Multi-tenant** — Cada imobiliária é um tenant isolado via PostgreSQL RLS

## Quick Start

### 1. Pré-requisitos
- Node.js 22+
- Docker + Docker Compose

### 2. Instalação

```bash
# Clone e instale dependências
cd imobi-platform
npm install

# Suba o banco e Redis
docker-compose up -d

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves

# Aplique o schema no banco
npm run db:push

# Inicie em desenvolvimento
npm run dev
```

### 3. Acesse

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Swagger**: http://localhost:3001/docs
- **MailHog**: http://localhost:8025
- **Drizzle Studio**: `npm run db:studio`

## Configuração Obrigatória (.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/imobi_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua-chave-secreta-minimo-32-chars
ANTHROPIC_API_KEY=sk-ant-...
META_WHATSAPP_TOKEN=EAAxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=seu-token-verificacao
```

## Registro de Imobiliária

Acesse `http://localhost:3000/register` para criar uma conta de teste (14 dias gratuitos).

## Variáveis de Ambiente Opcionais

| Variável | Descrição |
|---|---|
| `ASAAS_API_KEY` | Pagamentos PIX/boleto |
| `CLICKSIGN_API_KEY` | Assinatura digital de contratos |
| `RESEND_API_KEY` | Envio de e-mails |
| `GOOGLE_MAPS_API_KEY` | Geolocalização de imóveis |
| `S3_*` | Upload de fotos e documentos |

## Desenvolvimento

```bash
npm run dev          # Inicia todos os apps
npm run typecheck    # Verifica TypeScript
npm run db:studio    # Drizzle Studio (visualizar banco)
npm run db:push      # Aplica schema (dev)
npm run db:generate  # Gera migrations (prod)
```
