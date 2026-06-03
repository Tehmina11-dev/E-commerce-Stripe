import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class StripeService {
    private configService;
    private prisma;
    private stripe;
    constructor(configService: ConfigService, prisma: PrismaService);
    createCheckoutSession(items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        url: string | null;
    }>;
    handleWebhookEvent(rawBody: Buffer | undefined, signature: string): Promise<{
        received: boolean;
    }>;
}
