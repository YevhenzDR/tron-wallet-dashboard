"use client";

// Custom event name components with pagination (currently just the
// transaction ledger) listen for to temporarily show every row for the
// "print everything" flow, then revert once printing is done.
export const PRINT_SHOW_ALL_EVENT = "print-show-all-rows";

function printCurrentView() {
  window.print();
}

function printEverything() {
  document.body.classList.add("print-expand-all");
  window.dispatchEvent(new CustomEvent(PRINT_SHOW_ALL_EVENT, { detail: { showAll: true } }));

  const cleanup = () => {
    document.body.classList.remove("print-expand-all");
    window.dispatchEvent(new CustomEvent(PRINT_SHOW_ALL_EVENT, { detail: { showAll: false } }));
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Give React a tick to render the expanded ledger before the print
  // dialog captures the page.
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

export default function PrintButton() {
  return (
    <div className="no-print flex items-center gap-2">
      <button
        onClick={printEverything}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
        title="Expand all tables (every row, every ledger page) and print everything"
      >
        🖨 Print everything
      </button>
      <button
        onClick={printCurrentView}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors whitespace-nowrap"
        title="Print exactly what is visible on screen now (current filters, ledger page)"
      >
        🖨 Print current view
      </button>
    </div>
  );
}
