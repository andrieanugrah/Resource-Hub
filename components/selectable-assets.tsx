"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/badge";
import { TableCell } from "@/components/ui/table";
import { BulkActionBar } from "@/components/bulk-actions";
import { OpenSplitButton } from "@/components/open-split-button";
import Link from "next/link";

interface AssetRow {
  id: string; asset_code: string; asset_name: string;
  status: string; condition: string;
  category_name: string; location_name: string; assigned_user_name: string;
}

/** Renders asset rows with checkboxes, plus select-all + bulk action bar. */
export function SelectableAssetBody({
  assets,
}: {
  assets: AssetRow[];
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleId = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  return (
    <>
      {assets.map((a, idx) => (
        <motion.tr
          key={a.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: Math.min(idx * 0.03, 0.3) }}
          className="group transition-colors hover:bg-muted/30 border-b border-border/50"
        >
          <TableCell className="w-10">
            <input
              type="checkbox"
              checked={selected.includes(a.id)}
              onChange={() => toggleId(a.id)}
              className="h-4 w-4 rounded border-muted-foreground/30 cursor-pointer accent-primary"
            />
          </TableCell>
          <TableCell className="font-mono text-sm">
            <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">{a.asset_code}</Link>
          </TableCell>
          <TableCell className="font-medium">{a.asset_name}</TableCell>
          <TableCell className="text-muted-foreground">{a.category_name}</TableCell>
          <TableCell><Badge value={a.status} /></TableCell>
          <TableCell><Badge value={a.condition} /></TableCell>
          <TableCell className="text-muted-foreground">{a.location_name}</TableCell>
          <TableCell className="text-muted-foreground">{a.assigned_user_name}</TableCell>
          <TableCell className="w-8">
            <OpenSplitButton tab={{ id: a.id, type: "asset", label: a.asset_name }} />
          </TableCell>
        </motion.tr>
      ))}
      <BulkActionBar selectedIds={selected} onClear={clear} resource="/api/assets" resourceLabel="assets" />
    </>
  );
}

