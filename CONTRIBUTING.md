# Contribuir

## Estrutura

- `apps/web` é a SPA. Rotas em `src/routes`, features em `src/features`, código compartilhado da UI em `src/shared`.
[//]: # (@feature-bff-start)
- `apps/bff` é o servidor. Rotas em `src/routes`, clientes de upstream em `src/clients`.
[//]: # (@feature-auth-start)
  A sessão fica em `src/auth`.
[//]: # (@feature-auth-end)
[//]: # (@feature-bff-end)
- `packages/shared` guarda códigos de erro e schemas usados pelos apps.
- `packages/eslint-config` e `packages/tsconfig` são a configuração compartilhada.

Regra de negócio fica em serviços, não na rota. A rota valida a entrada, chama o serviço e devolve o DTO.

## Verificação local

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Git

Branch: `feature-`, `fix-`, `refactor-` ou `hotfix-`, em kebab-case, sem barra.

Commit: `feat:`, `fix:`, `refactor:` ou `docs:`, em inglês, minúsculo, sem escopo e sem ponto final.

`docs` usa a mesma branch do trabalho. Não existe branch `docs-`.
