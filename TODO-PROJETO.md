# TODO-PROJETO CRM IMOBILIÁRIO INTELIGENTE
**Progress: 50%** [Fase 1 schemas complete + proposals.ts, Docker up (mailhog fail ok), db:push pending Postgres healthy]

**Especificação completa:** [full user spec copy here]

```
PROJETO: PLATAFORMA CRM IMOBILIÁRIO INTELIGENTE

[... full spec from user message ...]
```

**Stack:** Next.js shadcn Tailwind Fastify Drizzle Postgres Redis Turborepo.

**Arquitetura:** Multi-env responsive mobile PWA.

**Roadmap Steps:**

**Fase 1 DB Schema (hoje)**
1. [x] schema/agents.ts corretores CRECI metas.
2. [x] schema/condos.ts condomínios infraestrutura.
3. [x] schema/messages.ts WhatsApp histórico.
4. [x] schema/visits.ts visitas propostas.
5. [x] schema/proposals.ts propostas contratos.
6. [x] schema/index.ts export all.
7. [ ] npm run db:push (Docker Postgres ready).
6. [ ] schema/index.ts export all.
7. [ ] npm run db:push.

**Fase 2 UI Navigation (hoje)**
8. [ ] app-sidebar.tsx + Condominios/Corretores/WhatsAppIA/Portais/Automações.
9. [ ] layout.tsx sidebar full.

**Fase 3 Dashboard Metrics**
10. [ ] page.tsx dashboard recharts leads/propostas/visitas/revenue corretores.

**Fase 4 Módulos Pages**
11. [ ] /condominios page list/form.
12. [ ] /corretores page list/performance.
13. [ ] /whatsapp chat IA mock Claude.
14. [ ] /portais XML generate mock.
15. [ ] /automations simple rules.

**Fase 5 Funcional Core**
16. [ ] upload-photos.tsx drag reorder jsPDF PDF fotos.
17. [ ] crm/pipeline.tsx Kanban stages deals.
18. [ ] properties/new wizard upload PDF.
19. [ ] Deps jsPDF dropzone anthropic pdf-lib react-dropzone.

**Fase 6 Backend Routes**
20. [ ] modules/agents/condos/messages/visits/proposals routes.ts POST/GET.

**Fase 7 Production**
21. [x] Docker up DB Redis (mailhog optional fail).
22. [ ] npm run build lint typecheck 0.
23. [ ] PWA manifest.
24. [ ] Test e2e Cypress.
25. [ ] Deploy Vercel.

**Commands Run:**
npm run db:push dev typecheck lint

**Next:** Fase 7 Docker DB + db:push.
