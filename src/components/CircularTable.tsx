"use client";

import { useState } from "react";
import type { CircularCounterparty } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import { csvAddressCell, csvField, downloadCsv } from "@/lib/csv";
import AddressLink from "./AddressLink";
import SortableTh, { type SortDir } from "./SortableTh";

type SortKey = "address" | "in_total" | "in_count" | "out_total" | "out_count" | "net";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  address: "asc",
  in_total: "desc",
  in_count: "desc",
  out_total: "desc",
  out_count: "desc",
  net: "desc",
};

function toCsv(rows: CircularCounterparty[]): string {
  const header = "address,tag,is_exchange,in_total_usdt,in_count,out_total_usdt,out_count,net_usdt";
  const lines = rows.map((r) =>
    [
      csvAddressCell(r.address),
      csvField(r.tag),
      r.is_exchange,
      r.in_total,
      r.in_count,
      r.out_total,
      r.out_count,
      r.net,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export default function CircularTable({ rows }: { rows: CircularCounterparty[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("in_total");
  const [dir, setDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(DEFAULT_DIR[key]);
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const cmp = sortKey === "address" ? a.address.localeCompare(b.address) : a[sortKey] - b[sortKey];
    return dir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="report-card rounded-md overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium" style={{ color: "var(--warn)" }}>
            Circular counterparties
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 mt-1">
            Addresses that appear as both a source and a recipient — found: {rows.length}. Click a column
            header to sort.
          </p>
        </div>
        <button
          onClick={() => downloadCsv("circular-counterparties.csv", toCsv(sorted))}
          className="text-xs px-2 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
        >
          export CSV
        </button>
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <SortableTh label="Address" sortKey="address" activeKey={sortKey} dir={dir} onClick={handleSort} />
              <SortableTh
                label="Received"
                sortKey="in_total"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Tx in"
                sortKey="in_count"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Sent"
                sortKey="out_total"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Tx out"
                sortKey="out_count"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Net"
                sortKey="net"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.address} className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]">
                <td className="px-4 py-2 min-w-72">
                  <AddressLink
                    address={r.address}
                    tag={r.tag}
                    isExchange={r.is_exchange}
                    riskLevel={r.risk_level}
                    isHighRisk={r.is_high_risk}
                  />
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
