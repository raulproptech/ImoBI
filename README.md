# ImoBI Platform 🏠

> Plataforma SaaS para imobiliárias brasileiras — CRM inteligente, WhatsApp com IA, gestão financeira e muito mais.

---

## O Problema

Imobiliárias brasileiras ainda dependem de planilhas, WhatsApp manual e sistemas ultrapassados para gerenciar leads, corretores e negócios. O resultado: leads perdidos, processos lentos e zero visibilidade sobre o desempenho da equipe.

## A Solução

O ImoBI centraliza tudo em uma plataforma moderna, com IA integrada para qualificar leads automaticamente via WhatsApp e entregar dados reais para a tomada de decisão.

---

## Funcionalidades

- **CRM** — Pipeline Kanban, lead scoring com IA, timeline de atividades
- **WhatsApp + IA** — Chatbot com Claude (Anthropic), qualificação automática de leads, handoff para corretor humano
- **Gestão de Imóveis** — Cadastro completo, upload de mídia, sincronização com ZAP Imóveis, VivaReal e OLX
- **Financeiro** — Comissões, fluxo de caixa, DRE, pagamentos via PIX e boleto (Asaas)
- **Marketing** — Campanhas por e-mail e WhatsApp, landing pages, rastreamento UTM
- **Gestão de Corretores** — Performance individual, metas, CRECI, receita gerada
- **Analytics** — Funil de vendas, origens de leads, desempenho por corretor
- **Multi-tenant** — Cada imobiliária com dados completamente isolados

---

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

---

## Arquitetura

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

**Multi-tenancy** implementado via PostgreSQL Row Level Security (RLS) — cada imobiliária opera em ambiente completamente isolado no nível do banco de dados.

---

## Status do Projeto

O projeto está em desenvolvimento ativo. As telas abaixo representam o estágio atual da plataforma.

> 📸 *Prints da plataforma em desenvolvimento*

---

## Sobre o Projeto

O ImoBI nasceu da observação de um gap real no mercado imobiliário brasileiro — especialmente em regiões como o litoral gaúcho e catarinense, onde há forte movimentação de imóveis e pouca tecnologia disponível para as imobiliárias locais.

Este projeto também faz parte da minha jornada de transição para a área de tecnologia, utilizando IA como ferramenta de desenvolvimento para construir um produto real com stack profissional.

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 22+
- Docker + Docker Compose

### Instalação

```bash
# Instale as dependências
npm install

# Suba o banco e o Redis
docker-compose up -d

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# Aplique o schema no banco
npm run db:push

# Inicie em desenvolvimento
npm run dev
```

### Acesse

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger (docs):** http://localhost:3001/docs
- **Drizzle Studio:** `npm run db:studio`

### Variáveis Obrigatórias (.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/imobi_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua-chave-secreta-minimo-32-chars
ANTHROPIC_API_KEY=sk-ant-...
META_WHATSAPP_TOKEN=EAAxxxxxxx
META_WEBHOOK_VERIFY_TOKEN=seu-token-verificacao
```

---

## Contato

Tem interesse no projeto — seja como investidor, parceiro ou para conversar sobre o mercado imobiliário tech? Me chama no [LinkedIn](https://linkedin.com/in/seu-perfil).
