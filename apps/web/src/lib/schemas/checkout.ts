import { z } from "zod";

export const checkoutSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  street: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Street address must be 200 characters or less"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less"),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be 100 characters or less"),
  zipcode: z
    .string()
    .min(1, "Zip code is required")
    .regex(/^\d{4,10}$/, "Zip code must be 4-10 digits"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be 100 characters or less"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s\-()]{8,20}$/, "Please enter a valid phone number"),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
