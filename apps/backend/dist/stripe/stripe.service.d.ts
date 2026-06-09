import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class StripeService {
    private configService;
    private prisma;
    private stripe;
    constructor(configService: ConfigService, prisma: PrismaService);
    generateOnboardingLink(workerId: string): Promise<{
        url: string;
    }>;
    verifyOnboardingStatus(workerId: string): Promise<{
        success: boolean;
        message: string;
        isOnboardingDone: boolean;
    }>;
    createCheckoutSession(items: {
        productId: string;
        quantity: number;
    }[], workerId: string): Promise<{
        url: string | null;
    }>;
    createSubscriptionCheckout(workerId: string, priceId?: string): Promise<{
        url: string | null;
    }>;
    createBillingPortalSession(workerId: string): Promise<{
        url: string;
    }>;
    getSubscriptionStatus(workerId: string): Promise<{
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
    getCheckoutSession(sessionId: string): Promise<{
        workerId: string;
        cartItems: any;
    }>;
    handleWebhookEvent(rawBody: Buffer | undefined, signature: string): Promise<{
        received: boolean;
    }>;
    private fulfillOrder;
    private mapSubscriptionStatus;
    private syncSubscription;
    private syncConnectAccount;
}
