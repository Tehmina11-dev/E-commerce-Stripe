// 📁 apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import * as bodyParser from 'body-parser'; // 🎯 Explicit body-parser import

async function bootstrap() {
  // 1. Create app with rawBody enabled for Webhook signature verification
  const app = await NestFactory.create(AppModule, { 
    rawBody: true,
  });

  // =========================================================================
  // Webhook Optimization: Explicitly ensuring rawBody handling
  // =========================================================================
  app.use(bodyParser.json({
    limit: '10mb', // Stripe webhooks ke liye size limit set karna achha practice hai
    verify: (req: any, res, buf) => {
      req.rawBody = buf; // Ensure req.rawBody is available for Webhooks
    },
  }));

  // =========================================================================
  // CORS Configuration
  // =========================================================================
  app.enableCors({
    origin: 'http://localhost:3001', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
}

bootstrap();