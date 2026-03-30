"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import type { Order } from "@/types/order";
import { useCartStore } from "@/lib/store/cart-store";
import { OrderTrackingDialog } from "./order-tracking-dialog";
import { EditOrderDialog } from "./edit-order-dialog";

interface OrderCardProps {
  order: Order;
  orderNumber: number;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onRefresh: () => Promise<void>;
}

function formatOrderDate(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(
  status: string,
  payment: boolean,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Cancelled") return "destructive";
  if (!payment) return "destructive";
  switch (status) {
    case "Delivered":
      return "default";
    case "Out for Delivery":
      return "secondary";
    case "Food Processing":
      return "secondary";
    default:
      return "outline";
  }
}

export function OrderCard({
  order,
  orderNumber,
  isFavourite,
  onToggleFavourite,
  onRefresh,
}: OrderCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const displayStatus = order.status === "Cancelled"
    ? "Cancelled"
    : order.payment
      ? order.status
      : "Payment Pending";

  const canCancel =
    order.status !== "Cancelled" &&
    (order.status === "Payment Pending" || order.status === "Food Processing");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/order/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order deleted successfully");
        await onRefresh();
      } else {
        toast.error(data.message || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Order cancelled");
        await onRefresh();
      } else {
        toast.error(data.message || "Failed to cancel order");
      }
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      for (const item of order.items) {
        if (item._id) {
          for (let i = 0; i < item.quantity; i++) {
            await addItem(item._id);
          }
        }
      }
      toast.success("Items added to cart");
      router.push("/cart");
    } catch {
      toast.error("Failed to add items to cart");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        {/* Main Content */}
        <div className="flex gap-4 p-4">
          {/* Box Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
            📦
          </div>

          {/* Order Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Row 1: Name + Star */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-medium">
                {order.items[0]?.name ?? "Order"}
                {order.items.length > 1 && (
                  <span className="text-muted-foreground">
                    {" "}
                    +{order.items.length - 1} more
                  </span>
                )}
              </h3>
              <button
                onClick={onToggleFavourite}
                className="shrink-0 text-muted-foreground transition-colors hover:text-yellow-500"
                title={
                  isFavourite
                    ? "Remove from favourites"
                    : "Add to favourites"
                }
              >
                <Star
                  className={`h-5 w-5 ${isFavourite ? "fill-yellow-500 text-yellow-500" : ""}`}
                />
              </button>
            </div>

            {/* Row 2: Date */}
            <p className="text-sm text-muted-foreground">
              {formatOrderDate(order.date)}
            </p>

            {/* Row 3: Order ID + Status + Reorder */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                #{order._id?.slice(-6)}
              </span>
              <Badge variant={getStatusVariant(order.status, order.payment)}>
                {displayStatus}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={handleReorder}
                disabled={isReordering}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reorder
              </Button>
            </div>

            {/* Row 4: Price */}
            <p className="text-lg font-semibold">${(order.amount ?? 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t px-4 py-3">
            <h4 className="mb-2 text-sm font-medium">Items:</h4>
            <div className="flex flex-col gap-1">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span>{item.name}</span>
                  <span>x {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            Order #{orderNumber}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowTracking(true)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Track
            </Button>

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setShowCancelConfirm(true)}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            )}

            {!order.payment && order.status !== "Cancelled" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tracking Dialog */}
      <OrderTrackingDialog
        order={order}
        open={showTracking}
        onOpenChange={setShowTracking}
      />

      {/* Edit Dialog */}
      {!order.payment && (
        <EditOrderDialog
          order={order}
          orderNumber={orderNumber}
          open={showEdit}
          onOpenChange={setShowEdit}
          onRefresh={onRefresh}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order #{orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              {order.payment
                ? "This order has been paid. A refund will be issued to your original payment method."
                : "This will cancel your order. You can place a new order afterwards."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
