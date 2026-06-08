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
    checkout(items: {
        productId: string;
        quantity: number;
    }[]): Promise<{
        url: string | null;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
