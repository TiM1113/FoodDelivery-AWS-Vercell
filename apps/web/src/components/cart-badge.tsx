"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";

export function CartBadge() {
  const count = useCartStore((s) => s.getTotalCount());

  return (
    <Link href="/cart" aria-label="Cart" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
