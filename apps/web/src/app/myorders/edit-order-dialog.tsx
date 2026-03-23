"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Order, OrderItem } from "@/types/order";
import type { Food, FoodListResponse } from "@/types/food";

const DELIVERY_FEE = 2;
const IMAGE_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface EditOrderDialogProps {
  order: Order;
  orderNumber: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function EditOrderDialog({
  order,
  orderNumber,
  open,
  onOpenChange,
  onRefresh,
}: EditOrderDialogProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset items when dialog opens
  useEffect(() => {
    if (open) {
      setItems(order.items.map((item) => ({ ...item })));
      setSelectedCategory("All");
    }
  }, [open, order.items]);

  // Fetch food list for "Add More Items"
  useEffect(() => {
    if (open && foods.length === 0) {
      setIsLoadingFoods(true);
      fetch("/api/food/list")
        .then((res) => res.json())
        .then((data: FoodListResponse) => {
          if (data.success) setFoods(data.data);
        })
        .catch(() => {
          /* keep empty */
        })
        .finally(() => setIsLoadingFoods(false));
    }
  }, [open, foods.length]);

  const categories = [
    "All",
    ...new Set(foods.map((f) => f.category).filter(Boolean)),
  ];

  const filteredFoods =
    selectedCategory === "All"
      ? foods
      : foods.filter((f) => f.category === selectedCategory);

  const updateQuantity = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: newQty };
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addFood = (food: Food) => {
    setItems((prev) => {
      const existing = prev.findIndex((item) =>
        item._id && food._id ? item._id === food._id : item.name === food.name,
      );
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = {
          ...next[existing],
          quantity: next[existing].quantity + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          _id: food._id || "",
          name: food.name,
          price: food.price,
          quantity: 1,
          image: food.image,
        },
      ];
    });
  };

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = itemsTotal + DELIVERY_FEE;

  const handleSave = async () => {
    if (items.length === 0) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/order/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          items,
          amount: total,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order updated successfully");
        onOpenChange(false);
        await onRefresh();
      } else {
        toast.error(data.message || "Failed to update order");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/order/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order deleted successfully");
        setShowDeleteConfirm(false);
        onOpenChange(false);
        await onRefresh();
      } else {
        toast.error(data.message || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{orderNumber}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {/* Current Items */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Current Items</h4>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items in order
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-md border p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(index)}
                          aria-label={`Remove ${item.name} from order`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add More Items */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Add More Items</h4>

              {/* Category Filter */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Food Grid */}
              {isLoadingFoods ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {filteredFoods.map((food) => (
                    <button
                      key={food._id}
                      className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors hover:bg-muted"
                      onClick={() => addFood(food)}
                    >
                      {food.image && (
                        <Image
                          src={`${IMAGE_BASE}/images/${food.image}`}
                          alt={food.name}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                        />
                      )}
                      <p className="line-clamp-1 text-xs font-medium">
                        {food.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${food.price.toFixed(2)}
                      </p>
                    </button>
                  ))}
                  {filteredFoods.length === 0 && !isLoadingFoods && (
                    <p className="col-span-full text-center text-sm text-muted-foreground">
                      No items in this category
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-lg bg-muted p-3">
              <h4 className="mb-2 text-sm font-medium">Order Summary</h4>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Total</span>
                  <span>${itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>${DELIVERY_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete when all items removed */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              All items have been removed. Do you want to delete this entire
              order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? "Deleting…" : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
