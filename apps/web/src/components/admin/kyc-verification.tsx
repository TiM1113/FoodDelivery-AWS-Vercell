"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KycStatus {
  status: string;
  sessionId: string | null;
}

async function fetchKycStatus(): Promise<KycStatus> {
  const res = await fetch("/api/admin/kyc");
  if (!res.ok) throw new Error("Failed to fetch KYC status");
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch status");
  return data.data;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Shield;
    description: string;
  }
> = {
  unverified: {
    label: "Not Verified",
    variant: "destructive",
    icon: ShieldAlert,
    description:
      "Your identity has not been verified. Complete KYC verification to enable full platform features.",
  },
  pending: {
    label: "Verification Pending",
    variant: "secondary",
    icon: Clock,
    description:
      "Your verification is being processed. This usually takes a few minutes.",
  },
  verified: {
    label: "Verified",
    variant: "default",
    icon: CheckCircle,
    description:
      "Your identity has been verified. You have full access to all platform features.",
  },
  requires_input: {
    label: "Action Required",
    variant: "destructive",
    icon: AlertTriangle,
    description:
      "Additional information is needed. Please start a new verification session.",
  },
};

export function KycVerification() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const {
    data: kycStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["kycStatus"],
    queryFn: fetchKycStatus,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 10_000 : false;
    },
  });

  const handleStartVerification = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        toast.success("Verification session created");
        window.open(data.data.url, "_blank", "noopener,noreferrer");
        await queryClient.invalidateQueries({ queryKey: ["kycStatus"] });
      } else {
        toast.error(data.message || "Failed to create verification session");
      }
    } catch {
      toast.error("Failed to start verification");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load KYC status"}
        </p>
      </div>
    );
  }

  const status = kycStatus?.status || "unverified";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unverified;
  const StatusIcon = config.icon;
  const canStartVerification = status === "unverified" || status === "requires_input";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Identity Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your identity to comply with KYC regulations
        </p>
      </div>

      {/* Status Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Verification Status</h2>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>

            {canStartVerification && (
              <Button
                onClick={handleStartVerification}
                disabled={isCreating}
                className="mt-4 w-fit"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating session…
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Verification
                  </>
                )}
              </Button>
            )}

            {status === "pending" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking verification status…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 rounded-lg border bg-muted/30 p-6">
        <h3 className="mb-3 text-sm font-semibold">What is KYC Verification?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Identity verification using a government-issued ID document</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Selfie matching to confirm your identity</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Processed securely through Stripe Identity</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Required for regulatory compliance and platform trust</span>
          </li>
        </ul>
        <a
          href="https://stripe.com/identity"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline"
        >
          Learn more about Stripe Identity
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
