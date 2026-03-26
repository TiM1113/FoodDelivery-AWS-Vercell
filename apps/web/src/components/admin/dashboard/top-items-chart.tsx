"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopItemsChartProps {
  data: { name: string; quantity: number }[];
}

export function TopItemsChart({ data }: TopItemsChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium">Top Selling Items</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sales data yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium">Top Selling Items</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip
            formatter={(value) => [Number(value), "Sold"]}
          />
          <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
