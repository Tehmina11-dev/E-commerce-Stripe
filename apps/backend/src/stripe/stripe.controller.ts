// 📁 apps/backend/src/stripe/stripe.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
  Req, 
  Headers, 
  BadRequestException, 
  RawBodyRequest 
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service'; 
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
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
          isOnboardingDone: false,
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
  // STRIPE CONNECT VERIFICATION ENDPOINT
  // =========================================================================
  @Get('connect/verify/:workerId')
  @HttpCode(HttpStatus.OK)
  async verifyWorkerOnboarding(@Param('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required to verify status');
    }
    return this.stripeService.verifyOnboardingStatus(workerId);
  }

  // =========================================================================
  // 2. SIMPLE CHECKOUT: Endpoint to Generate Checkout Session
  // =========================================================================
 // 📁 apps/backend/src/stripe/stripe.controller.ts

// ... (keep imports)

  // =========================================================================
  // 2. SIMPLE CHECKOUT: Endpoint to Generate Checkout Session
  // =========================================================================
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @Body('workerId') workerId: string,
    @Body('items') items: { productId: string; quantity: number }[]
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required for metadata context');
    }
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart items cannot be empty'); 
    }
    
    // FIX: Pass workerId to the service
    return this.stripeService.createCheckoutSession(items, workerId);
  }

// ...

  // =========================================================================
  // GET CHECKOUT SESSION DETAILS
  // =========================================================================
  @Get('checkout-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getSession(@Param('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId param is required');
    }
    return this.stripeService.getCheckoutSession(sessionId);
  }

  // =========================================================================
  // SUBSCRIPTIONS: Worker platform plan (recurring billing)
  // =========================================================================
  @Post('subscription/checkout')
  @HttpCode(HttpStatus.OK)
  async subscriptionCheckout(
    @Body('workerId') workerId: string,
    @Body('priceId') priceId?: string,
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required to start a subscription');
    }
    return this.stripeService.createSubscriptionCheckout(workerId, priceId);
  }

  // Stripe Customer Portal — self-service upgrade / cancel / update card
  @Post('subscription/portal')
  @HttpCode(HttpStatus.OK)
  async subscriptionPortal(@Body('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required to open the billing portal');
    }
    return this.stripeService.createBillingPortalSession(workerId);
  }

  @Get('subscription/status/:workerId')
  @HttpCode(HttpStatus.OK)
  async subscriptionStatus(@Param('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required to read subscription status');
    }
    return this.stripeService.getSubscriptionStatus(workerId);
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
    if (!req.rawBody) {
      throw new BadRequestException('Raw body is empty. Ensure NestFactory.create(..., { rawBody: true }) is configured.');
    }
    return this.stripeService.handleWebhookEvent(req.rawBody, signature);
  }
}