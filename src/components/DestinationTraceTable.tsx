"use client";

import { useState } from "react";
import type { DestinationTraces } from "@/lib/types";
import { formatCount, formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";

export default function DestinationTraceTable({ data }: { data: DestinationTraces }) {
  const [expanded, setExpanded] = useState<string | null>(data.traced[0]?.address ?? null);

  return (
    <div className="report-card rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium">Простеження на один крок вперед — топ отримувачів</h3>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Куди найбільші отримувачі коштів від досліджуваного гаманця відправляють USDT далі. Виявлено
          відомих отримувачів-бірж: {data.summary.addresses_with_known_exchange_hits} з{" "}
          {data.summary.addresses_traced} · обсяг на відомі біржові адреси:{" "}
          {formatUsdt(data.summary.total_exchange_hit_volume)} USDT
        </p>
        <p className="text-[11px] text-[var(--muted)] mt-1.5 italic">{data.note}</p>
      </div>
      <div className="divide-y divide-[var(--border)] max-h-[560px] overflow-y-auto scrollbar-thin">
        {data.traced.map((t) => {
          const isOpen = expanded === t.address;
          return (
            <div key={t.address}>
              <button
                onClick={() => setExpanded(isOpen ? null : t.address)}
                className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--surface-raised)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <AddressLink address={t.address} />
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    отримав від досліджуваного гаманця: {formatUsdt(t.received_from_wallet)} USDT ·
                    власний вихідний обіг адреси (вся історія, не лише кошти з цього гаманця):{" "}
                    {formatUsdt(t.total_out_all_time)} USDT ({formatCount(t.out_tx_count)} тр.,{" "}
                    {formatCount(t.unique_targets)} унікальних отримувачів)
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {t.exchange_out_total > 0 && (
                    <span
                      className="text-[11px] px-2 py-1 rounded border whitespace-nowrap"
                      style={{
                        color: "var(--exchange)",
                        borderColor: "var(--exchange)",
                        background: "rgba(139, 124, 246, 0.08)",
                      }}
                    >
                      → біржа: {formatUsdt(t.exchange_out_total, 0)} USDT
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted)] mono">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 overflow-x-auto scrollbar-thin">
                  <table className="w-full text-xs mono">
                    <thead>
                      <tr className="text-[var(--muted)] text-left">
                        <th className="py-1.5 font-normal">Отримувач (наступний хоп)</th>
                        <th className="py-1.5 font-normal text-right">Сума (USDT)</th>
                        <th className="py-1.5 font-normal text-right">К-сть тр.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.top_targets.map((target) => (
                        <tr key={target.address} className="border-t border-[var(--border)]">
                          <td className="py-2 min-w-72">
                            <AddressLink
                              address={target.address}
                              tag={target.tag}
                              isExchange={target.is_exchange}
                            />
                          </td>
                          <td className="py-2 text-right" style={{ color: "var(--outflow)" }}>
                            {formatUsdt(target.total)}
                          </td>
                          <td className="py-2 text-right text-[var(--muted)]">{target.count}</td>
                        </tr>
                      ))}
                      {t.top_targets.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-3 text-center text-[var(--muted)]">
                            Вихідних переказів USDT не знайдено
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
