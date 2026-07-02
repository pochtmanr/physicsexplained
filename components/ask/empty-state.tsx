"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PROMPTS = [
  "Explain Noether's theorem like I'm 16",
  "Show me a pendulum losing energy to damping",
  "What's the difference between a capacitor and a conductor?",
  "Plot y = sin(x)/x from -10 to 10",
  "Why do planets move in ellipses?",
  "What is isochronism?",
];

function greetingFor(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function EmptyState({
  onPick,
  userName,
}: {
  onPick: (q: string) => void;
  userName: string | null;
}) {
  const [greeting, setGreeting] = useState<string>(() => greetingFor(new Date().getHours()));
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  return (
    <div className="text-center max-w-3xl mx-auto px-4">
      <h1 className="text-2xl md:text-3xl tracking-tight text-[var(--color-fg-0)]">
        {greeting}
        {userName ? (
          <>
            {" "}
            <span className="font-display italic text-[var(--color-cyan)]">
              {userName}
            </span>
          </>
        ) : null}
        , what do you want to learn today?
      </h1>
      <div className="mt-10 hidden md:grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
        {PROMPTS.map((p) => (
          <Button
            key={p}
            variant="ghost"
            onClick={() => onPick(p)}
            className="!h-auto min-h-11 justify-start px-4 py-3 normal-case tracking-normal font-sans text-start opacity-45 hover:opacity-100 focus-visible:opacity-100 transition-[opacity,box-shadow,background-color,border-color,color,transform] duration-200"
          >
            <span className="text-sm leading-relaxed">{p}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
