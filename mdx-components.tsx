import type { MDXComponents } from "mdx/types";
import { PhysicistLink } from "@/components/content/physicist-link";
import { Term } from "@/components/content/term";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    PhysicistLink,
    Term,
  };
}
