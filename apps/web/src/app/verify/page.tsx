"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30; // 60 seconds total

type VerifyStatus = "polling" | "success" | "cancelled" | "timeout" | "error";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const success = searchParams.get("success");

  const [status, setStatus] = useState<VerifyStatus>(() => {
    if (success === "false") return "cancelled";
    if (!orderId) return "error";
    return "polling";
  });
  const attemptRef = useRef(0);

  // Handle cancellation — notify backend to delete unpaid order
  const handleCancel = useCallback(async () => {
    if (!orderId) return;
    try {
      await fetch(
        `/api/order/verify?success=false&orderId=${orderId}`,
      );
    } catch {
      // Best effort — order stays unpaid, no harm
    }
  }, [orderId]);

  useEffect(() => {
    // User cancelled on Stripe page
    if (success === "false") {
      handleCancel();
      return;
    }

    if (!orderId) return;

    const poll = setInterval(async () => {
      attemptRef.current += 1;

      try {
        const res = await fetch(`/api/order/status/${orderId}`);
        const data = await res.json();

        if (data.payment === true) {
          clearInterval(poll);
          setStatus("success");
          setTimeout(() => router.push("/myorders"), 2000);
        } else if (attemptRef.current >= POLL_MAX_ATTEMPTS) {
          clearInterval(poll);
          setStatus("timeout");
        }
      } catch {
        if (attemptRef.current >= POLL_MAX_ATTEMPTS) {
          clearInterval(poll);
          setStatus("error");
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [orderId, success, router, handleCancel]);

  return (
    <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-6 py-24 text-center">
      {status === "polling" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold">Confirming your payment…</h1>
          <p className="text-muted-foreground">
            This usually takes 5–10 seconds. Please don&apos;t close this page.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          <h1 className="text-2xl font-semibold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Redirecting to your orders…
          </p>
        </>
      )}

      {status === "cancelled" && (
        <>
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your order has been cancelled. No payment was made.
          </p>
          <Link href="/cart" className={buttonVariants()}>
            Back to Cart
          </Link>
        </>
      )}

      {status === "timeout" && (
        <>
          <Loader2 className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">
            Payment confirmation is taking longer than expected
          </h1>
          <p className="text-muted-foreground">
            Your payment may still be processing. Check your orders page for the
            latest status.
          </p>
          <Link href="/myorders" className={buttonVariants()}>
            View My Orders
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t verify your payment. Please check your orders page
            or contact support.
          </p>
          <Link href="/myorders" className={buttonVariants()}>
            View My Orders
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-[80%] flex-col items-center justify-center gap-4 py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
