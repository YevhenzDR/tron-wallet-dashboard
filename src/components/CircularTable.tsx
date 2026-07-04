"use client";

import { useState } from "react";
import type { CircularCounterparty } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
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
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium" style={{ color: "var(--warn)" }}>
          Циркулярні контрагенти
        </h3>
        <p className="text-sm text-[var(--foreground)] opacity-80 mt-1">
          Адреси, що фігурують і як джерело, і як отримувач — виявлено: {rows.length}. Натисніть на
          заголовок стовпця для сортування.
        </p>
      </div>
      <div className="overflow-x-auto scrollbar-thin max-h-96 overflow-y-auto">
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <SortableTh label="Адреса" sortKey="address" activeKey={sortKey} dir={dir} onClick={handleSort} />
              <SortableTh
                label="Надійшло"
                sortKey="in_total"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Тр. вх."
                sortKey="in_count"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Відправлено"
                sortKey="out_total"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Тр. вих."
                sortKey="out_count"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <SortableTh
                label="Сальдо"
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
                  <AddressLink address={r.address} tag={r.tag} isExchange={r.is_exchange} />
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
