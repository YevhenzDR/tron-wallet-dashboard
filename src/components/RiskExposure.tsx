import type { RiskDetailEntry, WalletRisk } from "@/lib/types";
import { formatUsdt } from "@/lib/format";

interface EntityNote {
  note: string;
  confirmed: boolean;
}

const ENTITY_NOTES: Record<string, EntityNote> = {
  "garantex.io": {
    note: "Russian exchange. Sanctioned by US OFAC (SDN list, April 2022) for facilitating transactions for ransomware operators and darknet markets; seized by law enforcement in 2025. As a Russian financial entity, it falls under Ukraine's NSDC sanctions.",
    confirmed: true,
  },
  rapira: {
    note: "Russian exchange. As a Russian financial entity, it falls under Ukraine's NSDC sanctions. Its US OFAC sanctions status requires separate verification.",
    confirmed: true,
  },
  "grinex.io": {
    note: "Russian exchange. As a Russian financial entity, it falls under Ukraine's NSDC sanctions. Its US OFAC sanctions status requires separate verification.",
    confirmed: true,
  },
  "cryptex.net": {
    note: "Russian exchange/OTC platform. As a Russian financial entity, it falls under Ukraine's NSDC sanctions. Its US OFAC sanctions status requires separate verification.",
    confirmed: true,
  },
  "nobitex.ir": {
    note: "Largest Iranian exchange. Iran is under a comprehensive US OFAC trade embargo — any Iranian financial institution falls under the sanctions regime by jurisdiction.",
    confirmed: true,
  },
  huionepay: {
    note: "Huione Group (Cambodia). In 2025 US FinCEN applied a special measure under Section 311 of the USA PATRIOT Act, designating the group a primary money laundering concern (linked to scam call-center networks in Southeast Asia).",
    confirmed: true,
  },
};

function entityNote(entity: string): EntityNote {
  return (
    ENTITY_NOTES[entity.toLowerCase()] ?? {
      note: "Requires verification against an official government sanctions registry (e.g. OFAC SDN, Ukraine's NSDC sanctions registry). Specific sanctions status is not confirmed.",
      confirmed: false,
    }
  );
}

const RISK_TYPE_LABEL: Record<string, string> = {
  sanctioned_entity: "sanctioned/high-risk entity",
  illicit_activity: "illicit activity",
};

const ACTIVITY_LABEL: Record<string, string> = {
  Theft: "theft of funds",
  "OFAC Sanctions": "general OFAC sanctions flag",
  "USDT Banned Address": "USDT (Tether) blacklisted address",
  "WOO X Exploiter": "WOO X exchange exploit",
  Phishing: "phishing",
  "Dusting Attack": "dusting attack (de-anonymization marker)",
  "Terrorism Financing": "terrorism financing",
};

function RiskRow({ entry }: { entry: RiskDetailEntry }) {
  const isEntity = entry.risk_type === "sanctioned_entity";
  const label = isEntity ? entry.entity : ACTIVITY_LABEL[entry.entity] ?? entry.entity;
  const note = isEntity ? entityNote(entry.entity) : null;
  const hops = Object.keys(entry.hop_dic).length;

  return (
    <div className="border-t border-[var(--border)] py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{label}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap"
            style={
              isEntity
                ? { color: "var(--danger)", borderColor: "var(--danger)" }
                : { color: "var(--warn)", borderColor: "var(--warn)" }
            }
          >
            {RISK_TYPE_LABEL[entry.risk_type] ?? entry.risk_type}
          </span>
          {note && !note.confirmed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] whitespace-nowrap">
              needs verification
            </span>
          )}
        </div>
        <span className="text-sm mono" style={{ color: "var(--outflow)" }}>
          ${formatUsdt(entry.volume, 0)} · {entry.percent}%
        </span>
      </div>
      <p className="text-sm text-[var(--foreground)] opacity-80 mt-1.5 leading-relaxed">
        {entry.exposure_type === "direct"
          ? `Direct (1-hop) connection to this flag.`
          : `Indirect connection via ${hops - 1} intermediaries (${entry.hop_num} ${
              entry.hop_num === 1 ? "hop" : "hops"
            } to the wallet).`}
      </p>
      {note && <p className="text-sm text-[var(--foreground)] opacity-80 mt-1.5 leading-relaxed">{note.note}</p>}
    </div>
  );
}

export default function RiskExposure({ risk }: { risk: WalletRisk }) {
  const sorted = [...risk.risk_detail].sort((a, b) => b.volume - a.volume);
  const entityHits = sorted.filter((e) => e.risk_type === "sanctioned_entity");
  const activityHits = sorted.filter((e) => e.risk_type !== "sanctioned_entity");

  return (
    <div
      className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4"
      style={{ borderColor: "var(--danger)" }}
    >
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--danger)" }}>
          Risk and sanctions exposure
        </h2>
        <p className="text-sm text-[var(--foreground)] opacity-80 mt-1 leading-relaxed">
          Analysis of the wallet&apos;s multi-hop connections to known sanctioned/high-risk entities and
          illicit-activity cases — unlike simple public tags, it accounts for funds that passed through
          intermediary addresses.
        </p>
      </div>

      {entityHits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: "var(--warn)" }}>
            Sanctioned / high-risk entities ({entityHits.length})
          </h3>
          {entityHits.map((e, i) => (
            <RiskRow key={e.entity + i} entry={e} />
          ))}
        </div>
      )}

      {activityHits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: "var(--warn)" }}>
            Illicit activity flags ({activityHits.length})
          </h3>
          {activityHits.map((e, i) => (
            <RiskRow key={e.entity + i} entry={e} />
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--muted)] italic pt-2 border-t border-[var(--border)]">
        Data obtained via MistTrack (multi-hop link analysis). Sanctions status marked as
        &quot;needs verification&quot; has not been confirmed against an official government registry and
        should not be used as conclusive evidence without independent verification.
      </p>
    </div>
  );
}
