"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Trash2, X } from "lucide-react";
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
  const promoCode = useCartStore((s) => s.promoCode);
  const promoCoupon = useCartStore((s) => s.promoCoupon);
  const setPromo = useCartStore((s) => s.setPromo);
  const clearPromo = useCartStore((s) => s.clearPromo);
  const getDiscount = useCartStore((s) => s.getDiscount);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const guardedAdd = useCallback(
    async (id: string) => {
      if (pendingIds.has(id)) return;
      setPendingIds((prev) => new Set(prev).add(id));
      try {
        await addItem(id);
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [addItem, pendingIds],
  );

  const guardedRemove = useCallback(
    async (id: string) => {
      if (pendingIds.has(id)) return;
      setPendingIds((prev) => new Set(prev).add(id));
      try {
        await removeItem(id);
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [removeItem, pendingIds],
  );

  const {
    data: foods = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
  });

  if (isPending) {
    return (
      <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading your cart…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t load the menu data. Please try again later.
        </p>
        <Link href="/" className={buttonVariants()}>
          Back to Home
        </Link>
      </div>
    );
  }

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setPromoError("Unable to validate promo code. Please try again.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setPromo(code, data.promoId, data.coupon);
        setPromoInput("");
      } else {
        setPromoError(data.message || "Invalid promo code");
      }
    } catch {
      setPromoError("Network error. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  };

  const cartFoods = foods.filter((f) => f._id && items[f._id] > 0);
  const subtotal = getTotalAmount(foods);
  const discount = getDiscount(subtotal);
  const deliveryFee = cartFoods.length > 0 ? DELIVERY_FEE : 0;
  const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;

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
          const isPendingItem = pendingIds.has(food._id!);

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
                    disabled={isPendingItem}
                    onClick={() => guardedRemove(food._id!)}
                    aria-label="Remove one"
                    className="disabled:opacity-50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-4 text-center text-sm font-medium">
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={isPendingItem}
                    onClick={() => guardedAdd(food._id!)}
                    aria-label="Add one more"
                    className="disabled:opacity-50"
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
                  disabled={isPendingItem}
                  onClick={() => guardedRemove(food._id!)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-50"
                  aria-label="Remove one"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-5 text-center font-medium">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={isPendingItem}
                  onClick={() => guardedAdd(food._id!)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-muted disabled:opacity-50"
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
                disabled={isPendingItem}
                onClick={async () => {
                  if (isPendingItem) return;
                  setPendingIds((prev) => new Set(prev).add(food._id!));
                  try {
                    for (let i = 0; i < qty; i++) {
                      await removeItem(food._id!);
                    }
                  } finally {
                    setPendingIds((prev) => {
                      const next = new Set(prev);
                      next.delete(food._id!);
                      return next;
                    });
                  }
                }}
                className="hidden h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 sm:flex"
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
            {discount > 0 && (
              <>
                <hr />
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    Discount
                    {promoCoupon?.name && (
                      <span className="text-xs">({promoCoupon.name})</span>
                    )}
                  </span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              </>
            )}
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

        {/* Promo code */}
        <div className="flex w-full flex-col gap-3 lg:max-w-sm">
          <p className="text-sm text-muted-foreground">
            If you have a promo code, enter it here
          </p>

          {promoCode ? (
            <div className="flex items-center gap-2 rounded-md border bg-green-50 px-3 py-2 text-sm dark:bg-green-950">
              <span className="flex-1 font-medium text-green-700 dark:text-green-300">
                {promoCode}
                {promoCoupon?.percentOff
                  ? ` — ${promoCoupon.percentOff}% off`
                  : promoCoupon?.amountOff
                    ? ` — $${promoCoupon.amountOff} off`
                    : ""}
              </span>
              <button
                type="button"
                onClick={clearPromo}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove promo code"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                />
                <Button
                  variant="secondary"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                >
                  {promoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
              {promoError && (
                <p className="text-xs text-destructive">{promoError}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
