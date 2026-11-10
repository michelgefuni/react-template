# 11. Presets no bootstrap

O starter nasce com front, BFF e login para poder ser experimentado completo. `pnpm create-project` pergunta o preset e apaga o que não entra.

| Preset | Fica | Sai |
| --- | --- | --- |
| `web` | SPA | BFF, login, Keycloak, Redis |
| `bff` | SPA e BFF | login, Keycloak, Redis |
| `bff-auth` | SPA, BFF e login OIDC | nada além das amostras |

Login só existe junto com o BFF. O token não volta para o browser. Quem precisa de SSR ou de uma biblioteca de componentes parte de outro template.
