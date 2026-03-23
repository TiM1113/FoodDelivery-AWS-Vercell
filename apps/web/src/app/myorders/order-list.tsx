"use client";

import { useCallback, useState } from "react";
import { Package } from "lucide-react";

import type { Order } from "@/types/order";
import { OrderCard } from "./order-card";

interface OrderListProps {
  initialOrders: Order[];
}

export function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"recent" | "favourites">("recent");
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/order/userorders", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch {
      // Keep current data on error
    }
  }, []);

  const toggleFavourite = useCallback((orderId: string) => {
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const displayOrders =
    activeTab === "favourites"
      ? orders.filter((o) => o._id && favouriteIds.has(o._id))
      : orders;

  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "recent"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("recent")}
        >
          Recent Orders
        </button>
        <button
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "favourites"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("favourites")}
        >
          Favourites
        </button>
      </div>

      {/* Order List */}
      {displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            {activeTab === "favourites"
              ? "No favourite orders yet. Star an order to add it here!"
              : "No orders found."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayOrders.map((order, index) => (
            <OrderCard
              key={order._id}
              order={order}
              orderNumber={
                activeTab === "recent"
                  ? orders.length - orders.indexOf(order)
                  : index + 1
              }
              isFavourite={!!order._id && favouriteIds.has(order._id)}
              onToggleFavourite={() =>
                order._id && toggleFavourite(order._id)
              }
              onRefresh={refreshOrders}
            />
          ))}
        </div>
      )}
    </>
  );
}
