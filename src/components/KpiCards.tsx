import type { Kpis } from "@/lib/types";
import { formatCount, formatDate, formatUsdt, tronscanUrl } from "@/lib/format";

function Card({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "inflow" | "outflow" | "warn" | "neutral";
  href?: string;
}) {
  const accentColor =
    accent === "inflow"
      ? "var(--inflow)"
      : accent === "outflow"
      ? "var(--outflow)"
      : accent === "warn"
      ? "var(--warn)"
      : "var(--foreground)";

  const valueEl = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mono text-sm sm:text-base font-medium break-all hover:underline"
      style={{ color: accentColor }}
    >
      {value}
    </a>
  ) : (
    <span className="mono text-xl sm:text-2xl font-medium" style={{ color: accentColor }}>
      {value}
    </span>
  );

  return (
    <div className="report-card rounded-md p-4 flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</span>
      {valueEl}
      {sub && <span className="text-xs text-[var(--muted)]">{sub}</span>}
    </div>
  );
}

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        label="Total received"
        value={`${formatUsdt(kpis.total_in)} USDT`}
        sub={`transactions: ${formatCount(kpis.incoming_tx_count)}`}
        accent="inflow"
      />
      <Card
        label="Total sent"
        value={`${formatUsdt(kpis.total_out)} USDT`}
        sub={`transactions: ${formatCount(kpis.outgoing_tx_count)}`}
        accent="outflow"
      />
      <Card
        label="Balance"
        value={`${formatUsdt(kpis.residual)} USDT`}
        sub="received − sent"
        accent="warn"
      />
      <Card
        label="Active days"
        value={`${kpis.active_days}`}
        sub={`${formatDate(kpis.first_tx_time)} — ${formatDate(kpis.last_tx_time)}`}
      />
      <Card
        label="Unique sources"
        value={formatCount(kpis.unique_sources)}
        sub={`exchanges: ${kpis.exchange_source_count} · high-risk: ${kpis.high_risk_source_count} · regular wallets: ${formatCount(
          kpis.unique_sources - kpis.exchange_source_count
        )}`}
      />
      <Card
        label="Unique recipients"
        value={formatCount(kpis.unique_destinations)}
        sub={`exchanges: ${kpis.exchange_destination_count} · high-risk: ${kpis.high_risk_destination_count} · regular wallets: ${formatCount(
          kpis.unique_destinations - kpis.exchange_destination_count
        )}`}
      />
      <Card
        label="Circular counterparties"
        value={formatCount(kpis.circular_counterparty_count)}
        sub="addresses on both sides of the flow"
        accent="warn"
      />
      <Card
        label="Investigated wallet"
        value={kpis.wallet_address}
        sub={kpis.wallet_tag ? kpis.wallet_tag : "regular wallet · open in Tronscan"}
        href={tronscanUrl(kpis.wallet_address)}
      />
    </div>
  );
}
