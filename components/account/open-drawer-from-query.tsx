"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccountDrawer } from "./account-drawer-context";

export function OpenDrawerFromQuery() {
  const sp = useSearchParams();
  const { openDrawer } = useAccountDrawer();
  useEffect(() => {
    const tab = sp.get("drawer");
    if (tab === "profile" || tab === "billing") openDrawer(tab);
  }, [sp, openDrawer]);
  return null;
}
