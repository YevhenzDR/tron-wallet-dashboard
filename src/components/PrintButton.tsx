"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
      title="Друкувати поточний вигляд сторінки або зберегти як PDF"
    >
      🖨 Друк / зберегти PDF
    </button>
  );
}
