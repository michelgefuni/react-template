# Orientação para agentes

Starter React. Leia `README.md`, `SECURITY.md` e `docs/guides` antes de adicionar código.

## Mapa

- Front: `apps/web/src`
[//]: # (@feature-bff-start)
- BFF: `apps/bff/src`
[//]: # (@feature-bff-end)
- Contratos: `packages/shared/src`
- Decisões: `docs/adr`

## Não quebrar

[//]: # (@feature-auth-start)
- Rota de domínio sem o guard de sessão.
[//]: # (@feature-auth-end)
[//]: # (@feature-bff-start)
- Proxy que aceita URL ou caminho livre do cliente.
- `console.*` para log. Use o logger Winston do BFF.
[//]: # (@feature-bff-end)
- Segredo em variável `VITE_` ou hardcoded no código.
- Commit fora de `feat`, `fix`, `refactor` e `docs`. Branch sem o prefixo `feature-`, `fix-`, `refactor-` ou `hotfix-`.

## Git

Mensagem em inglês, minúscula, imperativa, sem escopo e sem ponto final. Menos de 72 caracteres.
