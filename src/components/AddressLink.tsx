import { tronscanUrl } from "@/lib/format";

export function TagBadge({ tag, isExchange }: { tag: string; isExchange: boolean }) {
  if (!tag) return null;
  return (
    <span
      className="inline-block align-middle text-[10px] leading-none px-1.5 py-1 rounded border whitespace-nowrap"
      style={
        isExchange
          ? { color: "var(--exchange)", borderColor: "var(--exchange)", background: "rgba(139, 124, 246, 0.08)" }
          : { color: "var(--muted)", borderColor: "var(--border)" }
      }
    >
      {isExchange ? `БІРЖА · ${tag}` : tag}
    </span>
  );
}

export function RiskBadge({ isHighRisk, riskLevel }: { isHighRisk: boolean; riskLevel: string }) {
  if (!isHighRisk) return null;
  return (
    <span
      className="inline-flex items-center gap-1 align-middle text-[10px] leading-none px-1.5 py-1 rounded border whitespace-nowrap"
      style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(232, 120, 90, 0.08)" }}
      title={`MistTrack risk level: ${riskLevel}`}
    >
      ⚠ РИЗИК: {riskLevel === "Severe" ? "КРИТИЧНИЙ" : "ВИСОКИЙ"}
    </span>
  );
}

export default function AddressLink({
  address,
  tag = "",
  isExchange = false,
  riskLevel = "",
  isHighRisk = false,
}: {
  address: string;
  tag?: string;
  isExchange?: boolean;
  riskLevel?: string;
  isHighRisk?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <a
        href={tronscanUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mono break-all hover:underline hover:text-[var(--accent)]"
      >
        {address}
      </a>
      <TagBadge tag={tag} isExchange={isExchange} />
      <RiskBadge isHighRisk={isHighRisk} riskLevel={riskLevel} />
    </span>
  );
}
