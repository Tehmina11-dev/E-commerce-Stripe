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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const common_1 = require("@nestjs/common");
const stripe_service_1 = require("./stripe.service");
const prisma_service_1 = require("../prisma/prisma.service");
let StripeController = class StripeController {
    constructor(stripeService, prismaService) {
        this.stripeService = stripeService;
        this.prismaService = prismaService;
    }
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to create test worker: ${error.message}`);
        }
    }
    async onboardWorker(workerId) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required to start onboarding');
        }
        return this.stripeService.generateOnboardingLink(workerId);
    }
    async verifyWorkerOnboarding(workerId) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required to verify status');
        }
        return this.stripeService.verifyOnboardingStatus(workerId);
    }
    async checkout(workerId, items) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required for metadata context');
        }
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Cart items cannot be empty');
        }
        return this.stripeService.createCheckoutSession(items, workerId);
    }
    async getSession(sessionId) {
        if (!sessionId) {
            throw new common_1.BadRequestException('sessionId param is required');
        }
        return this.stripeService.getCheckoutSession(sessionId);
    }
    async subscriptionCheckout(workerId, priceId) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required to start a subscription');
        }
        return this.stripeService.createSubscriptionCheckout(workerId, priceId);
    }
    async subscriptionPortal(workerId) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required to open the billing portal');
        }
        return this.stripeService.createBillingPortalSession(workerId);
    }
    async subscriptionStatus(workerId) {
        if (!workerId) {
            throw new common_1.BadRequestException('workerId is required to read subscription status');
        }
        return this.stripeService.getSubscriptionStatus(workerId);
    }
    async handleWebhook(req, signature) {
        if (!signature) {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        if (!req.rawBody) {
            throw new common_1.BadRequestException('Raw body is empty. Ensure NestFactory.create(..., { rawBody: true }) is configured.');
        }
        return this.stripeService.handleWebhookEvent(req.rawBody, signature);
    }
};
exports.StripeController = StripeController;
__decorate([
    (0, common_1.Get)('create-test-worker'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "createTestWorker", null);
__decorate([
    (0, common_1.Post)('connect/onboard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "onboardWorker", null);
__decorate([
    (0, common_1.Get)('connect/verify/:workerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "verifyWorkerOnboarding", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('workerId')),
    __param(1, (0, common_1.Body)('items')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('checkout-session/:sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('subscription/checkout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('workerId')),
    __param(1, (0, common_1.Body)('priceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "subscriptionCheckout", null);
__decorate([
    (0, common_1.Post)('subscription/portal'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "subscriptionPortal", null);
__decorate([
    (0, common_1.Get)('subscription/status/:workerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('workerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "subscriptionStatus", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "handleWebhook", null);
exports.StripeController = StripeController = __decorate([
    (0, common_1.Controller)('stripe'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService,
        prisma_service_1.PrismaService])
], StripeController);
//# sourceMappingURL=stripe.controller.js.map