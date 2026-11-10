# React Template

Starter React. O bootstrap escolhe o quanto de servidor entra no projeto.

[//]: # (@sample-start)

| Preset | O que fica |
| --- | --- |
| `web` | SPA |
| `bff` | SPA e BFF, sem login |
| `bff-auth` | SPA, BFF e login OpenID Connect |

O repositório, antes do bootstrap, sobe o preset `bff-auth` para quem quer experimentar o stack completo.

[//]: # (@sample-end)

## O que entra

- `apps/web`: Vite, React 19, TanStack Router e TanStack Query, Tailwind.
- `packages/shared`: contratos e erros.
[//]: # (@feature-bff-start)
- `apps/bff`: Hono e proxy tipado para upstreams.
[//]: # (@feature-bff-end)
[//]: # (@feature-auth-start)
- Login OIDC com sessão em cookie HttpOnly. Redis e Keycloak no desenvolvimento com Docker.
[//]: # (@feature-auth-end)

SSR, biblioteca de componentes, i18n e Storybook ficam de fora.

## Requisitos

Node 26 (`.nvmrc`). Node 24.12 ou mais novo roda as ferramentas localmente. As imagens Docker usam Node 26. pnpm 11 vem do `packageManager`.

## Primeiro uso

[//]: # (@sample-start)

```sh
pnpm install
pnpm create-project
```

O script pergunta nome, escopo e preset. Apaga as amostras marcadas com `@sample`, remove o que o preset não usa, gera os segredos e se remove.

Para experimentar este repositório antes do bootstrap, copie os exemplos. Não repita a cópia depois do bootstrap. Ela apaga os segredos gerados.

```sh
cp apps/web/.env.example apps/web/.env
cp apps/bff/.env.example apps/bff/.env
pnpm dev
```

[//]: # (@sample-end)

```sh
pnpm install
pnpm dev
```

O front sobe em `http://localhost:5173`.

[//]: # (@feature-bff-start)
O BFF sobe em `http://localhost:3001`. `pnpm dev` compila o client do BFF antes do front.

`docker compose up` sobe só o front. O BFF entra com `--profile bff` ou `--profile auth`.

`pnpm gen:upstreams` gera os tipos OpenAPI. `pnpm --filter @react-template/web test:e2e` roda o Playwright.
[//]: # (@feature-bff-end)

[//]: # (@feature-auth-start)
O login local usa Keycloak, sem Redis. A sessão fica em memória.

```sh
docker compose --profile auth up -d keycloak
```

O usuário de exemplo é `dev` / `change-me`. Esses valores são só de desenvolvimento. O boot em `NODE_ENV=production` recusa o store em memória, cookie sem `Secure` e os segredos de exemplo.

O stack completo, com nginx na porta 8088, sobe com `docker compose --profile auth up`.
[//]: # (@feature-auth-end)

## Scripts

| Script | O que faz |
| --- | --- |
| `pnpm dev` | Sobe o que o preset deixou |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm test` | Vitest |
| `pnpm build` | Build dos apps |

## Onde ler mais

- [Contribuir](CONTRIBUTING.md)
- [Segurança](SECURITY.md)
- [Decisões](docs/adr/README.md)
- [Adicionar uma feature](docs/guides/add-feature.md)
[//]: # (@feature-bff-start)
- [Adicionar um upstream](docs/guides/add-upstream.md)
[//]: # (@feature-bff-end)
[//]: # (@feature-auth-start)
- [Adicionar uma rota protegida](docs/guides/add-protected-route.md)
[//]: # (@feature-auth-end)

Variáveis: `apps/web/.env.example`. Nada sensível vai em variável `VITE_`.
