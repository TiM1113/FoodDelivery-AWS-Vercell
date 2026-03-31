"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";

interface AddToCartButtonProps {
  foodId: string;
}

export function AddToCartButton({ foodId }: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const quantity = useCartStore((s) => s.items[foodId] || 0);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleAdd = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    addItem(foodId);
  };

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 transition-transform hover:scale-110 hover:bg-orange-600 active:scale-95"
        aria-label="Add to cart"
      >
        <Plus className="h-4 w-4 text-white" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-1 py-0.5 dark:border-orange-800 dark:bg-orange-950">
      <button
        type="button"
        onClick={() => removeItem(foodId)}
        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-orange-100 active:scale-95 dark:hover:bg-orange-900"
        aria-label="Remove one"
      >
        <Minus className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      </button>

      <span className="min-w-[1.25rem] text-center text-sm font-semibold text-orange-700 dark:text-orange-300">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleAdd}
        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-orange-100 active:scale-95 dark:hover:bg-orange-900"
        aria-label="Add one more"
      >
        <Plus className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      </button>
    </div>
  );
}
