# TrailForge

Планировщик пеших маршрутов для регионов со слабым покрытием картографическими
данными — Армения, Грузия, Кавказ. Расчёт маршрутов с учётом рельефа,
профиль высот, интерактивный hillshade, офлайн-режим.

## Структура

- `apps/web` — Next.js приложение (App Router)
- `packages/geo` — проекция Web Mercator, тайловая математика, геодезия

## Разработка

    pnpm install
    pnpm --filter web dev
    pnpm --filter @trailforge/geo test

Требования: Node.js >= 20.9, pnpm >= 9.
