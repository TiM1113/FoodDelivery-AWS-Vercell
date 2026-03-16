import { z } from "zod";

export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  cartData: z.record(z.string(), z.number()).default({}),
});

export const RegisterInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type User = z.infer<typeof UserSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
