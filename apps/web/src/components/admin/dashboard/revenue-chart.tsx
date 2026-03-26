"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium">Revenue (Last 30 Days)</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No revenue data yet
        </p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium">Revenue (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 12 }} />
          <YAxis
            className="text-xs"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
