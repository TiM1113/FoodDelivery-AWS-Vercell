"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { StatCard } from "./dashboard/stat-card";
import { StatusChart } from "./dashboard/status-chart";
import { RevenueChart } from "./dashboard/revenue-chart";
import { TopItemsChart } from "./dashboard/top-items-chart";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalFoods: number;
  statusDistribution: { status: string; count: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; quantity: number }[];
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch stats");
  return data.data;
}

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load dashboard"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon={Users}
        />
        <StatCard
          title="Menu Items"
          value={stats.totalFoods.toString()}
          icon={UtensilsCrossed}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatusChart data={stats.statusDistribution} />
        <TopItemsChart data={stats.topItems} />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={stats.dailyRevenue} />
    </div>
  );
}
