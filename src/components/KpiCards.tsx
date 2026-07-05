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
        label="Всього надійшло"
        value={`${formatUsdt(kpis.total_in)} USDT`}
        sub={`транзакцій: ${formatCount(kpis.incoming_tx_count)}`}
        accent="inflow"
      />
      <Card
        label="Всього відправлено"
        value={`${formatUsdt(kpis.total_out)} USDT`}
        sub={`транзакцій: ${formatCount(kpis.outgoing_tx_count)}`}
        accent="outflow"
      />
      <Card
        label="Залишок"
        value={`${formatUsdt(kpis.residual)} USDT`}
        sub="надходження − відправлення"
        accent="warn"
      />
      <Card
        label="Активні дні"
        value={`${kpis.active_days}`}
        sub={`${formatDate(kpis.first_tx_time)} — ${formatDate(kpis.last_tx_time)}`}
      />
      <Card
        label="Унікальні джерела"
        value={formatCount(kpis.unique_sources)}
        sub={`бірж: ${kpis.exchange_source_count} · високоризикових: ${kpis.high_risk_source_count} · звичайних гаманців: ${formatCount(
          kpis.unique_sources - kpis.exchange_source_count
        )}`}
      />
      <Card
        label="Унікальні отримувачі"
        value={formatCount(kpis.unique_destinations)}
        sub={`бірж: ${kpis.exchange_destination_count} · високоризикових: ${kpis.high_risk_destination_count} · звичайних гаманців: ${formatCount(
          kpis.unique_destinations - kpis.exchange_destination_count
        )}`}
      />
      <Card
        label="Циркулярні контрагенти"
        value={formatCount(kpis.circular_counterparty_count)}
        sub="адреси з обох сторін потоку"
        accent="warn"
      />
      <Card
        label="Досліджуваний гаманець"
        value={kpis.wallet_address}
        sub={kpis.wallet_tag ? kpis.wallet_tag : "звичайний гаманець · відкрити в Tronscan"}
        href={tronscanUrl(kpis.wallet_address)}
      />
    </div>
  );
}
