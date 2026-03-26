import { z } from "zod";

export const AddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipcode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
});

export const OrderItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
});

export const OrderStatusSchema = z.enum([
  "Payment Pending",
  "Food Processing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
]);

export const OrderSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  items: z.array(OrderItemSchema),
  amount: z.number().positive(),
  address: AddressSchema,
  status: OrderStatusSchema.default("Payment Pending"),
  date: z.coerce.date().optional(),
  payment: z.boolean().default(false),
});

export const PlaceOrderInputSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "Order must contain at least one item"),
  amount: z.number().positive(),
  address: AddressSchema,
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: OrderStatusSchema,
});

export type Address = z.infer<typeof AddressSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
