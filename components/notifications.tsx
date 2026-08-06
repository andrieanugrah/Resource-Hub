"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useIsMounted } from "@/components/use-is-mounted";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Notification } from "@/lib/db";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/app/api-client";

const TYPE_CLASSES: Record<string, string> = {
  request: "bg-blue-500",
  maintenance: "bg-amber-500",
  asset: "bg-emerald-500",
  system: "bg-violet-500",
};

export default function NotificationsBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mounted = useIsMounted();
  const { toast } = useToast();

  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    apiClient("/api/notifications")
      .then((r) => r.json())
      .then((d: Notification[]) => setNotifs(d))
      .catch(() => setError("Failed to load notifications"));
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

async function markAllRead() {
    await apiClient("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
    toast("All notifications marked as read", "success");
  }

  const unread = notifs.filter((n) => !n.read).length;
  const display = notifs.slice(0, 10);

  const [panelStyle, setPanelStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  useEffect(() => {
    function updatePosition() {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPanelStyle({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    }
    if (open) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
  }, [open]);

  const panel = mounted ? createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(4px)", transition: { duration: 0.15 } }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-50 w-80 rounded-2xl border-0 bg-white/80 backdrop-blur-xl supports-backdrop-filter:bg-white/70 shadow-(--shadow-modal) overflow-hidden ring-1 ring-border/50 origin-top-right"
          style={panelStyle}
          ref={panelRef}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            {unread > 0 && (
              <motion.button
                onClick={markAllRead}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </motion.button>
            )}
          </div>

          {error && (
            <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}

          {!error && (
            <>
              {display.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/60">You&apos;ll see updates here</p>
                </div>
              ) : (
                <div className="max-h-90 overflow-y-auto">
                  {display.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={!n.read ? { backgroundColor: "rgba(59,130,246,0.06)" } : {}}
                      animate={{ backgroundColor: "rgba(0,0,0,0)" }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Link
                          href={n.link}
                          onClick={() => setOpen(false)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors border-b last:border-b-0 ${
                            !n.read ? "bg-muted/20" : ""
                          }`}
                        >
                          <motion.span
                            animate={!n.read ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.4 }}
                            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${TYPE_CLASSES[n.type] ?? "bg-muted-foreground/30"} ${!n.read ? "" : "opacity-30"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="relative flex items-center rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}

