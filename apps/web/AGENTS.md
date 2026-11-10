# Front

- Nova tela: `src/features/<nome>` e uma rota em `src/routes`.
- Estado de servidor: TanStack Query.
- Busque dados com `src/shared/lib/http.ts`.
[//]: # (@feature-bff-start)
- Com BFF, busque com `src/shared/lib/bff-client.ts`. Não escreva a URL do upstream no front.
[//]: # (@feature-bff-end)
- Trate loading, erro e vazio na feature.
- Configuração de ambiente fica em `src/config/env.ts`.
