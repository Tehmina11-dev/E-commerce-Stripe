// 📁 apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // 1. Enable built-in rawBody to preserve the raw stream for Stripe webhook signatures
  const app = await NestFactory.create(AppModule, {
    rawBody: true, 
  });

  // =========================================================================
  // CORS Configuration: Allows frontend to communicate with backend safely
  // =========================================================================
  app.enableCors({
    origin: 'http://localhost:3001', // Your Frontend Next.js URL/Port
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