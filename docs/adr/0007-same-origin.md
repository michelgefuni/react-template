# 7. Mesma origem

Em desenvolvimento o Vite encaminha `/api` para o BFF. Em produção o nginx faz o mesmo. O BFF não reescreve o prefixo: o client e o `redirect_uri` usam `/api` nos dois ambientes. CORS só entra se `CORS_ALLOWED_ORIGINS` estiver definido.
