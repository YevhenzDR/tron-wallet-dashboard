"use client";

import { Fragment, useMemo, useState } from "react";
import type { DestinationFlow, CounterpartyFlowSummary } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import { csvAddressCell, csvField, downloadCsv } from "@/lib/csv";
import AddressLink from "./AddressLink";
import SortableTh, { type SortDir } from "./SortableTh";

function pct(part: number, whole: number): string {
  if (!whole) return "0";
  return ((part / whole) * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
}

function toCsv(rows: DestinationFlow[]): string {
  const header = "address,tag,is_exchange,is_high_risk,risk_level,received_from_wallet_usdt";
  const lines = rows.map((r) =>
    [
      csvAddressCell(r.address),
      csvField(r.tag),
      r.is_exchange,
      r.is_high_risk,
      csvField(r.risk_level),
      r.received_from_wallet,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

type Category = "exchange" | "high_risk" | "regular";
const CATEGORY_RANK: Record<Category, number> = { exchange: 0, high_risk: 1, regular: 2 };
const CATEGORY_LABEL: Record<Category, string> = {
  exchange: "Біржа",
  high_risk: "Високоризиковий",
  regular: "Гаманець",
};

function categoryOf(d: DestinationFlow): Category {
  if (d.is_exchange) return "exchange";
  if (d.is_high_risk) return "high_risk";
  return "regular";
}

type SortKey = "received" | "address" | "category";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  received: "desc",
  address: "asc",
  category: "asc",
};

export default function CounterpartyFlow({ data }: { data: CounterpartyFlowSummary }) {
  const [expanded, setExpanded] = useState<string | null>(data.per_destination[0]?.address ?? null);
  const [sortKey, setSortKey] = useState<SortKey>("received");
  const [dir, setDir] = useState<SortDir>("desc");
  const [entityQuery, setEntityQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");

  const filteredEntities = useMemo(() => {
    const q = entityQuery.trim().toLowerCase();
    if (!q) return data.entities;
    return data.entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [data.entities, entityQuery]);

  const filteredDestinations = useMemo(() => {
    const q = destQuery.trim().toLowerCase();
    if (!q) return data.per_destination;
    return data.per_destination.filter(
      (d) => d.address.toLowerCase().includes(q) || d.tag.toLowerCase().includes(q)
    );
  }, [data.per_destination, destQuery]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(DEFAULT_DIR[key]);
    }
  };

  const knownPct = pct(data.estimated_to_named_entities, data.total_received_by_analyzed);
  const unknownPct = pct(data.estimated_unattributed, data.total_received_by_analyzed);
  const exchangeCount = data.per_destination.filter((d) => d.is_exchange).length;
  const highRiskCount = data.per_destination.filter((d) => !d.is_exchange && d.is_high_risk).length;

  const sorted = useMemo(() => {
    const arr = [...filteredDestinations];
    arr.sort((a, b) => {
      let cmp: number;
      if (sortKey === "address") {
        cmp = a.address.localeCompare(b.address);
      } else if (sortKey === "category") {
        cmp = CATEGORY_RANK[categoryOf(a)] - CATEGORY_RANK[categoryOf(b)];
        if (cmp === 0) cmp = b.received_from_wallet - a.received_from_wallet;
      } else {
        cmp = a.received_from_wallet - b.received_from_wallet;
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredDestinations, sortKey, dir]);

  return (
    <div className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--warn)" }}>
          Куди зрештою потрапили кошти
        </h2>
        <p className="text-base text-[var(--foreground)] mt-1 leading-relaxed">
          Оцінка кінцевого напрямку коштів після виходу з досліджуваного гаманця, на основі власної
          кластеризації контрагентів MistTrack для {data.destinations_analyzed} отримувачів (разом
          отримали {formatUsdt(data.total_received_by_analyzed, 0)} USDT від гаманця).
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            За сервісами ({filteredEntities.length}
            {entityQuery ? ` з ${data.entities.length}` : ""})
          </h3>
          <input
            value={entityQuery}
            onChange={(e) => setEntityQuery(e.target.value)}
            placeholder="пошук сервісу…"
            className="mono text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded px-2 py-1.5 w-40 sm:w-56 outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
          />
        </div>
        {filteredEntities.length === 0 ? (
          <div className="py-4 text-center text-sm text-[var(--muted)]">Збігів не знайдено</div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-6">
            {filteredEntities.map((e) => (
              <div
                key={e.name}
                className="flex items-center justify-between gap-3 py-1.5 border-t border-[var(--border)] break-inside-avoid"
              >
                <span className="text-sm truncate">{e.name}</span>
                <span className="text-sm mono shrink-0" style={{ color: "var(--exchange)" }}>
                  ≈ {formatUsdt(e.estimated_amount, 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Розподіл за окремими отримувачами ({sorted.length}
            {destQuery ? ` з ${data.per_destination.length}` : ""})
          </h3>
          <div className="flex items-center gap-2">
            <input
              value={destQuery}
              onChange={(e) => setDestQuery(e.target.value)}
              placeholder="пошук адреси / сервісу…"
              className="mono text-xs bg-[var(--surface-raised)] border border-[var(--border)] rounded px-2 py-1.5 w-40 sm:w-56 outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
            />
            <button
              onClick={() => downloadCsv("destination-distribution.csv", toCsv(sorted))}
              className="text-xs px-2 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
            >
              експорт CSV
            </button>
          </div>
        </div>
        <p className="text-sm text-[var(--foreground)] opacity-80 mb-2">
          бірж серед отримувачів: {exchangeCount} · високоризикових: {highRiskCount} · натисніть на
          заголовок стовпця для сортування
        </p>
        <div className="overflow-x-auto scrollbar-thin max-h-[560px] overflow-y-auto">
          <table className="w-full text-xs mono">
            <thead className="sticky top-0 bg-[var(--surface)]">
              <tr className="text-[var(--muted)] text-left">
                <SortableTh label="Адреса" sortKey="address" activeKey={sortKey} dir={dir} onClick={handleSort} />
                <SortableTh
                  label="Категорія"
                  sortKey="category"
                  activeKey={sortKey}
                  dir={dir}
                  onClick={handleSort}
                />
                <SortableTh
                  label="Отримано від гаманця"
                  sortKey="received"
                  activeKey={sortKey}
                  dir={dir}
                  onClick={handleSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const isOpen = expanded === d.address;
                const cat = categoryOf(d);
                return (
                  <Fragment key={d.address}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : d.address)}
                      className="border-t border-[var(--border)] hover:bg-[var(--surface-raised)] cursor-pointer"
                    >
                      <td className="px-4 py-2 min-w-72">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--muted)]">{isOpen ? "▲" : "▼"}</span>
                          <AddressLink
                            address={d.address}
                            tag={d.tag}
                            isExchange={d.is_exchange}
                            riskLevel={d.risk_level}
                            isHighRisk={d.is_high_risk}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap"
                          style={
                            cat === "exchange"
                              ? { color: "var(--exchange)", borderColor: "var(--exchange)" }
                              : cat === "high_risk"
                              ? { color: "var(--danger)", borderColor: "var(--danger)" }
                              : { color: "var(--muted)", borderColor: "var(--border)" }
                          }
                        >
                          {CATEGORY_LABEL[cat]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: "var(--outflow)" }}>
                        {formatUsdt(d.received_from_wallet)}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-[var(--border)]">
                        <td colSpan={3} className="px-4 pb-3 bg-[var(--surface-raised)]">
                          <table className="w-full text-xs mono mt-2">
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
                              {d.breakdown.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="py-2 text-center text-[var(--muted)]">
                                    Даних немає
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
    </div>
  );
}
