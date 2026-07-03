"use client";

import { useMemo, useState } from "react";
import type { Counterparty } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";

export default function CounterpartyTable({
  title,
  rows,
  direction,
}: {
  title: string;
  rows: Counterparty[];
  direction: "in" | "out";
}) {
  const [query, setQuery] = useState("");
  const color = direction === "in" ? "var(--inflow)" : "var(--outflow)";
  const exchangeCount = rows.filter((r) => r.is_exchange).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    if (q === "exchange" || q === "біржа" || q === "біржі") return rows.filter((r) => r.is_exchange);
    return rows.filter(
      (r) => r.address.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="report-card rounded-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            унікальних адрес: {rows.length.toLocaleString("uk-UA")} · бірж: {exchangeCount}
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="пошук адреси / мітки…"
          className="mono text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded px-2 py-1.5 w-40 sm:w-56 outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
        />
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <th className="px-4 py-2 font-normal">Адреса</th>
              <th className="px-4 py-2 font-normal text-right">Сума (USDT)</th>
              <th className="px-4 py-2 font-normal text-right">К-сть тр.</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((r) => (
              <tr key={r.address} className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]">
                <td className="px-4 py-2 min-w-72">
                  <AddressLink address={r.address} tag={r.tag} isExchange={r.is_exchange} />
                </td>
                <td className="px-4 py-2 text-right" style={{ color }}>
                  {formatUsdt(r.total)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--muted)]">{r.count}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--muted)]">
                  Збігів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && (
        <div className="px-4 py-2 text-[11px] text-[var(--muted)] border-t border-[var(--border)]">
          Показано перші 200 із {filtered.length.toLocaleString("uk-UA")} збігів — уточніть пошук
        </div>
      )}
    </div>
  );
}
