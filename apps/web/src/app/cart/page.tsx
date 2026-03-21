"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import type { Food, FoodListResponse } from "@/types/food";

const DELIVERY_FEE = 2;

async function fetchFoods(): Promise<Food[]> {
  const res = await fetch("/api/food/list");
  if (!res.ok) throw new Error("Failed to fetch food list");
  const json: FoodListResponse = await res.json();
  return json.data;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);

  const { data: foods = [] } = useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
  });

  const cartFoods = foods.filter((f) => f._id && items[f._id] > 0);
  const subtotal = getTotalAmount(foods);
  const deliveryFee = cartFoods.length > 0 ? DELIVERY_FEE : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  if (cartFoods.length === 0) {
    return (
      <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Looks like you haven&apos;t added any items yet.
        </p>
        <Link href="/" className={buttonVariants()}>
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-[80%] flex-col gap-8 py-8">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      {/* Cart items table */}
      <div className="flex flex-col gap-0">
        {/* Header (hidden on mobile) */}
        <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b pb-3 text-sm font-medium text-muted-foreground sm:grid">
          <span>Item</span>
          <span>Title</span>
          <span className="text-center">Price</span>
          <span className="text-center">Quantity</span>
          <span className="text-right">Total</span>
          <span className="w-8" />
        </div>

        {cartFoods.map((food) => {
          const qty = items[food._id!];
          const lineTotal = Math.round(food.price * qty * 100) / 100;

          return (
            <div
              key={food._id}
              className="grid grid-cols-[60px_1fr_auto] items-center gap-4 border-b py-4 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto]"
            >
              {/* Image */}
              <div className="relative h-14 w-14 overflow-hidden rounded-md sm:h-16 sm:w-16">
                <Image
                  src={food.image}
                  alt={food.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Title + mobile price */}
              <div className="flex flex-col gap-1">
                <span className="font-medium">{food.name}</span>
                <span className="text-sm text-muted-foreground sm:hidden">
                  ${food.price.toFixed(2)} each
                </span>
              </div>

              {/* Mobile: quantity + remove */}
              <div className="flex items-center gap-3 sm:hidden">
                <div className="flex items-center gap-2 rounded-full border px-2 py-1">
                  <button
                    type="button"
                    onClick={() => removeItem(food._id!)}
                    aria-label="Remove one"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[1rem] text-center text-sm font-medium">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => addItem(food._id!)}
                    aria-label="Add one more"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="font-medium">${lineTotal.toFixed(2)}</span>
              </div>

              {/* Desktop: price */}
              <span className="hidden text-center sm:block">
                ${food.price.toFixed(2)}
              </span>

              {/* Desktop: quantity controls */}
              <div className="hidden items-center justify-center gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() => removeItem(food._id!)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-muted"
                  aria-label="Remove one"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[1.25rem] text-center font-medium">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => addItem(food._id!)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-muted"
                  aria-label="Add one more"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Desktop: line total */}
              <span className="hidden text-right font-medium sm:block">
                ${lineTotal.toFixed(2)}
              </span>

              {/* Desktop: remove all button */}
              <button
                type="button"
                onClick={() => {
                  // Remove all units of this item
                  for (let i = 0; i < qty; i++) {
                    removeItem(food._id!);
                  }
                }}
                className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:flex"
                aria-label={`Remove ${food.name} from cart`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom: totals + checkout */}
      <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
        {/* Cart totals */}
        <div className="flex w-full flex-col gap-4 lg:max-w-md">
          <h2 className="text-xl font-semibold">Cart Totals</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout" className={buttonVariants({ className: "w-full" })}>
            Proceed to Checkout
          </Link>
        </div>

        {/* Promo code (UI placeholder) */}
        <div className="flex w-full flex-col gap-3 lg:max-w-sm">
          <p className="text-sm text-muted-foreground">
            If you have a promo code, enter it here
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Promo code"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            />
            <Button variant="secondary">Apply</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
