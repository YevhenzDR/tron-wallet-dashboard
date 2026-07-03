export function shortenAddress(address: string, lead = 6, tail = 6): string {
  if (address.length <= lead + tail + 3) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function formatUsdt(value: number, fractionDigits = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) +
    " UTC"
  );
}
