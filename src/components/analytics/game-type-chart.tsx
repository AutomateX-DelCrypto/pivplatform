"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GameTypeData {
  gameType: string;
  totalBets: number;
  totalWageredCents: number;
  netResultCents: number;
  winRate: number;
}

interface GameTypeChartProps {
  data: GameTypeData[];
}

const COLORS = ["#00F0FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function GameTypeChart({ data }: GameTypeChartProps) {
  // Format data for the chart
  const chartData = data.map((d) => ({
    name: d.gameType.charAt(0).toUpperCase() + d.gameType.slice(1),
    bets: d.totalBets,
    wagered: d.totalWageredCents / 100,
    profitLoss: d.netResultCents / 100,
    winRate: d.winRate,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-[#64748B] text-sm">
        No game data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
        <XAxis
          type="number"
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0A0E17",
            border: "1px solid rgba(0,240,255,0.2)",
            borderRadius: "8px",
            color: "#F8FAFC",
          }}
          formatter={(value, name) => {
            const numValue = typeof value === "number" ? value : 0;
            if (name === "bets") return [numValue, "Bets"];
            return [`$${numValue.toFixed(2)}`, name === "wagered" ? "Wagered" : "P/L"];
          }}
          labelStyle={{ color: "#94A3B8" }}
        />
        <Bar dataKey="bets" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
