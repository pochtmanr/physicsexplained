"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, X } from "lucide-react";
import { ProfileChip } from "@/components/auth/profile-chip";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConversationRow } from "./conversation-row";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const MobileChatRailCtx = createContext<Ctx | null>(null);

export function useMobileChatRail() {
  const ctx = useContext(MobileChatRailCtx);
  if (!ctx) throw new Error("useMobileChatRail must be used inside MobileChatRailProvider");
  return ctx;
}

export function MobileChatRailProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileChatRailCtx.Provider value={{ open, setOpen }}>{children}</MobileChatRailCtx.Provider>
  );
}

export function MobileChatRailTrigger() {
  const { setOpen } = useMobileChatRail();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen(true)}
      aria-label="Show chat list"
      className="md:hidden shrink-0 !h-9 !w-9"
    >
      <ChevronRight size={16} strokeWidth={2} aria-hidden="true" className="rtl:-scale-x-100" />
    </Button>
  );
}

interface RailProps {
  locale: string;
  conversations: Array<{ id: string; title: string | null; updated_at: string; starred: boolean }>;
  activeId?: string;
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  planLabel: string;
  percentUsed: number;
}

export function MobileChatRail({
  locale,
  conversations,
  activeId,
  user,
  planLabel,
  percentUsed,
}: RailProps) {
  const { open, setOpen } = useMobileChatRail();
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), [setOpen]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div
      className={`md:hidden fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-[var(--color-bg-0)]/70 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel — slides in from start (left LTR / right RTL) */}
      <aside
        role="dialog"
        aria-label="Chat history"
        className={`absolute inset-y-0 start-0 flex w-[82vw] max-w-[320px] flex-col border-e border-[var(--color-fg-4)] bg-[var(--color-bg-0)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rtl:[transform-origin:right] ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--color-fg-4)] p-2">
          <Link
            href={`/${locale}/ask`}
            onClick={close}
            className={buttonVariants({
              variant: "primary",
              size: "cta",
              className: "nav-link min-w-0 flex-1 gap-1.5 px-3 py-2 text-xs",
            })}
          >
            <PlusIcon size={14} />
            <span>New Chat</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close chat list"
            className="shrink-0 !h-8 !w-8"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>

        <ul className="flex-1 overflow-y-auto py-2">
          {conversations.length === 0 && (
            <li className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-3)]">
              No chats yet
            </li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <ConversationRow conv={c} locale={locale} active={c.id === activeId} />
            </li>
          ))}
        </ul>

        <ProfileChip
          user={user}
          planLabel={planLabel}
          percentUsed={percentUsed}
        />
      </aside>
    </div>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
