import type { CircularCounterparty, Counterparty, Kpis } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";

function pct(part: number, whole: number): string {
  if (!whole) return "0";
  return (part / whole * 100).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export default function TypologyNotes({
  kpis,
  sources,
  destinations,
  circularCounterparties,
}: {
  kpis: Kpis;
  sources: Counterparty[];
  destinations: Counterparty[];
  circularCounterparties: CircularCounterparty[];
}) {
  const exchangeSources = sources.filter((s) => s.is_exchange);
  const exchangeInflowTotal = exchangeSources.reduce((sum, s) => sum + s.total, 0);
  const exchangeInflowPct = pct(exchangeInflowTotal, kpis.total_in);

  const exchangeDestinations = destinations.filter((d) => d.is_exchange);
  const exchangeOutflowTotal = exchangeDestinations.reduce((sum, d) => sum + d.total, 0);
  const exchangeOutflowPct = pct(exchangeOutflowTotal, kpis.total_out);

  const topCircular = [...circularCounterparties].sort((a, b) => b.net - a.net)[0];

  return (
    <div className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4 text-sm">
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--warn)" }}>
          Typology notes — preliminary conclusion
        </h2>
        <p className="text-sm text-[var(--foreground)] mt-1 leading-relaxed">
          Generated automatically from the aggregate metrics below. Exchange labels combine public Tronscan
          tags with MistTrack multi-hop analysis (address clustering and links through intermediaries, not
          just direct public tags). Even so, coverage is still{" "}
          <span className="font-medium">not exhaustive</span> — some personal exchange deposit addresses
          remain unlabeled. The number of “exchange” addresses in this report should be treated as a lower
          bound, not a final count.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Pass-through transit node
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            The wallet balance is only {formatUsdt(kpis.residual)} USDT against a turnover of over{" "}
            {formatUsdt(kpis.total_in, 0)} USDT in {kpis.active_days} days. Funds from{" "}
            {kpis.unique_sources.toLocaleString("en-US")} sources are consolidated and almost immediately
            distributed to {kpis.unique_destinations.toLocaleString("en-US")} recipients. This is typical
            behavior of a transit/consolidation node in a layering scheme, not a final cash-out
            point.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Exchange label asymmetry
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            {exchangeSources.length} of {kpis.unique_sources.toLocaleString("en-US")} sources are labeled as
            exchanges ({exchangeInflowPct}% of total inflow — {formatUsdt(exchangeInflowTotal, 0)} USDT).
            {exchangeDestinations.length > 0 ? (
              <>
                {" "}
                MistTrack multi-hop analysis also identified {exchangeDestinations.length} of{" "}
                {kpis.unique_destinations.toLocaleString("en-US")} recipients labeled as exchanges (
                {exchangeOutflowPct}% of total outflow — {formatUsdt(exchangeOutflowTotal, 0)} USDT).
                This confirms direct cash-out to exchanges, not just transit through intermediary
                addresses.
              </>
            ) : (
              <>
                {" "}
                No recipient is labeled as an exchange. This is expected: exchange hot wallets are visible when
                funds are <span className="font-medium">withdrawn</span> from an exchange (inflow to this
                wallet), but when funds are <span className="font-medium">deposited</span> to an exchange,
                they go to a user-specific deposit address that public tags don&apos;t label.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Circular counterparties
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Found {kpis.circular_counterparty_count} addresses on both sides of the flow. The largest by net
            balance
            —{" "}
            {topCircular ? (
              <span className="inline-block align-middle">
                <AddressLink
                  address={topCircular.address}
                  tag={topCircular.tag}
                  isExchange={topCircular.is_exchange}
                />
              </span>
            ) : (
              "—"
            )}
            {topCircular && (
              <>
                {" "}
                — received {formatUsdt(topCircular.in_total, 0)} USDT, sent{" "}
                {formatUsdt(topCircular.out_total, 0)} USDT. Active two-way exchange of funds with the
                investigated wallet is a hallmark of layering through intermediary addresses.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
