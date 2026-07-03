import type { Kpis } from "@/lib/types";
import { formatDate, formatUsdt } from "@/lib/format";

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "inflow" | "outflow" | "warn" | "neutral";
}) {
  const accentColor =
    accent === "inflow"
      ? "var(--inflow)"
      : accent === "outflow"
      ? "var(--outflow)"
      : accent === "warn"
      ? "var(--warn)"
      : "var(--foreground)";

  return (
    <div className="report-card rounded-md p-4 flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className="mono text-xl sm:text-2xl font-medium" style={{ color: accentColor }}>
        {value}
      </span>
      {sub && <span className="text-xs text-[var(--muted)]">{sub}</span>}
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        label="Total Inflow"
        value={`${formatUsdt(kpis.total_in)} USDT`}
        sub={`${kpis.incoming_tx_count.toLocaleString()} transactions`}
        accent="inflow"
      />
      <Card
        label="Total Outflow"
        value={`${formatUsdt(kpis.total_out)} USDT`}
        sub={`${kpis.outgoing_tx_count.toLocaleString()} transactions`}
        accent="outflow"
      />
      <Card
        label="Residual Balance"
        value={`${formatUsdt(kpis.residual)} USDT`}
        sub="Inflow − Outflow"
        accent="warn"
      />
      <Card
        label="Active Days"
        value={`${kpis.active_days}`}
        sub={`${formatDate(kpis.first_tx_time)} — ${formatDate(kpis.last_tx_time)}`}
      />
      <Card
        label="Unique Sources"
        value={kpis.unique_sources.toLocaleString()}
        sub="distinct depositing addresses"
      />
      <Card
        label="Unique Destinations"
        value={kpis.unique_destinations.toLocaleString()}
        sub="distinct receiving addresses"
      />
      <Card
        label="Circular Counterparties"
        value={kpis.circular_counterparty_count.toLocaleString()}
        sub="addresses on both sides"
        accent="warn"
      />
      <Card label="Wallet" value={kpis.wallet_label} sub="identity redacted" />
    </div>
  );
}
