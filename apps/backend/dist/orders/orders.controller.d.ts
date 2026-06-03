import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    checkout(dto: CheckoutDto): Promise<{
        items: {
            id: string;
            quantity: number;
            unitPrice: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        totalAmount: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerEmail: string | null;
        stripeSessionId: string | null;
        stripePaymentIntent: string | null;
    }>;
    findAll(): Promise<({
        items: {
            id: string;
            quantity: number;
            unitPrice: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        totalAmount: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerEmail: string | null;
        stripeSessionId: string | null;
        stripePaymentIntent: string | null;
    })[]>;
    findOne(id: string): Promise<{
        items: {
            id: string;
            quantity: number;
            unitPrice: number;
            productId: string;
            orderId: string;
        }[];
    } & {
        id: string;
        currency: string;
        createdAt: Date;
        updatedAt: Date;
        totalAmount: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerEmail: string | null;
        stripeSessionId: string | null;
        stripePaymentIntent: string | null;
    }>;
}
