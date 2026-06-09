"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_1 = __importDefault(require("stripe"));
let StripeService = class StripeService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const secretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is missing in .env file');
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2024-04-10',
        });
    }
    async generateOnboardingLink(workerId) {
        try {
            const worker = await this.prisma.worker.findUnique({
                where: { id: workerId },
            });
            if (!worker) {
                throw new common_1.BadRequestException(`Worker with ID ${workerId} not found!`);
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
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
            const accountLink = await this.stripe.accountLinks.create({
                account: stripeConnectId,
                refresh_url: `${frontendUrl}/stripe-connect/refresh?workerId=${workerId}`,
                return_url: `${frontendUrl}/stripe-connect/success?workerId=${workerId}`,
                type: 'account_onboarding',
            });
            return { url: accountLink.url };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.message || 'Something went wrong inside Connect onboarding.');
        }
    }
    async verifyOnboardingStatus(workerId) {
        try {
            const worker = await this.prisma.worker.findUnique({
                where: { id: workerId },
            });
            if (!worker || !worker.stripeConnectId) {
                throw new common_1.NotFoundException('Worker or Stripe Connect Account not found');
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(`Failed to verify Stripe status: ${error.message}`);
        }
    }
    async createCheckoutSession(items, workerId) {
        try {
            const lineItems = [];
            let totalAmount = 0;
            const verifiedItems = [];
            for (const item of items) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { worker: true }
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Product with ID ${item.productId} not found!`);
                }
                if (product.stock < item.quantity) {
                    throw new common_1.BadRequestException(`Not enough stock for ${product.name}`);
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
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
            const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });
            let paymentConfig = {};
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
                line_items: lineItems,
                mode: 'payment',
                success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${frontendUrl}/cancel`,
                metadata: {
                    cartItems: JSON.stringify(items.map(i => ({ id: i.productId, qty: i.quantity }))),
                    workerId: workerId,
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(error.message || 'Something went wrong inside checkout session creation.');
        }
    }
    async createSubscriptionCheckout(workerId, priceId) {
        try {
            const worker = await this.prisma.worker.findUnique({
                where: { id: workerId },
            });
            if (!worker) {
                throw new common_1.BadRequestException(`Worker with ID ${workerId} not found!`);
            }
            const resolvedPriceId = priceId || this.configService.get('STRIPE_PRICE_ID');
            if (!resolvedPriceId) {
                throw new common_1.BadRequestException('No subscription priceId provided and STRIPE_PRICE_ID is not configured.');
            }
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
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
            const session = await this.stripe.checkout.sessions.create({
                mode: 'subscription',
                customer: customerId,
                line_items: [{ price: resolvedPriceId, quantity: 1 }],
                success_url: `${frontendUrl}/dashboard?subscription=success`,
                cancel_url: `${frontendUrl}/dashboard?subscription=cancelled`,
                metadata: { workerId },
                subscription_data: { metadata: { workerId } },
            });
            return { url: session.url };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException(error.message || 'Something went wrong inside subscription checkout.');
        }
    }
    async createBillingPortalSession(workerId) {
        try {
            const worker = await this.prisma.worker.findUnique({
                where: { id: workerId },
            });
            if (!worker?.stripeCustomerId) {
                throw new common_1.NotFoundException('No Stripe customer found for this worker. Subscribe first.');
            }
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3001';
            const session = await this.stripe.billingPortal.sessions.create({
                customer: worker.stripeCustomerId,
                return_url: `${frontendUrl}/dashboard`,
            });
            return { url: session.url };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.BadRequestException(`Failed to open billing portal: ${error.message}`);
        }
    }
    async getSubscriptionStatus(workerId) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { workerId },
        });
        return {
            isSubscribed: !!subscription &&
                (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'),
            subscription,
        };
    }
    async getCheckoutSession(sessionId) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            return {
                workerId: session.metadata?.workerId || '',
                cartItems: session.metadata?.cartItems ? JSON.parse(session.metadata.cartItems) : [],
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to fetch Stripe session details: ${error.message}`);
        }
    }
    async handleWebhookEvent(rawBody, signature) {
        if (!rawBody)
            throw new common_1.BadRequestException('Empty raw body received');
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret)
            throw new Error('STRIPE_WEBHOOK_SECRET is missing in .env file');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Signature Verification Failed: ${err.message}`);
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode === 'payment') {
                    await this.fulfillOrder(session);
                }
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await this.syncSubscription(subscription);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                console.warn(`--- INVOICE FAILED --- customer ${invoice.customer}, invoice ${invoice.id}`);
                break;
            }
            case 'invoice.paid': {
                const invoice = event.data.object;
                console.log(`--- INVOICE PAID --- customer ${invoice.customer}, invoice ${invoice.id}`);
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                await this.syncConnectAccount(account);
                break;
            }
            default:
                break;
        }
        return { received: true };
    }
    async fulfillOrder(session) {
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
                        stripePaymentIntent: session.payment_intent || null,
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
    mapSubscriptionStatus(status) {
        const map = {
            trialing: 'TRIALING',
            active: 'ACTIVE',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            unpaid: 'UNPAID',
            incomplete: 'INCOMPLETE',
            incomplete_expired: 'INCOMPLETE_EXPIRED',
            paused: 'PAST_DUE',
        };
        return (map[status] || 'INCOMPLETE');
    }
    async syncSubscription(subscription) {
        let workerId = subscription.metadata?.workerId;
        if (!workerId) {
            const worker = await this.prisma.worker.findFirst({
                where: { stripeCustomerId: subscription.customer },
            });
            workerId = worker?.id;
        }
        if (!workerId) {
            console.warn(`--- SUBSCRIPTION SYNC SKIPPED --- could not resolve worker for ${subscription.id}`);
            return;
        }
        const data = {
            workerId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
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
        }
        catch (err) {
            if (err?.code === 'P2002') {
                await this.prisma.subscription.update({ where: { workerId }, data });
            }
            else {
                throw err;
            }
        }
        console.log(`--- SUBSCRIPTION SYNCED --- worker ${workerId} is now ${data.status}`);
    }
    async syncConnectAccount(account) {
        const worker = await this.prisma.worker.findFirst({
            where: { stripeConnectId: account.id },
        });
        if (!worker)
            return;
        const isOnboardingDone = !!(account.details_submitted || account.charges_enabled);
        if (worker.isOnboardingDone !== isOnboardingDone) {
            await this.prisma.worker.update({
                where: { id: worker.id },
                data: { isOnboardingDone },
            });
            console.log(`--- CONNECT SYNCED --- worker ${worker.id} onboarding = ${isOnboardingDone}`);
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map