# Luxmart — Premium Storefront (web)

A premium, Amazon-style frontend for the NestJS + Stripe ecommerce backend, built
with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

> Note: A frontend uses **Next.js** (NestJS is a backend framework). This app pairs
> with the NestJS API in `../backend`.

## Features

- **Storefront** — hero, responsive product grid, search, ratings, "Prime" badges.
- **Product detail** — gallery, buy box, sticky purchase panel, quantity stepper.
- **Cart** — client-side, persisted to `localStorage`, live header badge.
- **Checkout** — order summary + email, posts to the backend, success/cancel pages.
- **Resilient** — graceful fallbacks when the backend is offline or images fail.

## Architecture

- Product data is fetched in **Server Components** (server-to-server → no CORS).
- Checkout goes through a **Next route handler proxy** at `/api/checkout`, which
  forwards to the backend `POST /orders/checkout`. The browser never calls the
  backend directly, so no CORS config is required.

## Getting started

```bash
# from apps/web
cp .env.local.example .env.local   # set BACKEND_URL if not http://localhost:3000
npm install
npm run dev                         # http://localhost:3001
```

Make sure the backend is running (and seeded) first:

```bash
# from apps/backend
npm run start:dev          # http://localhost:3000
npm run prisma:seed        # populate demo products
```

## Configuration

| Var           | Default                  | Purpose                          |
| ------------- | ------------------------ | -------------------------------- |
| `BACKEND_URL` | `http://localhost:3000`  | NestJS API base (server-side).   |

The web app runs on **port 3001** to avoid clashing with the backend on 3000.
