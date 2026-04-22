"use client";
import { useState } from "react";
import { Composer } from "@/components/ask/composer";
import { EmptyState } from "@/components/ask/empty-state";

export default function AskLanding() {
  const [seed, setSeed] = useState<string | null>(null);
  return (
    <div className="flex flex-col flex-1">
      {!seed && (
        <div className="flex-1 flex items-center justify-center p-6">
          <EmptyState onPick={setSeed} />
        </div>
      )}
      <div className="p-4 border-t">
        <Composer conversationId={null} initialMessage={seed ?? undefined} />
      </div>
    </div>
  );
}
