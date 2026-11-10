# Adicionar um upstream

Presets `bff` e `bff-auth`.

1. Coloque a spec OpenAPI em `apps/bff/openapi/<nome>.yaml`, ou aponte `UPSTREAM_<NOME>_OPENAPI_URL` para uma spec remota e rode a geração só quando ela estiver no ar.
2. No `.env`:

```
UPSTREAM_<NOME>_URL=https://api.example.com
UPSTREAM_<NOME>_AUTH_MODE=none
```

`AUTH_MODE` é `none`, `client-credentials` ou `user-token`. No modo `client-credentials`, informe também `UPSTREAM_<NOME>_CLIENT_ID`, `UPSTREAM_<NOME>_CLIENT_SECRET` e `UPSTREAM_<NOME>_TOKEN_URL`. `user-token` encaminha o token da sessão e só funciona com login.

3. Rode `pnpm gen:upstreams`.
4. Crie o cliente com `createTypedClient` e chame só paths da spec.
[//]: # (@feature-auth-start)
   A rota que expõe o resultado fica depois do guard de sessão.
[//]: # (@feature-auth-end)

Não receba a URL do browser. O nome do upstream é fixo na configuração.
