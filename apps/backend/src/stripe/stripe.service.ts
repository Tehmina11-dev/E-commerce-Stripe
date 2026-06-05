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
    
    // API version ko undefined kiya taake version mismatch ka crash na aaye
    this.stripe = new Stripe(secretKey, {
      apiVersion: undefined as any,
    });
  }

  // 1. Checkout Session Create Karna + Database mein PENDING Order dalna
  async createCheckoutSession(items: { productId: string; quantity: number }[]) {
    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      let totalAmount = 0;
      const verifiedItems: { product: any; quantity: number }[] = [];

      // Products verify karna aur total amount calculate karna
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

      // Temporary Stripe Checkout Session generate karna bina Order ID ke
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

      // Database mein Order aur OrderItems ko PENDING status ke sath save karna
      await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          currency: verifiedItems[0]?.product.currency || 'usd',
          status: 'PENDING',
          stripeSessionId: session.id, // Is session ID se hum baad mein webhook mein order track karenge
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
      // Agar error pehle se BadRequestException hai toh wahi bhejenge, warna generic wrapper bhejenge
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Something went wrong inside checkout session creation.');
    }
  }

  // 2. Webhook Se Payment Confirm Karke Order PAID Karna Aur Stock Kam Karna
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

    // Payment kamyaab hone par database transitions chalana
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Session ID ke zariye database se Order aur uske items dhoondna
      const order = await this.prisma.order.findUnique({
        where: { stripeSessionId: session.id },
        include: { items: true },
      });

      if (!order) {
        console.error(`Order not found for Stripe Session ID: ${session.id}`);
        return { received: true };
      }

      // Agar order pehle se PAID nahi hai toh hi updates chalayenge (Idempotency safety)
      if (order.status !== 'PAID') {
        // Prisma $transaction use kar rahe hain taake agar ek bhi operation fail ho toh poora transaction roll back ho jaye
        await this.prisma.$transaction(async (tx) => {
          
          // A. Order Status ko PAID mark karna aur references add karna
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              customerEmail: session.customer_details?.email || null,
              stripePaymentIntent: session.payment_intent as string || null,
            },
          });

          // B. Har item ka loop chala kar stock reduce karna
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