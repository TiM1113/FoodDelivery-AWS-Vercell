import { Loader2 } from "lucide-react";

export function RouteLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] items-center justify-center"
    >
      <Loader2
        aria-hidden="true"
        className="h-8 w-8 animate-spin text-muted-foreground"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
