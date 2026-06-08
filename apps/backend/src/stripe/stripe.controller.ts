// 📁 apps/backend/src/stripe/stripe.controller.ts
import { 
  Controller, 
  Post, 
  Get, // 👈 Make sure Get is imported here
  Body, 
  HttpCode, 
  HttpStatus, 
  Req, 
  Headers, 
  BadRequestException, 
  RawBodyRequest 
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service'; // 👈 Import PrismaService
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
  // 👈 Inject both StripeService and PrismaService in constructor
  constructor(
    private readonly stripeService: StripeService,
    private readonly prismaService: PrismaService, 
  ) {}

  // =========================================================================
  // TEMPORARY: Create a Test Worker to generate a valid workerId
  // =========================================================================
  @Get('create-test-worker')
  @HttpCode(HttpStatus.OK)
  async createTestWorker() {
    try {
      const uniqueEmail = `worker_${Date.now()}@gmail.com`;
      
      const worker = await this.prismaService.worker.create({
        data: {
          name: 'Stripe Connect Test Worker',
          email: uniqueEmail,
          stripeConnectId: null,
        },
      });

      return {
        message: 'Test worker created successfully!',
        workerId: worker.id,
        email: worker.email,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to create test worker: ${error.message}`);
    }
  }

  // =========================================================================
  // 1. STRIPE CONNECT: Worker Onboarding Endpoint
  // =========================================================================
  @Post('connect/onboard')
  @HttpCode(HttpStatus.OK)
  async onboardWorker(@Body('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required to start onboarding');
    }
    return this.stripeService.generateOnboardingLink(workerId);
  }

  // =========================================================================
  // 2. SIMPLE CHECKOUT: Endpoint to Generate Checkout Session
  // =========================================================================
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@Body('items') items: { productId: string; quantity: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart items cannot be empty'); 
    }
    return this.stripeService.createCheckoutSession(items);
  }

  // =========================================================================
  // 3. WEBHOOK: Endpoint to Listen and Verify Stripe Webhook Events
  // =========================================================================
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>, 
    @Headers('stripe-signature') signature: string, 
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    return this.stripeService.handleWebhookEvent(req.rawBody, signature);
  }
}