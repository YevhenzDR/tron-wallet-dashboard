const LOCALE = "en-US";

export function tronscanUrl(address: string): string {
  return `https://tronscan.org/#/address/${address}`;
}

export function tronscanTxUrl(hash: string): string {
  return `https://tronscan.org/#/transaction/${hash}`;
}

export function formatUsdt(value: number, fractionDigits = 2): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatCount(value: number): string {
  return value.toLocaleString(LOCALE);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false }) +
    " UTC"
  );
}
