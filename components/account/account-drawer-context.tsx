"use client";
import { createContext, useContext, useState } from "react";

interface Ctx {
  open: boolean;
  tab: "profile" | "billing";
  openDrawer: (tab?: "profile" | "billing") => void;
  closeDrawer: () => void;
  setTab: (t: "profile" | "billing") => void;
}

const DrawerCtx = createContext<Ctx | null>(null);

export function AccountDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"profile" | "billing">("profile");
  return (
    <DrawerCtx.Provider value={{
      open, tab,
      openDrawer: (t) => { if (t) setTab(t); setOpen(true); },
      closeDrawer: () => setOpen(false),
      setTab,
    }}>
      {children}
    </DrawerCtx.Provider>
  );
}

export function useAccountDrawer(): Ctx {
  const v = useContext(DrawerCtx);
  if (!v) throw new Error("useAccountDrawer must be used within AccountDrawerProvider");
  return v;
}
