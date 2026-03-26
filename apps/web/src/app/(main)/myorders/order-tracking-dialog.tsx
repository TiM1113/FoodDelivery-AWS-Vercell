"use client";

import { useState } from "react";
import { AlertTriangle, Ban, Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order";

interface OrderTrackingDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRACKING_STEPS = [
  { label: "Food Processing", key: "Food Processing", description: "Your order is being prepared by the restaurant" },
  { label: "Out for Delivery", key: "Out for Delivery", description: "A driver is on their way to you" },
  { label: "Delivered", key: "Delivered", description: "Your order has arrived" },
] as const;

function getStepStatus(
  stepKey: string,
  currentStatus: string,
): "completed" | "current" | "upcoming" {
  const steps: string[] = TRACKING_STEPS.map((s) => s.key);
  const currentIdx = steps.indexOf(currentStatus);
  const stepIdx = steps.indexOf(stepKey);

  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function OrderTrackingDialog({
  order,
  open,
  onOpenChange,
}: OrderTrackingDialogProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch("/api/order/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json();

      if (data.success && data.session_url) {
        onOpenChange(false);
        window.location.href = data.session_url;
      } else {
        toast.error(data.message || "Failed to start payment");
      }
    } catch {
      toast.error("Failed to start payment");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Tracking</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Order Info */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">{order._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">${order.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <Badge variant={order.payment ? "default" : "destructive"}>
                {order.payment ? "Paid" : "Pending"}
              </Badge>
            </div>
          </div>

          {/* Progress Tracker / Cancelled / Payment Warning */}
          {order.status === "Cancelled" ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <Ban className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <h4 className="font-medium text-destructive">
                    Order Cancelled
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {order.payment
                      ? "This order has been cancelled and a refund has been initiated."
                      : "This order has been cancelled."}
                  </p>
                </div>
              </div>
            </div>
          ) : order.payment ? (
            <div className="flex flex-col gap-0">
              {TRACKING_STEPS.map((step, idx) => {
                const status = getStepStatus(step.key, order.status);
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                          status === "completed"
                            ? "border-primary bg-primary text-primary-foreground"
                            : status === "current"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 text-muted-foreground/50"
                        }`}
                      >
                        {status === "completed" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div
                          className={`h-8 w-0.5 ${
                            status === "completed"
                              ? "bg-primary"
                              : "bg-muted-foreground/20"
                          }`}
                        />
                      )}
                    </div>
                    {/* Step label */}
                    <div className="pt-1">
                      <p
                        className={`text-sm font-medium ${
                          status === "upcoming"
                            ? "text-muted-foreground/50"
                            : ""
                        }`}
                      >
                        {step.label}
                      </p>
                      <p
                        className={`text-xs ${
                          status === "upcoming"
                            ? "text-muted-foreground/30"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-destructive">
                    Payment Required
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This order cannot be processed until payment is completed.
                  </p>
                  <Button
                    onClick={handleRetryPayment}
                    disabled={isRetrying}
                    size="sm"
                    className="w-fit"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div>
            <h4 className="mb-2 text-sm font-medium">Items</h4>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
