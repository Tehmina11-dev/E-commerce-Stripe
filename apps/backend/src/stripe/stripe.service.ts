// 📁 apps/backend/src/stripe/stripe.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is missing in .env file');
    }
    
    // Set API version to undefined to prevent version mismatch crashes
    this.stripe = new Stripe(secretKey, {
      apiVersion: undefined as any,
    });
  }

  // =========================================================================
  // 1. STRIPE CONNECT: Generate Worker Onboarding Link
  // =========================================================================
  async generateOnboardingLink(workerId: string) {
    try {
      // Check if the worker exists in the database
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new BadRequestException(`Worker with ID ${workerId} not found!`);
      }

      let stripeConnectId = worker.stripeConnectId;

      // If the worker does not have a Stripe Connect ID, create a new Express account
      if (!stripeConnectId) {
        const account = await this.stripe.accounts.create({
          type: 'express',
          email: worker.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        stripeConnectId = account.id;

        // Save the Stripe Connect Account ID to the database
        await this.prisma.worker.update({
          where: { id: workerId },
          data: { stripeConnectId: stripeConnectId },
        });
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      // Create an onboarding link where the worker will enter their bank details
      const accountLink = await this.stripe.accountLinks.create({
        account: stripeConnectId,
        refresh_url: `${frontendUrl}/stripe-connect/refresh`, // Redirection URL if the link expires
        return_url: `${frontendUrl}/stripe-connect/success`,  // Redirection URL when onboarding is complete
        type: 'account_onboarding',
      });

      return { url: accountLink.url };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Something went wrong inside Connect onboarding.');
    }
  }

  // =========================================================================
  // 2. SIMPLE CHECKOUT: Create Checkout Session + Save PENDING Order
  // =========================================================================
  async createCheckoutSession(items: { productId: string; quantity: number }[]) {
    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      let totalAmount = 0;
      const verifiedItems: { product: any; quantity: number }[] = [];

      // Verify products and calculate total amount
      for (const item of items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Product with ID ${item.productId} not found!`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }

        totalAmount += product.price * item.quantity;
        verifiedItems.push({ product, quantity: item.quantity });

        lineItems.push({
          price_data: {
            currency: product.currency || 'usd',
            product_data: {
              name: product.name,
              description: product.description || undefined, 
              images: product.imageUrl ? [product.imageUrl] : [],
            },
            unit_amount: product.price,
          },
          quantity: item.quantity,
        });
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      // Generate temporary Stripe Checkout Session without Order ID
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cancel`,
        metadata: {
          cartItems: JSON.stringify(items.map(i => ({ id: i.productId, qty: i.quantity }))),
        },
      });

      // Save Order and OrderItems to the database with PENDING status
      await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          currency: verifiedItems[0]?.product.currency || 'usd',
          status: 'PENDING',
          stripeSessionId: session.id, // Used later to track order in webhook
          items: {
            create: verifiedItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          },
        },
      });

      return { url: session.url };

    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Something went wrong inside checkout session creation.');
    }
  }

  // =========================================================================
  // 3. WEBHOOK: Confirm Payment, Update Order Status to PAID, and Reduce Stock
  // =========================================================================
  async handleWebhookEvent(rawBody: Buffer | undefined, signature: string) {
    if (!rawBody) {
      throw new BadRequestException('Empty raw body received');
    }

    let event: Stripe.Event;
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is missing in .env file');
    }

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook Signature Verification Failed: ${err.message}`);
    }

    // Process database changes upon successful payment confirmation
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Find the Order and its items using the Stripe Session ID
      const order = await this.prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: { items: true },
      });

      if (!order) {
        console.error(`Order not found for Stripe Session ID: ${session.id}`);
        return { received: true };
      }

      // Perform state transitions only if the order status is not already PAID (Idempotency safety)
      if (order.status !== 'PAID') {
        // Wrap database operations inside a Prisma $transaction for safety
        await this.prisma.$transaction(async (tx) => {
          
          // A. Mark Order status as PAID and attach reference tokens
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              customerEmail: session.customer_details?.email || null,
              stripePaymentIntent: session.payment_intent as string || null,
            },
          });

          // B. Iterate through each item and decrement product stock
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        });

        console.log(`--- ORDER SUCCESS --- Order ID: ${order.id} has been paid and stock updated!`);
      }
    }

    return { received: true };
  }
}