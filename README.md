# 🌎 P2P Country Monitor

Dashboard de monitoramento operacional para plataformas P2P multi-país, construído como protótipo de portfólio.

## Funcionalidades

- **Visão geral** de todos os países com status por cor (verde/amarelo/vermelho) baseado na variação de volume diário
- **Ranking bar** com países ordenados por performance, clicáveis para detalhes
- **Cards por país** com volume, projeção mensal, liquidez, merchants, usuários e pedidos
- **Modal de detalhes** com slider de liquidez buy/sell, tempo médio de pedidos, comparativo com mesmo dia do mês anterior
- **Alertas visuais** para pedidos antigos e não aceitos
- **Threshold configurável** por país para alertas de tempo
- **Auto-refresh** a cada 15 minutos com contador regressivo

## Contexto

Protótipo criado para demonstrar monitoramento operacional de uma plataforma P2P financeira multi-país (América Latina). O sistema foi desenhado para escalar de 8 para 40+ países, tornando inviável o monitoramento manual um a um.

Os dados são mockados para fins de demonstração. Em produção, viriam de uma API conectada a indexadores de blockchain (The Graph / Alchemy) e banco de dados de operações.

## Stack

- React 18 + Vite
- CSS-in-JS inline (sem dependências de estilo)
- IBM Plex Mono + Space Grotesk (Google Fonts)

## Rodar localmente

```bash
npm install
npm run dev
```

## Deploy

Conecte o repositório ao [Vercel](https://vercel.com) — ele detecta automaticamente o Vite e faz o build.
