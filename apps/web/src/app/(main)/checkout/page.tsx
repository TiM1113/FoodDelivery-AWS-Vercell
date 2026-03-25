"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutFormData } from "@/lib/schemas/checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Food, FoodListResponse } from "@/types/food";

const DELIVERY_FEE = 2;

async function fetchFoods(): Promise<Food[]> {
  const res = await fetch("/api/food/list");
  if (!res.ok) throw new Error("Failed to fetch food list");
  const json: FoodListResponse = await res.json();
  return json.data;
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4.3 internal version mismatch with @hookform/resolvers types; runtime works correctly
    resolver: zodResolver(checkoutSchema as any),
  });

  const {
    data: foods = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
  });

  const cartFoods = foods.filter((f) => f._id && items[f._id] > 0);
  const subtotal = getTotalAmount(foods);
  const deliveryFee = cartFoods.length > 0 ? DELIVERY_FEE : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const onSubmit = async (address: CheckoutFormData) => {
    if (cartFoods.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const orderItems = cartFoods.map((food) => ({
      _id: food._id,
      name: food.name,
      price: food.price,
      quantity: items[food._id!],
    }));

    try {
      const res = await fetch("/api/order/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          amount: total,
          address,
        }),
      });

      const data = await res.json();

      if (data.success && data.session_url) {
        clearCart();
        setRedirectUrl(data.session_url);
      } else {
        setSubmitError(data.message || "Failed to create payment session");
        setIsSubmitting(false);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading checkout…</p>
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

  if (cartFoods.length === 0) {
    return (
      <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Add some items before checking out.
        </p>
        <Link href="/" className={buttonVariants()}>
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-[80%] flex-col gap-8 py-8 lg:flex-row lg:gap-12"
    >
      {/* Left: Delivery Information */}
      <div className="flex flex-1 flex-col gap-6">
        <h1 className="text-2xl font-semibold">Delivery Information</h1>

        {/* Name row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Street */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            placeholder="123 Main Street"
            aria-invalid={!!errors.street}
            {...register("street")}
          />
          {errors.street && (
            <p className="text-xs text-destructive">{errors.street.message}</p>
          )}
        </div>

        {/* City + State */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Melbourne"
              aria-invalid={!!errors.city}
              {...register("city")}
            />
            {errors.city && (
              <p className="text-xs text-destructive">{errors.city.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="VIC"
              aria-invalid={!!errors.state}
              {...register("state")}
            />
            {errors.state && (
              <p className="text-xs text-destructive">{errors.state.message}</p>
            )}
          </div>
        </div>

        {/* Zipcode + Country */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="zipcode">Zip Code</Label>
            <Input
              id="zipcode"
              placeholder="3000"
              aria-invalid={!!errors.zipcode}
              {...register("zipcode")}
            />
            {errors.zipcode && (
              <p className="text-xs text-destructive">
                {errors.zipcode.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="Australia"
              aria-invalid={!!errors.country}
              {...register("country")}
            />
            {errors.country && (
              <p className="text-xs text-destructive">
                {errors.country.message}
              </p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+61 412 345 678"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Right: Order Summary */}
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

        {submitError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            `Proceed to Payment — $${total.toFixed(2)}`
          )}
        </Button>

        <Link
          href="/cart"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to Cart
        </Link>
      </div>
    </form>
  );
}
