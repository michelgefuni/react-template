# Adicionar uma rota protegida

Preset `bff-auth`.

1. Se o corpo ou a query tiverem contrato compartilhado, descreva o schema em `packages/shared`.
2. Em `apps/bff/src/app.ts`, acrescente a rota na cadeia de `createRoutes`, depois do middleware que exige sessão.
3. Valide a entrada com Zod e responda com `c.json` ou com `problem()`.
4. No front, chame a rota pelo client `hcWithType`. O tipo vem do build do BFF (`pnpm --filter @react-template/bff build`).

Rotas em `/auth`, `/health` e `/ready` são as únicas públicas. Uma rota nova fora delas, e antes do guard, fica aberta.
