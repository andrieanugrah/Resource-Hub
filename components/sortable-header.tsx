import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  label: string;
  field: string;
  currentSort?: string;
  currentDir?: string;
  searchParams?: Record<string, string | undefined>;
}

export function SortableHeader({ label, field, currentSort, currentDir, searchParams = {} }: Props) {
  const nextDir = currentSort === field && currentDir === "asc" ? "desc" : "asc";
  const isActive = currentSort === field;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, v);
  }
  params.set("sort", field);
  params.set("dir", nextDir);
  params.delete("page"); // reset to page 1 on sort change
  const href = `?${params.toString()}`;

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="h-3 w-3 text-foreground" />
        ) : (
          <ArrowDown className="h-3 w-3 text-foreground" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
      )}
    </Link>
  );
}

