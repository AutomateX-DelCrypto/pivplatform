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

interface DailyData {
  date: string;
  netResultCents: number;
  wageredCents: number;
  wonCents: number;
}

interface ProfitLossChartProps {
  data: DailyData[];
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
  // Format data for the chart
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    profitLoss: d.netResultCents / 100,
    wagered: d.wageredCents / 100,
    won: d.wonCents / 100,
  }));

  // Calculate cumulative profit/loss
  let cumulative = 0;
  const cumulativeData = chartData.map((d) => {
    cumulative += d.profitLoss;
    return {
      ...d,
      cumulative,
    };
  });

  if (cumulativeData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-[#64748B] text-sm">
        No data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={cumulativeData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
        <XAxis
          dataKey="date"
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0A0E17",
            border: "1px solid rgba(0,240,255,0.2)",
            borderRadius: "8px",
            color: "#F8FAFC",
          }}
          formatter={(value) => {
            const numValue = typeof value === "number" ? value : 0;
            return [`$${numValue.toFixed(2)}`, "Cumulative P/L"];
          }}
          labelStyle={{ color: "#94A3B8" }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#00F0FF"
          strokeWidth={2}
          fill="url(#colorProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
