// Mirrors the Prisma models exposed by the NestJS backend.

export interface Product {
  id: string;
  name: string;
  description: string | null;
  /** Price in the smallest currency unit (e.g. cents). */
  price: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "FULFILLED";

export interface Order {
  id: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  customerEmail: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** A single line in the shopping cart, persisted client-side. */
export interface CartLine {
  productId: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  stock: number;
  quantity: number;
}
