# 4. OIDC com sessão HttpOnly

O login é Authorization Code com PKCE. O browser guarda só o id da sessão, em cookie HttpOnly. Access token e refresh token ficam cifrados no store.

Produção exige Redis, cookie `Secure` e segredos que não sejam os de exemplo. O refresh usa lock por sessão para várias abas não invalidarem o token rotacionado.
