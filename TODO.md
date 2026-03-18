# Correção Auth Refresh (Plano aprovado pelo usuário)

- [x] 1. Editar apps/web/src/app/(app)/layout.tsx: Adicionar loading state e check seguro para evitar redirect prematuro
- [x] 2. Atualizar apps/web/src/store/auth.store.ts: Adicionar initSync e loading state
- [x] 3. Atualizar apps/web/src/lib/auth.ts: Nova função initAuth para sync store de localStorage
- [x] 4. Testar: Login admin@imobi.com/admin123 → /crm → F5 → verifica se permanece logado
- [x] 5. Atualizar TODO.md com progresso
- [x] 6. Completar tarefa com attempt_completion

**Schemas corrigidos typecheck 0.**

**RBAC aprovado - próximo**

