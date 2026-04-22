// Client-side parser: splits assistant prose on :::scene, :::plot, :::cite fences.
export type FencePart =
  | { kind: "text"; text: string }
  | { kind: "scene"; id: string; params: Record<string, unknown> }
  | { kind: "plot"; plotId: string; args: Record<string, unknown> }
  | { kind: "cite"; targetKind: "topic" | "physicist" | "glossary"; slug: string };

const FENCE_RE = /:::(scene|plot|cite)\{([^}]*)\}\n:::/g;

export function parseFences(input: string): FencePart[] {
  const out: FencePart[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(input)) !== null) {
    if (m.index > lastIdx) out.push({ kind: "text", text: input.slice(lastIdx, m.index) });
    const part = parseOne(m[1] as "scene" | "plot" | "cite", m[2]);
    out.push(part ?? { kind: "text", text: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < input.length) out.push({ kind: "text", text: input.slice(lastIdx) });
  return out.length ? out : [{ kind: "text", text: input }];
}

function parseOne(kind: "scene" | "plot" | "cite", attrs: string): FencePart | null {
  const obj: Record<string, unknown> = {};
  const re = /(\w+)=("(?:[^"\\]|\\.)*"|true|false|-?\d+(?:\.\d+)?|\[[^\]]*\]|\{[^}]*\})/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(attrs)) !== null) {
    try { obj[mm[1]] = JSON.parse(mm[2]); } catch { return null; }
  }
  if (kind === "scene") {
    if (typeof obj.id !== "string") return null;
    const { id, ...rest } = obj;
    return { kind: "scene", id: id as string, params: rest };
  }
  if (kind === "plot") {
    if (typeof obj.plotId !== "string") return null;
    const { plotId, ...rest } = obj;
    return { kind: "plot", plotId: plotId as string, args: rest };
  }
  if (kind === "cite") {
    if (typeof obj.kind !== "string" || typeof obj.slug !== "string") return null;
    if (!["topic", "physicist", "glossary"].includes(obj.kind as string)) return null;
    return { kind: "cite", targetKind: obj.kind as "topic" | "physicist" | "glossary", slug: obj.slug as string };
  }
  return null;
}
