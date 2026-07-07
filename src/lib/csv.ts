import { tronscanUrl } from "./format";

// Semicolon argument separator: Ukrainian-locale Excel/Sheets (this
// dashboard's actual audience) expect ";" for formula arguments, not ",".
// A comma-separated HYPERLINK() silently renders as literal text there.
export function csvHyperlink(url: string, label: string): string {
  return `"=HYPERLINK(""${url}"";""${label}"")"`;
}

export function csvAddressCell(address: string): string {
  return csvHyperlink(tronscanUrl(address), address);
}

export function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
