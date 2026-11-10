# BFF

- O núcleo HTTP está em `src/core`. Rotas novas entram na cadeia de `createRoutes`.
[//]: # (@feature-auth-start)
- Com login, a rota entra depois de `requireSession`.
[//]: # (@feature-auth-end)
- Validação com Zod. Erro com `problem()` de `@react-template/shared`.
- Upstream novo segue `docs/guides/add-upstream.md`. O modo é `none`, `client-credentials` ou `user-token`.
[//]: # (@feature-auth-start)
  `user-token` usa a sessão.
[//]: # (@feature-auth-end)
- Não leia `process.env` fora de `src/config`.
- Logue com o Winston em JSON. Não logue token, cookie nem segredo.
