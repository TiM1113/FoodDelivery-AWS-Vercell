"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import type { Order } from "@/types/order";
import { OrderCard } from "./order-card";

const POLL_INTERVAL = 10_000; // 10 seconds

const ACTIVE_STATUSES = new Set(["Food Processing", "Out for Delivery"]);

function hasActiveOrders(orders: Order[]): boolean {
  return orders.some((o) => o.payment && ACTIVE_STATUSES.has(o.status));
}

const STATUS_MESSAGES: Record<string, string> = {
  "Food Processing": "Your order is being prepared!",
  "Out for Delivery": "Your order is out for delivery!",
  "Delivered": "Your order has been delivered!",
  "Cancelled": "Your order has been cancelled.",
};

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/order/userorders", { method: "POST" });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return data.success ? data.data : [];
}

interface OrderListProps {
  initialOrders: Order[];
}

export function OrderList({ initialOrders }: OrderListProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "favourites">("recent");
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = window.localStorage.getItem("myorders:favourites");
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      window.localStorage.removeItem("myorders:favourites");
    }
    return new Set<string>();
  });

  const prevStatusMapRef = useRef<Map<string, string>>(new Map());

  const {
    data: orders = initialOrders,
    refetch,
  } = useQuery({
    queryKey: ["userOrders"],
    queryFn: fetchOrders,
    initialData: initialOrders,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.length === 0) return false;
      return hasActiveOrders(data) ? POLL_INTERVAL : false;
    },
  });

  // Detect status changes and show toast notifications
  useEffect(() => {
    const prevMap = prevStatusMapRef.current;

    for (const order of orders) {
      if (!order._id) continue;
      const prevStatus = prevMap.get(order._id);
      const currentStatus = order.payment ? order.status : "Payment Pending";

      if (prevStatus && prevStatus !== currentStatus) {
        const message = STATUS_MESSAGES[currentStatus];
        if (message) {
          const itemName = order.items[0]?.name ?? "Order";
          toast.success(message, {
            description: `${itemName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`,
          });
        }
      }

      prevMap.set(order._id, currentStatus);
    }
  }, [orders]);

  // Sync favourites to localStorage on change
  useEffect(() => {
    window.localStorage.setItem(
      "myorders:favourites",
      JSON.stringify([...favouriteIds]),
    );
  }, [favouriteIds]);

  const refreshOrders = useCallback(async () => {
    await refetch();
  }, [refetch]);

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

  const isPolling = hasActiveOrders(orders);

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

      {/* Polling indicator */}
      {isPolling && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Auto-refreshing active orders</span>
        </div>
      )}

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
