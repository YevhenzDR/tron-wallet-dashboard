"use client";

import { useMemo, useState } from "react";
import type { Counterparty } from "@/lib/types";
import { formatUsdt, shortenAddress } from "@/lib/format";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.address.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="report-card rounded-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">{rows.length.toLocaleString()} unique addresses</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search address…"
          className="mono text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded px-2 py-1.5 w-40 sm:w-56 outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
        />
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <th className="px-4 py-2 font-normal">Address</th>
              <th className="px-4 py-2 font-normal text-right">Total (USDT)</th>
              <th className="px-4 py-2 font-normal text-right">Tx Count</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((r) => (
              <tr key={r.address} className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]">
                <td className="px-4 py-2" title={r.address}>
                  {shortenAddress(r.address)}
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
                  No matches
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && (
        <div className="px-4 py-2 text-[11px] text-[var(--muted)] border-t border-[var(--border)]">
          Showing top 200 of {filtered.length.toLocaleString()} matches — refine search to narrow further
        </div>
      )}
    </div>
  );
}
