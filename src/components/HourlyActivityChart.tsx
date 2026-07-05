"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import type { HourlyActivity } from "@/lib/types";
import { formatCount } from "@/lib/format";

// The investigated wallet's activity window (Nov 2025 – Jan 2026) falls in
// winter, so Ukraine is UTC+2 throughout.
const KYIV_OFFSET = 2;

function kyivHour(utcHour: number): number {
  return (utcHour + KYIV_OFFSET) % 24;
}

function fmtHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

interface Row extends HourlyActivity {
  total: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="report-card rounded-md px-3 py-2 text-xs mono shadow-lg">
      <div className="text-[var(--muted)] mb-1">
        {fmtHour(d.hour)} UTC · {fmtHour(kyivHour(d.hour))} Київ
      </div>
      <div style={{ color: "var(--inflow)" }}>надійшло: {formatCount(d.in_count)} тр.</div>
      <div style={{ color: "var(--outflow)" }}>відправлено: {formatCount(d.out_count)} тр.</div>
      <div className="text-[var(--foreground)] mt-0.5">разом: {formatCount(d.total)} тр.</div>
    </div>
  );
}

export default function HourlyActivityChart({ data }: { data: HourlyActivity[] }) {
  const rows: Row[] = data.map((d) => ({ ...d, total: d.in_count + d.out_count }));

  // Find the contiguous silent window (hours with zero activity).
  const silentHours = rows.filter((r) => r.total === 0).map((r) => r.hour);
  const activeHours = rows.filter((r) => r.total > 0).map((r) => r.hour);
  const firstActive = activeHours.length ? Math.min(...activeHours) : 0;
  const lastActive = activeHours.length ? Math.max(...activeHours) : 23;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            {/* Shade the silent overnight windows so the "sleep" gaps stand out.
                Silent hours sit at both ends of the axis (early morning and late
                evening), so shade from the axis edges up to the active window. */}
            {firstActive > 0 && (
              <ReferenceArea x1={-0.5} x2={firstActive - 0.5} fill="var(--outflow)" fillOpacity={0.07} />
            )}
            {lastActive < 23 && (
              <ReferenceArea x1={lastActive + 0.5} x2={23.5} fill="var(--outflow)" fillOpacity={0.07} />
            )}
            <XAxis
              dataKey="hour"
              tickFormatter={(h: number) => fmtHour(h)}
              stroke="var(--muted)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={1}
            />
            <YAxis
              stroke="var(--muted)"
              fontSize={10.5}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="in_count" stackId="h" fill="var(--inflow)" fillOpacity={0.85} />
            <Bar dataKey="out_count" stackId="h" fill="var(--outflow)" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-[var(--foreground)] opacity-80 leading-relaxed">
        Уся активність гаманця зосереджена в межах{" "}
        <span className="font-medium">
          {fmtHour(firstActive)}–{fmtHour(lastActive + 1)} UTC
        </span>{" "}
        (≈ {fmtHour(kyivHour(firstActive))}–{fmtHour(kyivHour(lastActive + 1))} за київським часом), із{" "}
        <span className="font-medium">{silentHours.length} год повної тиші щоночі</span>. Це добовий
        (день/ніч) ритм роботи <span className="font-medium">людини-оператора в одному часовому поясі</span>,
        а не гарячого гаманця біржі — біржова інфраструктура працює цілодобово без нічних пауз.
      </p>
    </div>
  );
}
