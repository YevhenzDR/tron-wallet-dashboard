"use client";

import { useEffect, useMemo, useState } from "react";
import type { Transaction, TransactionLedger as TransactionLedgerData } from "@/lib/types";
import { formatCount, formatDateTime, formatUsdt, tronscanTxUrl } from "@/lib/format";
import { csvAddressCell, csvField, csvHyperlink, downloadCsv } from "@/lib/csv";
import AddressLink from "./AddressLink";
import SortableTh, { type SortDir } from "./SortableTh";
import { PRINT_SHOW_ALL_EVENT } from "./PrintButton";

type SortKey = "time" | "amount";
type DirectionFilter = "all" | "in" | "out";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  time: "desc",
  amount: "desc",
};

const PAGE_SIZE = 50;

function shortenHash(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function toCsv(rows: Transaction[]): string {
  const header = "time,direction,counterparty,amount_usdt,tag,is_exchange,tx_hash";
  const lines = rows.map((r) =>
    [
      r.time,
      r.direction,
      csvAddressCell(r.counterparty),
      r.amount,
      csvField(r.tag),
      r.is_exchange,
      csvHyperlink(tronscanTxUrl(r.hash), r.hash),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export default function TransactionLedgerTable({ data }: { data: TransactionLedgerData }) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [dir, setDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ showAll: boolean }>).detail;
      setPrintAll(detail.showAll);
    };
    window.addEventListener(PRINT_SHOW_ALL_EVENT, handler);
    return () => window.removeEventListener(PRINT_SHOW_ALL_EVENT, handler);
  }, []);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(DEFAULT_DIR[key]);
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data.transactions;
    if (direction !== "all") {
      rows = rows.filter((r) => r.direction === direction);
    }
    if (q) {
      rows = rows.filter(
        (r) =>
          r.counterparty.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q) ||
          r.hash.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data.transactions, query, direction]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp = sortKey === "time" ? a.time.localeCompare(b.time) : a.amount - b.amount;
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, dir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = printAll
    ? sorted
    : sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="report-card rounded-md overflow-hidden flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-medium" style={{ color: "var(--warn)" }}>
            Повний реєстр транзакцій
          </h3>
          <p className="text-sm text-[var(--foreground)] opacity-80 mt-1">
            Кожен окремий переказ з хешем транзакції — знайдено: {formatCount(data.count)} ·
            показано: {formatCount(sorted.length)}
          </p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <div className="flex gap-1 text-xs">
            {(["all", "in", "out"] as DirectionFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDirection(d);
                  setPage(0);
                }}
                className={`px-2 py-1.5 rounded border text-xs transition-colors ${
                  direction === d
                    ? "border-[var(--warn)] text-[var(--warn)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {d === "all" ? "усі" : d === "in" ? "вхідні" : "вихідні"}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="пошук адреси / мітки / хешу…"
            className="mono text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded px-2 py-1.5 w-40 sm:w-56 outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
          />
          <button
            onClick={() => downloadCsv("transactions.csv", toCsv(sorted))}
            className="text-xs px-2 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
          >
            експорт CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs mono">
          <thead className="bg-[var(--surface)]">
            <tr className="text-[var(--muted)] text-left">
              <SortableTh label="Час" sortKey="time" activeKey={sortKey} dir={dir} onClick={handleSort} />
              <th className="px-4 py-2 font-normal">Напрям</th>
              <th className="px-4 py-2 font-normal">Контрагент</th>
              <SortableTh
                label="Сума (USDT)"
                sortKey="amount"
                activeKey={sortKey}
                dir={dir}
                onClick={handleSort}
                align="right"
              />
              <th className="px-4 py-2 font-normal">Хеш транзакції</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.hash + r.direction} className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)]">
                <td className="px-4 py-2 text-[var(--muted)] whitespace-nowrap">{formatDateTime(r.time)}</td>
                <td className="px-4 py-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap"
                    style={
                      r.direction === "in"
                        ? { color: "var(--inflow)", borderColor: "var(--inflow)" }
                        : { color: "var(--outflow)", borderColor: "var(--outflow)" }
                    }
                  >
                    {r.direction === "in" ? "вхід" : "вихід"}
                  </span>
                </td>
                <td className="px-4 py-2 min-w-72">
                  <AddressLink
                    address={r.counterparty}
                    tag={r.tag}
                    isExchange={r.is_exchange}
                    riskLevel={r.risk_level}
                    isHighRisk={r.is_high_risk}
                    onTagClick={(tag) => {
                      setQuery(tag);
                      setPage(0);
                    }}
                  />
                </td>
                <td
                  className="px-4 py-2 text-right"
                  style={{ color: r.direction === "in" ? "var(--inflow)" : "var(--outflow)" }}
                >
                  {formatUsdt(r.amount)}
                </td>
                <td className="px-4 py-2">
                  <a
                    href={tronscanTxUrl(r.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-[var(--accent)] whitespace-nowrap"
                    title={r.hash}
                  >
                    {shortenHash(r.hash)}
                  </a>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                  Збігів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="no-print flex items-center justify-end gap-3 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        <span>
          сторінка {currentPage + 1} з {pageCount}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-30 hover:text-[var(--foreground)] transition-colors"
          >
            ← попередня
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-30 hover:text-[var(--foreground)] transition-colors"
          >
            наступна →
          </button>
        </div>
      </div>
    </div>
  );
}
