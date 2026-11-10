# 6. Rotas explícitas no BFF

Cada caminho de upstream é uma rota escrita no código. Não existe proxy que repasse o path pedido pelo browser. Isso evita SSRF e mantém o tipo do client.
