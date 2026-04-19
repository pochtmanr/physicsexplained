"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  content: ReactNode;
}

export function HoverCard({ children, content }: HoverCardProps) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setAbove(rect.top > 200);
      }
      setVisible(true);
    }, 200);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  return (
    <span
      ref={triggerRef}
      className="relative inline"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 z-50 max-w-xs w-max rounded-lg border border-[var(--color-fg-4)] bg-[var(--color-bg-1)] p-4 shadow-xl backdrop-blur-sm text-sm leading-relaxed animate-[fadeIn_120ms_ease-out] ${
            above ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {content}
        </span>
      )}
    </span>
  );
}
