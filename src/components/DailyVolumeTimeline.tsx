"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { DailyVolume } from "@/lib/types";
import { formatCompact, formatDate, formatUsdt } from "@/lib/format";

interface TooltipPayloadItem {
  payload: DailyVolume & { outNeg: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="report-card rounded-md px-3 py-2 text-xs mono shadow-lg">
      <div className="text-[var(--muted)] mb-1">{formatDate(d.date)}</div>
      <div style={{ color: "var(--inflow)" }}>+{formatUsdt(d.in)} USDT in ({d.in_count} tx)</div>
      <div style={{ color: "var(--outflow)" }}>−{formatUsdt(d.out)} USDT out ({d.out_count} tx)</div>
    </div>
  );
}

export default function DailyVolumeTimeline({ data }: { data: DailyVolume[] }) {
  const chartData = data.map((d) => ({ ...d, outNeg: -d.out }));

  return (
    <div className="w-full" style={{ height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          stackOffset="sign"
          margin={{ top: 10, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => formatDate(v)}
            stroke="var(--muted)"
            fontSize={10.5}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompact(Math.abs(v))}
            stroke="var(--muted)"
            fontSize={10.5}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="in" stackId="volume" fill="var(--inflow)" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
          <Bar dataKey="outNeg" stackId="volume" fill="var(--outflow)" fillOpacity={0.85} radius={[0, 0, 2, 2]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
