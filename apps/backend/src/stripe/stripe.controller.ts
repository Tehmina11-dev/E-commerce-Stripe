import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  Req, 
  Headers, 
  BadRequestException, 
  RawBodyRequest 
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  // 1. Checkout Session generate karne ka endpoint (Existing)
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(@Body('items') items: { productId: string; quantity: number }[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart items cannot be empty'); 
    }
    return this.stripeService.createCheckoutSession(items);
  }

  // 2. Stripe Webhook ko listen karne ka endpoint (New)
  @Post('webhook')
  @HttpCode(HttpStatus.OK) // Stripe ko 200 OK response dena zaroori hota hai
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>, // Raw body ko preserve karne ke liye
    @Headers('stripe-signature') signature: string, // Stripe ka secure signature
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // `req.rawBody` direct pass hoga service ko signature verify karne ke liye
    return this.stripeService.handleWebhookEvent(req.rawBody, signature);
  }
}