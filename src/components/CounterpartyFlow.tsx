"use client";

import { useState } from "react";
import type { CounterpartyFlowSummary } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";

function pct(part: number, whole: number): string {
  if (!whole) return "0";
  return ((part / whole) * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
}

export default function CounterpartyFlow({ data }: { data: CounterpartyFlowSummary }) {
  const [expanded, setExpanded] = useState<string | null>(data.per_destination[0]?.address ?? null);
  const knownPct = pct(data.estimated_to_named_entities, data.total_received_by_analyzed);
  const unknownPct = pct(data.estimated_unattributed, data.total_received_by_analyzed);

  return (
    <div className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--warn)" }}>
          Куди зрештою потрапили кошти
        </h2>
        <p className="text-base text-[var(--foreground)] mt-1 leading-relaxed">
          Оцінка кінцевого напрямку коштів після виходу з досліджуваного гаманця, на основі власної
          кластеризації контрагентів MistTrack для {data.destinations_analyzed} найбільших отримувачів
          (разом отримали {formatUsdt(data.total_received_by_analyzed, 0)} USDT від гаманця).
        </p>
        <p className="text-sm text-[var(--foreground)] opacity-80 italic mt-2 leading-relaxed">
          {data.method_note}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-md border border-[var(--border)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Оцінено як біржі / відомі сервіси
          </div>
          <div className="text-xl font-medium mono mt-1" style={{ color: "var(--exchange)" }}>
            {formatUsdt(data.estimated_to_named_entities, 0)} USDT
          </div>
          <div className="text-sm text-[var(--foreground)] opacity-80 mt-0.5">{knownPct}% проаналізованої суми</div>
        </div>
        <div className="rounded-md border border-[var(--border)] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            Без атрибуції (проміжні адреси)
          </div>
          <div className="text-xl font-medium mono mt-1 text-[var(--muted)]">
            {formatUsdt(data.estimated_unattributed, 0)} USDT
          </div>
          <div className="text-sm text-[var(--foreground)] opacity-80 mt-0.5">{unknownPct}% проаналізованої суми</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: "var(--warn)" }}>
          За сервісами ({data.entities.length})
        </h3>
        <div className="flex flex-col">
          {data.entities.map((e) => (
            <div
              key={e.name}
              className="flex items-center justify-between gap-3 py-1.5 border-t border-[var(--border)] first:border-t-0"
            >
              <span className="text-sm">{e.name}</span>
              <span className="text-sm mono" style={{ color: "var(--exchange)" }}>
                ≈ {formatUsdt(e.estimated_amount, 0)} USDT
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <h3 className="text-sm font-medium uppercase tracking-wider mb-2" style={{ color: "var(--warn)" }}>
          Розподіл за окремими отримувачами
        </h3>
        <div className="divide-y divide-[var(--border)] max-h-[480px] overflow-y-auto scrollbar-thin -mx-1">
          {data.per_destination.map((d) => {
            const isOpen = expanded === d.address;
            return (
              <div key={d.address} className="px-1">
                <button
                  onClick={() => setExpanded(isOpen ? null : d.address)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 py-3 text-left hover:bg-[var(--surface-raised)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <AddressLink address={d.address} />
                    <p className="text-xs text-[var(--foreground)] opacity-80 mt-1">
                      отримав від гаманця: {formatUsdt(d.received_from_wallet)} USDT
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted)] mono shrink-0">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="pb-3">
                    <table className="w-full text-xs mono">
                      <thead>
                        <tr className="text-[var(--muted)] text-left">
                          <th className="py-1 font-normal">Сервіс</th>
                          <th className="py-1 font-normal text-right">Частка у власному обігу</th>
                          <th className="py-1 font-normal text-right">Оцінена сума</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.breakdown.map((b) => (
                          <tr key={b.name} className="border-t border-[var(--border)]">
                            <td className="py-1.5">{b.name}</td>
                            <td className="py-1.5 text-right text-[var(--muted)]">
                              {b.source_percent.toLocaleString("uk-UA", { maximumFractionDigits: 2 })}%
                            </td>
                            <td className="py-1.5 text-right" style={{ color: "var(--exchange)" }}>
                              {formatUsdt(b.estimated_amount, 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
