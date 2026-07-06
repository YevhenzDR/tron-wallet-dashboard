import { getWalletData } from "@/lib/data";
import { getDestinationTraces } from "@/lib/traces";
import { getTransactionLedger } from "@/lib/ledger";
import { getWalletRisk } from "@/lib/risk";
import { getCounterpartyFlowSummary } from "@/lib/flow";
import { formatDateTime, tronscanUrl } from "@/lib/format";
import KpiCards from "@/components/KpiCards";
import SankeyFlow from "@/components/SankeyFlow";
import DailyVolumeTimeline from "@/components/DailyVolumeTimeline";
import HourlyActivityChart from "@/components/HourlyActivityChart";
import CircularTable from "@/components/CircularTable";
import CounterpartyTable from "@/components/CounterpartyTable";
import TypologyNotes from "@/components/TypologyNotes";
import DestinationTraceTable from "@/components/DestinationTraceTable";
import TransactionLedgerTable from "@/components/TransactionLedger";
import RiskExposure from "@/components/RiskExposure";
import CounterpartyFlow from "@/components/CounterpartyFlow";
import PrintButton from "@/components/PrintButton";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function Home() {
  const { kpis, sources, destinations, circular_counterparties, daily_volumes, hourly_activity } =
    getWalletData();
  const destinationTraces = getDestinationTraces();
  const ledger = getTransactionLedger();
  const walletRisk = getWalletRisk();
  const flowSummary = getCounterpartyFlowSummary();

  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1 border-b border-[var(--border)] pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Аналіз он-чейн потоків · TRON / USDT
          </div>
          <PrintButton />
        </div>
        <h1 className="text-lg sm:text-2xl font-semibold mt-1 mono break-all">
          <a
            href={tronscanUrl(kpis.wallet_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-[var(--accent)]"
          >
            {kpis.wallet_address}
          </a>
        </h1>
        <p className="text-sm text-[var(--muted)] mono">
          {formatDateTime(kpis.first_tx_time)} → {formatDateTime(kpis.last_tx_time)} · активних днів:{" "}
          {kpis.active_days}
        </p>
      </header>

      <section>
        <KpiCards kpis={kpis} />
      </section>

      <section>
        <TypologyNotes
          kpis={kpis}
          sources={sources}
          destinations={destinations}
          circularCounterparties={circular_counterparties}
        />
      </section>

      <section className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">
              Потоки коштів — топ-15 джерел → гаманець → топ-15 отримувачів
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Решту контрагентів згруповано як «Інші». Товщина зв&apos;язку пропорційна обсягу USDT. Натисніть
              на адресу, щоб відкрити її в Tronscan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LegendDot color="#3dd6c1" label="гаманець-джерело" />
            <LegendDot color="#e8785a" label="гаманець-отримувач" />
            <LegendDot color="#8b7cf6" label="біржа" />
            <LegendDot color="#e8b84a" label="досліджуваний гаманець" />
            <LegendDot color="#4a5568" label="інші (згруповано)" />
          </div>
        </div>
        <SankeyFlow
          sources={sources}
          destinations={destinations}
          walletAddress={kpis.wallet_address}
          walletTag={kpis.wallet_tag}
        />
      </section>

      <section className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Денний обсяг — надходження / відправлення</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Дзеркальна шкала: надходження відкладено вгору від осі, відправлення — вниз.
          </p>
        </div>
        <DailyVolumeTimeline data={daily_volumes} />
      </section>

      <section className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-medium" style={{ color: "var(--warn)" }}>
            Активність за годинами доби (UTC) — ознака ручного керування
          </h2>
          <p className="text-base text-[var(--foreground)] mt-1 leading-relaxed">
            Розподіл кількості транзакцій за годиною доби. Затінена ділянка — нічна пауза, коли гаманець
            повністю неактивний.
          </p>
        </div>
        <HourlyActivityChart data={hourly_activity} />
      </section>

      <section>
        <CircularTable rows={circular_counterparties} />
      </section>

      <section>
        <DestinationTraceTable data={destinationTraces} />
      </section>

      <section>
        <CounterpartyFlow data={flowSummary} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CounterpartyTable title="Топ джерел (надходження)" rows={sources} direction="in" />
        <CounterpartyTable title="Топ отримувачів (відправлення)" rows={destinations} direction="out" />
      </section>

      <section>
        <RiskExposure risk={walletRisk} />
      </section>

      <section>
        <TransactionLedgerTable data={ledger} />
      </section>

      <footer className="text-[11px] text-[var(--muted)] border-t border-[var(--border)] pt-4 pb-2">
        Складено на основі он-чейн записів переказів USDT. Мітки бірж походять з публічних тегів адрес
        Tronscan; адреси без тегів вважаються звичайними гаманцями. Усі адреси ведуть на блокчейн-оглядач
        Tronscan.
      </footer>
    </main>
  );
}
