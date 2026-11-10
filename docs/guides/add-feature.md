# Adicionar uma feature

1. Crie `apps/web/src/features/<nome>/` com o componente e o teste.
2. Adicione a rota em `apps/web/src/routes`. O TanStack Router gera `src/routeTree.gen.ts` no `dev` e no `build`.
3. Leia dados com `useQuery` e `httpGet` de `src/shared/lib/http.ts`.
[//]: # (@feature-bff-start)
   Com servidor, use o client de `src/shared/lib/bff-client.ts`.
[//]: # (@feature-bff-end)
4. Mostre loading, erro e vazio. Não deixe a tela em branco enquanto a request não volta.

[//]: # (@feature-auth-start)
No preset com login, a rota fica embaixo de `_authenticated`. O `beforeLoad` manda para o login quando `/auth/me` responde 401.
[//]: # (@feature-auth-end)
