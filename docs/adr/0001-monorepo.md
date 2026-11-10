# 1. Monorepo pnpm e Turborepo

O starter compartilha contratos entre os pacotes. Workspaces do pnpm com `catalog` mantêm uma versão por dependência. O Turborepo ordena build e typecheck.

[//]: # (@feature-bff-start)
Alternativa descartada: dois repositórios. O client tipado do servidor precisa do tipo gerado no mesmo checkout.
[//]: # (@feature-bff-end)
