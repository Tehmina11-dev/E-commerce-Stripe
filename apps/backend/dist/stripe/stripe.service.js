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
            apiVersion: undefined,
        });
    }
    async createCheckoutSession(items) {
        try {
            const lineItems = [];
            let totalAmount = 0;
            const verifiedItems = [];
            for (const item of items) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
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
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.message || 'Something went wrong inside checkout session creation.');
        }
    }
    async handleWebhookEvent(rawBody, signature) {
        if (!rawBody) {
            throw new common_1.BadRequestException('Empty raw body received');
        }
        let event;
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing in .env file');
        }
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Signature Verification Failed: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const order = await this.prisma.order.findUnique({
                where: { stripeSessionId: session.id },
                include: { items: true },
            });
            if (!order) {
                console.error(`Order not found for Stripe Session ID: ${session.id}`);
                return { received: true };
            }
            if (order.status !== 'PAID') {
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
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map