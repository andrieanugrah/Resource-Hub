"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/animated-counter";
import {
  Package2,
  CheckCircle2,
  UserCheck,
  Wrench,
  ClipboardList,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  package: Package2,
  check: CheckCircle2,
  "user-check": UserCheck,
  wrench: Wrench,
  clipboard: ClipboardList,
  shield: ShieldAlert,
};

export interface KpiCardData {
  label: string;
  value: number;
  iconKey: string;
  accent: string;
  dot: string;
  link: string;
}

export function AnimatedKpiCards({ cards }: { cards: KpiCardData[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((c, i) => {
        const Icon = ICON_MAP[c.iconKey] ?? Package2;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
              delay: i * 0.04,
            }}
            whileHover={{ y: -2 }}
            className="h-full will-change-transform transform-gpu"
          >
            <Link href={c.link} className="block h-full">
              <Card className="group/card relative overflow-hidden rounded-2xl border-0 bg-card shadow-(--shadow-card) hover:shadow-(--shadow-card-hover) h-full">
                <div className={`absolute inset-0 bg-linear-to-br ${c.accent} opacity-60 transition-opacity duration-200 group-hover/card:opacity-90`} />
                <CardContent className="relative p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${c.accent} ring-1 ring-inset ring-white/50 shadow-xs`}>
                      <Icon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  </div>
                  <AnimatedCounter value={c.value} className="text-2xl font-bold text-foreground tracking-tight" />
                  <div className="mt-0.5 text-[12px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{c.label}</div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
