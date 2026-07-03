import { getWalletData } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import KpiCards from "@/components/KpiCards";
import SankeyFlow from "@/components/SankeyFlow";
import DailyVolumeTimeline from "@/components/DailyVolumeTimeline";
import CircularTable from "@/components/CircularTable";
import CounterpartyTable from "@/components/CounterpartyTable";

export default function Home() {
  const { kpis, sources, destinations, circular_counterparties, daily_volumes } = getWalletData();

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          On-Chain Flow Analysis · TRON / USDT
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1">{kpis.wallet_label}</h1>
        <p className="text-sm text-[var(--muted)] mono">
          {formatDateTime(kpis.first_tx_time)} → {formatDateTime(kpis.last_tx_time)} · {kpis.active_days} active days
        </p>
      </header>

      <section>
        <KpiCards kpis={kpis} />
      </section>

      <section className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Fund Flow — Top 15 Sources → {kpis.wallet_label} → Top 15 Destinations</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Remaining counterparties grouped as &quot;Other&quot;. Link width is proportional to USDT volume.
          </p>
        </div>
        <SankeyFlow sources={sources} destinations={destinations} walletLabel={kpis.wallet_label} />
      </section>

      <section className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Daily Volume — Inflow / Outflow</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Mirrored timeline: inflow rendered above the axis, outflow below.
          </p>
        </div>
        <DailyVolumeTimeline data={daily_volumes} />
      </section>

      <section>
        <CircularTable rows={circular_counterparties} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CounterpartyTable title="Top Sources (Inflow)" rows={sources} direction="in" />
        <CounterpartyTable title="Top Destinations (Outflow)" rows={destinations} direction="out" />
      </section>

      <footer className="text-[11px] text-[var(--muted)] border-t border-[var(--border)] pt-4 pb-2">
        Derived from on-chain USDT transfer records. Wallet identity redacted — shown only as &quot;{kpis.wallet_label}
        &quot;. Counterparty values are TRON addresses, not personal identities.
      </footer>
    </main>
  );
}
