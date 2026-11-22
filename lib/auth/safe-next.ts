/**
 * Sanitise a post-login `next` parameter so it can only point at a path on
 * this site. Anything that a browser could resolve to another origin
 * (`//evil.com`, `/\evil.com`, absolute URLs, control characters) falls back
 * to "/".
 */
export function safeNextPath(next: string | null | undefined, origin: string): string {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  // Browsers treat "\" like "/" in URLs; tabs/newlines are stripped before parsing.
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return "/";
  try {
    const base = new URL(origin).origin;
    const resolved = new URL(next, origin);
    if (resolved.origin !== base) return "/";
    const out = `${resolved.pathname}${resolved.search}${resolved.hash}`;
    // Check the value we return, not just the input: URL normalisation can
    // turn "/.//evil.com" into "//evil.com", which a later `new URL(out, …)`
    // or a browser would read as another host.
    if (!out.startsWith("/") || out.startsWith("//")) return "/";
    if (new URL(out, origin).origin !== base) return "/";
    return out;
  } catch {
    return "/";
  }
}
