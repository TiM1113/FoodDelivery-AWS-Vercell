import { z } from "zod";

export const FoodCategorySchema = z.enum([
  "Salad",
  "Rolls",
  "Deserts",
  "Sandwich",
  "Cake",
  "Pure Veg",
  "Pasta",
  "Noodles",
]);

export const FoodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive("Price must be a positive number"),
  image: z.string().min(1),
  category: FoodCategorySchema,
});

export const AddFoodInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category: FoodCategorySchema,
});

export const UpdateFoodInputSchema = z.object({
  id: z.string().min(1, "Food ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category: FoodCategorySchema,
  imageKey: z.string().optional(),
});

export type Food = z.infer<typeof FoodSchema>;
export type FoodCategory = z.infer<typeof FoodCategorySchema>;
export type AddFoodInput = z.infer<typeof AddFoodInputSchema>;
export type UpdateFoodInput = z.infer<typeof UpdateFoodInputSchema>;
