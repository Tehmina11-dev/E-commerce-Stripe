# Ecommerce Backend

A NestJS backend for a simple ecommerce store with Stripe Checkout integration and Prisma (PostgreSQL).

## Structure

```
ecommerce-backend/
├── prisma/
│   ├── schema.prisma          # Database models (Product, Order, OrderItem)
│   └── seed.ts                # Populate initial dummy products
├── src/
│   ├── common/                # Shared utilities (decorators, filters, guards)
│   ├── prisma/                # Global Prisma module & service
│   ├── products/              # Product management module
│   ├── orders/                # Checkout & order processing module
│   ├── stripe/                # Stripe SDK wrapper
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` with your database URL and Stripe keys.
3. Generate the Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. (Optional) Seed dummy products:
   ```bash
   npm run prisma:seed
   ```
5. Start the dev server:
   ```bash
   npm run start:dev
   ```

## Endpoints

- `GET    /products` — list active products
- `POST   /products` — create a product
- `GET    /products/:id` — get a product
- `PATCH  /products/:id` — update a product
- `DELETE /products/:id` — delete a product
- `POST   /orders/checkout` — create an order and Stripe Checkout session
- `GET    /orders/:id` — get an order
