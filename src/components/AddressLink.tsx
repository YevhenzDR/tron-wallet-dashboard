import { tronscanUrl } from "@/lib/format";

export function TagBadge({
  tag,
  isExchange,
  onTagClick,
}: {
  tag: string;
  isExchange: boolean;
  onTagClick?: (tag: string) => void;
}) {
  if (!tag) return null;
  const style = isExchange
    ? { color: "var(--exchange)", borderColor: "var(--exchange)", background: "rgba(139, 124, 246, 0.08)" }
    : { color: "var(--muted)", borderColor: "var(--border)" };
  const label = isExchange ? `EXCHANGE · ${tag}` : tag;

  if (isExchange && onTagClick) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTagClick(tag);
        }}
        className="inline-block align-middle text-[10px] leading-none px-1.5 py-1 rounded border whitespace-nowrap hover:brightness-125 transition-[filter] cursor-pointer"
        style={style}
        title={`Show all transactions labeled “${tag}”`}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className="inline-block align-middle text-[10px] leading-none px-1.5 py-1 rounded border whitespace-nowrap"
      style={style}
    >
      {label}
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
      ⚠ RISK: {riskLevel === "Severe" ? "SEVERE" : "HIGH"}
    </span>
  );
}

export default function AddressLink({
  address,
  tag = "",
  isExchange = false,
  riskLevel = "",
  isHighRisk = false,
  onTagClick,
}: {
  address: string;
  tag?: string;
  isExchange?: boolean;
  riskLevel?: string;
  isHighRisk?: boolean;
  onTagClick?: (tag: string) => void;
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
      <TagBadge tag={tag} isExchange={isExchange} onTagClick={onTagClick} />
      <RiskBadge isHighRisk={isHighRisk} riskLevel={riskLevel} />
    </span>
  );
}
