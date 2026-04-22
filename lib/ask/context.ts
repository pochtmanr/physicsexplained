export interface HistoryMsg { role: "user" | "assistant"; text: string }

export interface AssembledHistory {
  systemTail: string;
  kept: HistoryMsg[];
  droppedCount: number;
}

const KEEP_TURNS = 12; // 6 user+assistant pairs

export function assembleHistory(
  msgs: HistoryMsg[],
  priorSummary: string | null | undefined,
): AssembledHistory {
  const kept = msgs.slice(-KEEP_TURNS);
  const droppedCount = Math.max(0, msgs.length - kept.length);
  const tailParts: string[] = [];
  if (priorSummary) tailParts.push(`Prior-conversation summary:\n${priorSummary}`);
  return { systemTail: tailParts.join("\n\n"), kept, droppedCount };
}
