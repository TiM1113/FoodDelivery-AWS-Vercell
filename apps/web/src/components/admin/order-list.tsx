"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

const ORDER_STATUSES = [
  "Payment Pending",
  "Food Processing",
  "Out for delivery",
  "Delivered",
] as const;

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phone: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  address: OrderAddress;
  amount: number;
  status: string;
  payment: boolean;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders/list");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        toast.error(data.message || "Error loading orders");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order?.payment && newStatus !== "Payment Pending") {
      toast.error("Cannot process unpaid orders");
      return;
    }

    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order status updated");
        await fetchOrders();
      } else {
        toast.error(data.message || "Error updating status");
      }
    } catch {
      toast.error("Error connecting to server");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Orders</h2>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <Package className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {order.items
                        .map((item) => `${item.name} x ${item.quantity}`)
                        .join(", ")}
                    </p>
                    <p className="text-sm">
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.address.street}, {order.address.city},{" "}
                      {order.address.state}, {order.address.country},{" "}
                      {order.address.zipcode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.address.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-sm font-medium">
                    {order.items.length} items
                  </span>
                  <span className="text-sm font-semibold">${order.amount}</span>
                  <Badge variant={order.payment ? "default" : "destructive"}>
                    {order.payment ? "Paid" : "Unpaid"}
                  </Badge>
                  <Select
                    value={order.status}
                    onValueChange={(val) => { if (val) updateStatus(order._id, val); }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
