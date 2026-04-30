"use client";
import { usePathname } from "next/navigation";

const HIDDEN_SEGMENTS: string[] = [];

export function NavGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const hide = segments.some((s) => HIDDEN_SEGMENTS.includes(s));
  if (hide) return null;
  return <>{children}</>;
}
