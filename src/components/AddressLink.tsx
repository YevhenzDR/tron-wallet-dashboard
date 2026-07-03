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

export default function AddressLink({
  address,
  tag = "",
  isExchange = false,
}: {
  address: string;
  tag?: string;
  isExchange?: boolean;
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
    </span>
  );
}
