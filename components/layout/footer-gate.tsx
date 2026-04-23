"use client";
import { usePathname } from "next/navigation";

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const hide = segments.includes("ask");
  if (hide) return null;
  return <>{children}</>;
}
