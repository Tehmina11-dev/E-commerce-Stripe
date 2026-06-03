// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { StripeModule } from './stripe/stripe.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // `apps/backend/.env` ko target karne ke liye strict path setting:
      envFilePath: path.resolve(process.cwd(), '.env'), 
    }),
    PrismaModule,
    StripeModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}