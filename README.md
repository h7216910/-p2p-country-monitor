# 🌎 P2P Country Monitor

Operational monitoring dashboard for multi-country P2P financial platforms, built as a portfolio prototype.

## Features

- **Country overview** with color-coded status (green/yellow/red) based on daily volume variation
- **Ranking bar** with countries sorted by performance, clickable for details
- **Per-country cards** showing volume, monthly projection, liquidity, merchants, users, and orders
- **Detail modal** with buy/sell liquidity slider, average order time bar, and comparison vs same day last month
- **Visual alerts** for old and unaccepted orders
- **Configurable threshold** per country for time-based alerts
- **Auto-refresh** every 15 minutes with countdown timer

## Context

Prototype built to demonstrate operational monitoring of a multi-country P2P financial platform (Latin America). The system was designed to scale from 8 to 40+ countries, making manual one-by-one monitoring unfeasible.

Data is mocked for demonstration purposes. In production, it would come from an API connected to blockchain indexers (The Graph / Alchemy) and an operations database.

## Stack

- React 18 + Vite
- Inline CSS-in-JS (no style dependencies)
- IBM Plex Mono + Space Grotesk (Google Fonts)

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Connect the repository to [Vercel](https://vercel.com) — it automatically detects Vite and handles the build.
