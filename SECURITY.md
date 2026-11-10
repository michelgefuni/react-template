# Segurança

Não coloque segredo em variável `VITE_` nem no código.

[//]: # (@feature-bff-start)
O browser não recebe segredo de upstream nem URL de API externa.

## O que o BFF garante

[//]: # (@feature-auth-start)
- Toda rota que não seja `/health`, `/ready` ou `/auth/*` exige sessão.
- O logout é `POST` e exige o header `x-csrf-token` mais a checagem de `Origin`.
- `returnTo` só aceita caminho relativo. `https://` e `//` são ignorados.
- A sessão é um identificador assinado em cookie `HttpOnly`, `SameSite=Lax` e, em produção, `Secure` com prefixo `__Host-`.
- Tokens da sessão ficam cifrados com AES-256-GCM no store. A chave é `SESSION_ENCRYPTION_KEY`, separada do `SESSION_SECRET`.
- O refresh do token usa um lock por sessão.
- Em produção o processo recusa store em memória, cookie inseguro e os segredos de exemplo.
[//]: # (@feature-auth-end)
- O BFF só chama upstreams declarados no ambiente. O cliente não envia host nem URL.
- O pedido ao upstream leva só `accept`, `content-type`, `x-request-id` e o `authorization` que o próprio BFF define. `Cookie` do browser não segue.
- A resposta que volta ao browser é JSON montado pela rota, não o corpo cru do upstream.
- Erros seguem o formato problem+json, sem stack trace.
- Logs passam pelo Winston em JSON e mascaram token, cookie, authorization e segredo.

## O que não fazer ao estender

[//]: # (@feature-auth-start)
- Não criar rota de domínio sem o guard de sessão.
- Não devolver token em `/auth/me` nem em log.
- Não fazer logout por `GET`.
[//]: # (@feature-auth-end)
- Não criar um proxy que repasse o caminho pedido pelo cliente.
- Não colocar segredo em variável `VITE_`.
[//]: # (@feature-bff-end)
