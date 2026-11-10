# 2. SPA com BFF

O browser só conhece `/api`. O BFF chama as APIs externas.
[//]: # (@feature-auth-start)
O login fica nessa camada. O token não volta para o browser.
[//]: # (@feature-auth-end)

SSR fica de fora.
[//]: # (@sample-start)
O preset `web` entrega só o front. Os outros presets estão na [0011](0011-presets.md).
[//]: # (@sample-end)
