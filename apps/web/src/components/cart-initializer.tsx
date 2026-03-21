"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart-store";

/**
 * Loads cart data from the backend when the user logs in,
 * and clears it when they log out.  Renders nothing visible.
 */
export function CartInitializer() {
  const { data: session, status } = useSession();
  const setItems = useCartStore((s) => s.setItems);
  const clearCart = useCartStore((s) => s.clearCart);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (status === "authenticated" && prevStatus.current !== "authenticated") {
      // User just logged in — fetch cart from backend
      fetch("/api/cart/get", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.cartData) {
            setItems(data.cartData);
          }
        })
        .catch(() => {
          // Silently fail — cart will just be empty
        });
    }

    if (status === "unauthenticated" && prevStatus.current === "authenticated") {
      // User just logged out — clear local cart
      clearCart();
    }

    prevStatus.current = status;
  }, [status, session, setItems, clearCart]);

  return null;
}
