"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "Payment Pending": "#f97316",
  "Food Processing": "#3b82f6",
  "Out for Delivery": "#a855f7",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

interface StatusChartProps {
  data: { status: string; count: number }[];
}

export function StatusChart({ data }: StatusChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium">Order Status Distribution</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No orders yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-medium">Order Status Distribution</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={isMobile ? 70 : 80}
            label={isMobile ? false : ({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
