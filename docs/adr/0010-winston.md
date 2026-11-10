# 10. Logs com Winston

Logs do BFF saem em JSON no stdout pelo Winston, com timestamp, nível e contexto. Campos de token, cookie, authorization e segredo são mascarados antes de gravar.

`console.*` não é usado no código do servidor. O padrão do repositório pede Winston para os logs serem compatíveis com coletores que leem JSON.
