import { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
export declare class StripeController {
    private readonly stripeService;
    private readonly prismaService;
    constructor(stripeService: StripeService, prismaService: PrismaService);
    createTestWorker(): Promise<{
        message: string;
        workerId: string;
        email: string;
    }>;
    onboardWorker(workerId: string): Promise<{
        url: string;
    }>;
    verifyWorkerOnboarding(workerId: string): Promise<{
        success: boolean;
        message: string;
        isOnboardingDone: boolean;
    }>;
    checkout(workerId: string, items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        url: string | null;
    }>;
    getSession(sessionId: string): Promise<{
        workerId: string;
        cartItems: any;
    }>;
    subscriptionCheckout(workerId: string, priceId?: string): Promise<{
        url: string | null;
    }>;
    subscriptionPortal(workerId: string): Promise<{
        url: string;
    }>;
    subscriptionStatus(workerId: string): Promise<{
        isSubscribed: boolean;
        subscription: {
            id: string;
            stripeCustomerId: string;
            createdAt: Date;
            updatedAt: Date;
            workerId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            stripeSubscriptionId: string;
            stripePriceId: string | null;
            currentPeriodEnd: Date | null;
            cancelAtPeriodEnd: boolean;
        } | null;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
