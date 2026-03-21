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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform hover:scale-110 active:scale-95"
        aria-label="Add to cart"
      >
        <Plus className="h-5 w-5 text-green-600" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/90 px-1.5 py-1 shadow-md backdrop-blur">
      <button
        type="button"
        onClick={() => removeItem(foodId)}
        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-red-50 active:scale-95"
        aria-label="Remove one"
      >
        <Minus className="h-4 w-4 text-red-500" />
      </button>

      <span className="min-w-[1.25rem] text-center text-sm font-semibold text-gray-800">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleAdd}
        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-green-50 active:scale-95"
        aria-label="Add one more"
      >
        <Plus className="h-4 w-4 text-green-600" />
      </button>
    </div>
  );
}
