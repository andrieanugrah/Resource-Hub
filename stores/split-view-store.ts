import { create } from "zustand";

export interface SplitTab {
  id: string;
  type: "asset" | "request" | "user" | "maintenance" | "audit-log";
  label: string;
}

interface SplitViewStore {
  tabs: SplitTab[];
  activeTabId: string | null;
  openTab: (tab: SplitTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAll: () => void;
}

export const useSplitViewStore = create<SplitViewStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) => {
    const { tabs } = get();
    const exists = tabs.find((t) => t.id === tab.id && t.type === tab.type);
    if (exists) {
      set({ activeTabId: tab.id });
    } else {
      set({ tabs: [...tabs, tab], activeTabId: tab.id });
    }
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const next = tabs.filter((t) => t.id !== id);
    if (activeTabId === id) {
      const idx = tabs.findIndex((t) => t.id === id);
      const newActive = next[Math.min(idx, next.length - 1)]?.id ?? null;
      set({ tabs: next, activeTabId: newActive });
    } else {
      set({ tabs: next });
    }
  },

  setActiveTab: (id) => set({ activeTabId: id }),
  closeAll: () => set({ tabs: [], activeTabId: null }),
}));
