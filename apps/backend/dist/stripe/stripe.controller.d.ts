import { RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
export declare class StripeController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
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
