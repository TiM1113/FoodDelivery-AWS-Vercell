import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
