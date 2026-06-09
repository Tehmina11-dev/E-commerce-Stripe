import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  async generateOnboardingLink(workerId: string) {
    try {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new BadRequestException(`Worker with ID ${workerId} not found!`);
      }

      let stripeConnectId = worker.stripeConnectId;

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

        await this.prisma.worker.update({
          where: { id: workerId },
          data: { stripeConnectId: stripeConnectId },
        });
      }

      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      const accountLink = await this.stripe.accountLinks.create({
        account: stripeConnectId,
        refresh_url: `${frontendUrl}/stripe-connect/refresh?workerId=${workerId}`, 
        return_url: `${frontendUrl}/stripe-connect/success?workerId=${workerId}`,  
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

  async verifyOnboardingStatus(workerId: string) {
    try {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker || !worker.stripeConnectId) {
        throw new NotFoundException('Worker or Stripe Connect Account not found');
      }

      const account = await this.stripe.accounts.retrieve(worker.stripeConnectId);

      if (account.details_submitted || account.charges_enabled) {
        await this.prisma.worker.update({
          where: { id: workerId },
          data: { isOnboardingDone: true },
        });

        return { 
          success: true, 
          message: 'Onboarding completed successfully!',
          isOnboardingDone: true 
        };
      }

      return { 
        success: false, 
        message: 'Onboarding is incomplete. Details still required inside Stripe Express dashboard.',
        isOnboardingDone: false 
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to verify Stripe status: ${error.message}`);
    }
  }

  // 👇 ADDED 'workerId: string' HERE
  async createCheckoutSession(items: { productId: string; quantity: number }[], workerId: string) {
    try {
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      let totalAmount = 0;
      const verifiedItems: { product: any; quantity: number }[] = [];

      for (const item of items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { worker: true }
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
      // 👇 USING THE workerId PASSED TO THE FUNCTION
      const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });
      let paymentConfig: any = {};

      if (worker?.stripeConnectId && worker?.isOnboardingDone) {
        const platformFee = Math.round(totalAmount * 0.10);
        paymentConfig = {
          payment_intent_data: {
            application_fee_amount: platformFee,
            transfer_data: {
              destination: worker.stripeConnectId,
            },
          },
        };
      }

      const session = await this.stripe.checkout.sessions.create({
        // No payment_method_types — let Stripe pick eligible methods dynamically
        // (configured from the Dashboard) to maximize conversion.
        line_items: lineItems,
        mode: 'payment',
        success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cancel`,
        metadata: {
          cartItems: JSON.stringify(items.map(i => ({ id: i.productId, qty: i.quantity }))),
          workerId: workerId, // Pass the id here
        },
        ...paymentConfig,
      });

      await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          currency: verifiedItems[0]?.product.currency || 'usd',
          status: 'PENDING',
          stripeSessionId: session.id, 
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
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error.message || 'Something went wrong inside checkout session creation.');
    }
  }

  // =========================================================================
  // SUBSCRIPTIONS: Worker subscribes to a recurring platform plan
  // =========================================================================
  async createSubscriptionCheckout(workerId: string, priceId?: string) {
    try {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
      });
      if (!worker) {
        throw new BadRequestException(`Worker with ID ${workerId} not found!`);
      }

      const resolvedPriceId =
        priceId || this.configService.get<string>('STRIPE_PRICE_ID');
      if (!resolvedPriceId) {
        throw new BadRequestException(
          'No subscription priceId provided and STRIPE_PRICE_ID is not configured.',
        );
      }

      // Reuse an existing Stripe Customer or create one for this worker.
      let customerId = worker.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: worker.email,
          name: worker.name,
          metadata: { workerId },
        });
        customerId = customer.id;
        await this.prisma.worker.update({
          where: { id: workerId },
          data: { stripeCustomerId: customerId },
        });
      }

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        // No payment_method_types — dynamic payment methods handle this.
        customer: customerId,
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        success_url: `${frontendUrl}/dashboard?subscription=success`,
        cancel_url: `${frontendUrl}/dashboard?subscription=cancelled`,
        metadata: { workerId },
        subscription_data: { metadata: { workerId } },
      });

      return { url: session.url };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error.message || 'Something went wrong inside subscription checkout.',
      );
    }
  }

  // Self-service management (upgrade / cancel / update card) via the Stripe Customer Portal
  async createBillingPortalSession(workerId: string) {
    try {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
      });
      if (!worker?.stripeCustomerId) {
        throw new NotFoundException(
          'No Stripe customer found for this worker. Subscribe first.',
        );
      }

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      const session = await this.stripe.billingPortal.sessions.create({
        customer: worker.stripeCustomerId,
        return_url: `${frontendUrl}/dashboard`,
      });

      return { url: session.url };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to open billing portal: ${error.message}`,
      );
    }
  }

  // Read the current subscription record for the dashboard UI.
  async getSubscriptionStatus(workerId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { workerId },
    });

    return {
      isSubscribed:
        !!subscription &&
        (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'),
      subscription,
    };
  }

  async getCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return {
        workerId: session.metadata?.workerId || '',
        cartItems: session.metadata?.cartItems ? JSON.parse(session.metadata.cartItems) : [],
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to fetch Stripe session details: ${error.message}`);
    }
  }

  async handleWebhookEvent(rawBody: Buffer | undefined, signature: string) {
    if (!rawBody) throw new BadRequestException('Empty raw body received');

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is missing in .env file');
    
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook Signature Verification Failed: ${err.message}`);
    }

    switch (event.type) {
      // ---- One-time payments (and the initial subscription payment) ----
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment') {
          await this.fulfillOrder(session);
        }
        // For mode === 'subscription', the customer.subscription.* events below
        // carry the full subscription object, so we sync there.
        break;
      }

      // ---- Subscription lifecycle (create / upgrade / cancel / renew) ----
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscription(subscription);
        break;
      }

      // ---- Recurring invoice outcomes (dunning visibility) ----
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `--- INVOICE FAILED --- customer ${invoice.customer}, invoice ${invoice.id}`,
        );
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(
          `--- INVOICE PAID --- customer ${invoice.customer}, invoice ${invoice.id}`,
        );
        break;
      }

      // ---- Stripe Connect: keep onboarding status in sync automatically ----
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await this.syncConnectAccount(account);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }

    return { received: true };
  }

  // -------------------------------------------------------------------------
  // Webhook helpers
  // -------------------------------------------------------------------------
  private async fulfillOrder(session: Stripe.Checkout.Session) {
    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (order && order.status !== 'PAID') {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            customerEmail: session.customer_details?.email || null,
            stripePaymentIntent: (session.payment_intent as string) || null,
          },
        });

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      });
      console.log(`--- ORDER SUCCESS --- Order ID: ${order.id} paid & processed!`);
    }
  }

  private mapSubscriptionStatus(status: Stripe.Subscription.Status) {
    const map: Record<string, string> = {
      trialing: 'TRIALING',
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'UNPAID',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      paused: 'PAST_DUE',
    };
    return (map[status] || 'INCOMPLETE') as any;
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    // Resolve the worker: prefer metadata, fall back to the Stripe customer id.
    let workerId: string | undefined = subscription.metadata?.workerId;
    if (!workerId) {
      const worker = await this.prisma.worker.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      workerId = worker?.id;
    }
    if (!workerId) {
      console.warn(
        `--- SUBSCRIPTION SYNC SKIPPED --- could not resolve worker for ${subscription.id}`,
      );
      return;
    }

    const data = {
      workerId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price?.id || null,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };

    try {
      await this.prisma.subscription.upsert({
        where: { workerId },
        create: data,
        update: data,
      });
    } catch (err: any) {
      // Stripe sends `customer.subscription.created` and `...updated` almost
      // simultaneously. Both can find no row and race on INSERT — the loser hits
      // a unique-constraint error (P2002). The row now exists, so just update it.
      if (err?.code === 'P2002') {
        await this.prisma.subscription.update({ where: { workerId }, data });
      } else {
        throw err;
      }
    }
    console.log(
      `--- SUBSCRIPTION SYNCED --- worker ${workerId} is now ${data.status}`,
    );
  }

  private async syncConnectAccount(account: Stripe.Account) {
    const worker = await this.prisma.worker.findFirst({
      where: { stripeConnectId: account.id },
    });
    if (!worker) return;

    const isOnboardingDone = !!(account.details_submitted || account.charges_enabled);
    if (worker.isOnboardingDone !== isOnboardingDone) {
      await this.prisma.worker.update({
        where: { id: worker.id },
        data: { isOnboardingDone },
      });
      console.log(
        `--- CONNECT SYNCED --- worker ${worker.id} onboarding = ${isOnboardingDone}`,
      );
    }
  }
}