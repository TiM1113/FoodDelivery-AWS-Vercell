import type { Order, OrderItem, OrderStatus } from "@food-delivery/shared";

export type { Order, OrderItem, OrderStatus };

export interface OrderListResponse {
  success: boolean;
  data: Order[];
}
