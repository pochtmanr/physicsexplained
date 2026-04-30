/**
 * Pre-parse normalizer. Converts common student input forms into
 * mathjs-parseable expressions. Used by `verifyStep` before parsing.
 *
 * Conventions:
 *   - `pi`, `π` → `PI` (mathjs constant)
 *   - `**` → `^`
 *   - `45°` → `45*deg`
 *   - `30cos(x)` → `30*cos(x)` (implicit multiplication)
 *   - `vx = ... = 21.2` → `21.2` (drop equals-tail)
 *   - trig function names lowercased
 *   - trailing unit token stripped (e.g. `m/s`, `deg`, `rad`, `Hz`)
 */

const TRIG = /\b(SIN|COS|TAN|ASIN|ACOS|ATAN|SINH|COSH|TANH|LOG|LN|SQRT|EXP|ABS)\b/gi;
const TRAIL_UNITS = /\s+(m\/s\^?2?|m\/s|m|km|cm|mm|s|ms|N|J|W|Hz|deg|rad|kg|g)\s*$/i;

export function normalizeStudentExpr(raw: string): string {
  let s = raw.trim();
  if (!s) return "";

  // Drop everything before the LAST `=` so "vx = 30cos(45) = 21.2" → "21.2".
  const lastEq = s.lastIndexOf("=");
  if (lastEq >= 0) s = s.slice(lastEq + 1).trim();

  // Strip trailing unit token.
  s = s.replace(TRAIL_UNITS, "");

  // pi / π → PI.
  s = s.replace(/π/g, "PI").replace(/\bpi\b/g, "PI");

  // ** → ^.
  s = s.replace(/\*\*/g, "^");

  // 45° → 45*deg.
  s = s.replace(/°/g, "*deg");

  // Lowercase trig and other math function names.
  s = s.replace(TRIG, (m) => m.toLowerCase());

  // Implicit multiplication: digit/closeparen followed by letter or openparen.
  // Run twice to catch chains like "2pi r" → "2*pi*r".
  for (let i = 0; i < 2; i++) {
    s = s.replace(/([0-9)])\s*([a-zA-Z_(])/g, "$1*$2");
  }

  // Implicit multiplication: identifier followed directly by `(`.
  s = s.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\(/g, (match, name) => {
    // Don't insert `*` after a known function name.
    const known = new Set([
      "sin","cos","tan","asin","acos","atan","sinh","cosh","tanh",
      "log","ln","sqrt","exp","abs","min","max","atan2",
    ]);
    return known.has(name) ? `${name}(` : `${name}*(`;
  });

  // Collapse repeated whitespace.
  s = s.replace(/\s+/g, " ");

  return s.trim();
}
