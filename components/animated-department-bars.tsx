"use client";

import { motion } from "motion/react";

interface DeptAssetCount {
  name: string;
  count: number;
}

export function AnimatedDepartmentBars({
  departments,
  maxCount,
}: {
  departments: DeptAssetCount[];
  maxCount: number;
}) {
  return (
    <div className="space-y-5">
      {departments.map((d, index) => {
        const pct = (d.count / maxCount) * 100;
        return (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{d.name}</span>
              <span className="text-xs font-semibold text-muted-foreground">{d.count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.15 + index * 0.08,
                }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 dark:from-blue-500 dark:to-cyan-400 shadow-xs"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
