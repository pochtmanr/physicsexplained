import type { MathNode } from "mathjs";

/**
 * Allow-list check for mathjs expression trees that come from outside the
 * codebase (student answers, model-written plot expressions).
 *
 * The full mathjs namespace can allocate without bound from a few characters:
 * `1:1e9` (RangeNode), `zeros (30000,30000)`, matrix literals. It also exposes
 * `import` and `createUnit`, which mutate the shared instance. A deny-list
 * cannot keep up with that surface, so only scalar arithmetic is let through:
 * numbers, symbols, operators, parentheses and calls to the functions below.
 */

const BASE_NODE_TYPES = new Set([
  "ConstantNode",
  "SymbolNode",
  "OperatorNode",
  "ParenthesisNode",
  "FunctionNode",
]);

export const SAFE_MATH_FUNCTIONS: ReadonlySet<string> = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "sec", "csc", "cot",
  "exp", "expm1", "log", "log10", "log2", "log1p",
  "sqrt", "cbrt", "nthRoot", "pow", "square", "cube", "hypot",
  "abs", "sign", "floor", "ceil", "round", "mod",
  "min", "max",
  "erf", "gamma", "factorial",
]);

export interface SafeExprOptions {
  /** Node types allowed on top of plain scalar arithmetic. */
  extraNodeTypes?: readonly string[];
}

export type SafeExprResult = { ok: true } | { ok: false; reason: string };

export function checkSafeExpr(root: MathNode, opts: SafeExprOptions = {}): SafeExprResult {
  const extra = new Set(opts.extraNodeTypes ?? []);
  let reason: string | null = null;

  root.traverse((node) => {
    if (reason) return;
    if (!BASE_NODE_TYPES.has(node.type) && !extra.has(node.type)) {
      reason = `unsupported syntax (${node.type})`;
      return;
    }
    if (node.type === "FunctionNode") {
      // `fn` is a SymbolNode for ordinary calls; anything else (an accessor,
      // a parenthesised expression) is a computed callee.
      const fn = (node as unknown as { fn?: { type?: string; name?: string } }).fn;
      const name = fn?.type === "SymbolNode" ? fn.name : undefined;
      if (!name || !SAFE_MATH_FUNCTIONS.has(name)) {
        reason = `unsupported function${name ? ` "${name}"` : ""}`;
      }
    }
  });

  return reason ? { ok: false, reason } : { ok: true };
}
