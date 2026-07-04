export type SortDir = "asc" | "desc";

export default function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align = "left",
  padX = "px-4",
}: {
  label: string;
  sortKey: K;
  activeKey: K;
  dir: SortDir;
  onClick: (key: K) => void;
  align?: "left" | "right";
  padX?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th
      onClick={() => onClick(sortKey)}
      className={`${padX} py-2 font-normal cursor-pointer select-none hover:text-[var(--foreground)] transition-colors ${
        align === "right" ? "text-right" : "text-left"
      } ${isActive ? "text-[var(--foreground)]" : ""}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === "right" ? "flex-row-reverse" : "flex-row"}`}
      >
        {label}
        <span className="text-[9px]" style={{ opacity: isActive ? 1 : 0.3 }}>
          {isActive && dir === "asc" ? "▲" : "▼"}
        </span>
      </span>
    </th>
  );
}
