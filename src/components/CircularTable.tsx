"use client";

import { useState } from "react";
import type { CircularCounterparty } from "@/lib/types";
import { formatUsdt, shortenAddress } from "@/lib/format";

type SortKey = "in_total" | "out_total" | "net";

export default function CircularTable({ rows }: { rows: CircularCounterparty[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("in_total");

  const sorted = [...rows].sort((a, b) => Math.abs(b[sortKey]) - Math.abs(a[sortKey]));

  return (
    <div className="report-card rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium">Circular Counterparties</h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Addresses that appear as both a source and a destination — {rows.length} flagged
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          {(["in_total", "out_total", "net"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                sortKey === k
                  ? "border-[var(--warn)] text-[var(--warn)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              sort: {k === "in_total" ? "in" : k === "out_total" ? "out" : "net"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <th className="px-4 py-2 font-normal">Address</th>
              <th className="px-4 py-2 font-normal text-right">In Total</th>
              <th className="px-4 py-2 font-normal text-right">In Tx</th>
              <th className="px-4 py-2 font-normal text-right">Out Total</th>
              <th className="px-4 py-2 font-normal text-right">Out Tx</th>
              <th className="px-4 py-2 font-normal text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.address} className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]">
                <td className="px-4 py-2" title={r.address}>
                  {shortenAddress(r.address)}
                </td>
                <td className="px-4 py-2 text-right" style={{ color: "var(--inflow)" }}>
                  {formatUsdt(r.in_total)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--muted)]">{r.in_count}</td>
                <td className="px-4 py-2 text-right" style={{ color: "var(--outflow)" }}>
                  {formatUsdt(r.out_total)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--muted)]">{r.out_count}</td>
                <td
                  className="px-4 py-2 text-right"
                  style={{ color: r.net >= 0 ? "var(--inflow)" : "var(--outflow)" }}
                >
                  {r.net >= 0 ? "+" : ""}
                  {formatUsdt(r.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
