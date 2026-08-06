"use client";

import { motion } from "motion/react";

const statusMap: Record<string, { dot: string; bg: string; label?: string }> = {
  available: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  assigned: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  reserved: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20" },
  in_repair: { dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-400/20" },
  retired: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  lost: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20" },
  disposed: { dot: "bg-gray-400", bg: "bg-slate-100 text-slate-500 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  new: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  good: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  fair: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20" },
  damaged: { dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-400/20" },
  critical: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20" },
  draft: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  submitted: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  pending_approval: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20" },
  approved: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  rejected: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20" },
  in_progress: { dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20" },
  completed: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  cancelled: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  low: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  medium: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  high: { dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-400/20" },
  urgent: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20" },
  active: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  inactive: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
  new_asset: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  replacement: { dot: "bg-violet-500", bg: "bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20" },
  temporary_loan: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20" },
  "return": { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  repair: { dot: "bg-orange-500", bg: "bg-orange-50 text-orange-700 ring-orange-600/10 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-400/20" },
  assign: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  create: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20" },
  update: { dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/20" },
  delete: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20" },
  open: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20" },
  waiting_vendor: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20" },
  closed: { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500 ring-slate-600/10 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20" },
};

const defaultStyle = { dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600 ring-slate-600/10" };

export function Badge({ label, value }: { label?: string; value?: string | null }) {
  const val = value ?? "";
  const style = statusMap[val] ?? defaultStyle;
  const text = label ?? (val ? val.replace(/_/g, " ") : "-");
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 450, damping: 22 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 cursor-default select-none ${style.bg}`}
    >
      <span className={`status-dot ${style.dot}`} />
      {text}
    </motion.span>
  );
}
