"use client";

import { useMemo, useState } from "react";
import type { Counterparty } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";
import SortableTh, { type SortDir } from "./SortableTh";

type SortKey = "address" | "total" | "count";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  address: "asc",
  total: "desc",
  count: "desc",
};

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
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [dir, setDir] = useState<SortDir>("desc");
  const color = direction === "in" ? "var(--inflow)" : "var(--outflow)";
  const exchangeCount = rows.filter((r) => r.is_exchange).length;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(DEFAULT_DIR[key]);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    if (q === "exchange" || q === "біржа" || q === "біржі") return rows.filter((r) => r.is_exchange);
    return rows.filter(
      (r) => r.address.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = sortKey === "address" ? a.address.localeCompare(b.address) : a[sortKey] - b[sortKey];
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, dir]);

  return (
    <div className="report-card rounded-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium" style={{ color: "var(--warn)" }}>
            {title}
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 mt-1">
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
              <SortableTh label="Адреса" sortKey="address" activeKey={sortKey} dir={dir} onClick={handleSort} />
              <SortableTh
                label="Сума (USDT)"
                sortKey="total"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="К-сть тр."
                sortKey="count"
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
                <td className="px-4 py-2 text-right" style={{ color }}>
                  {formatUsdt(r.total)}
                </td>
                <td className="px-4 py-2 text-right text-[var(--muted)]">{r.count}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-[var(--muted)]">
                  Збігів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
