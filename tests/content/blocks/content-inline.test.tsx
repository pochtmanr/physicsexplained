// tests/content/blocks/content-inline.test.tsx
import { vi } from "vitest";

// Stub the Supabase env vars before any module below this is imported, so that
// the supabase client in lib/supabase.ts (transitively pulled by the real
// PhysicistLink/Term modules) doesn't throw during test-file evaluation.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test-key";
});

// PhysicistLink is an async Server Component that fetches localized data;
// stub it with a sync anchor so we can assert that ContentInline routes
// `{ kind: "physicist" }` to it with the right slug/text. The real component
// has its own dedicated test coverage.
vi.mock("@/components/content/physicist-link", () => ({
  PhysicistLink: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/physicists/${slug}`}>{children ?? slug}</a>
  ),
}));

// Term is sync but pulls supabase transitively. Stub for the same wiring-only
// reason; Term has its own test coverage.
vi.mock("@/components/content/term", () => ({
  Term: ({ slug, children }: { slug: string; children?: React.ReactNode }) => (
    <a href={`/dictionary/${slug}`}>{children ?? slug}</a>
  ),
}));

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { Inline } from "@/lib/content/blocks";
import { ContentInline } from "@/components/content/content-inline";

// globals: false in vitest.config → auto-cleanup is off; clean the DOM manually.
afterEach(() => cleanup());

function renderInlines(inlines: Inline[]) {
  return render(<ContentInline inlines={inlines} />);
}

describe("<ContentInline>", () => {
  it("renders a bare string", () => {
    renderInlines(["hello world"]);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders an em span", () => {
    const { container } = renderInlines([{ kind: "em", text: "note" }]);
    expect(container.querySelector("em")?.textContent).toBe("note");
  });

  it("renders a strong span", () => {
    const { container } = renderInlines([{ kind: "strong", text: "key" }]);
    expect(container.querySelector("strong")?.textContent).toBe("key");
  });

  it("renders an external link", () => {
    renderInlines([{ kind: "link", href: "https://example.org", text: "here" }]);
    const a = screen.getByRole("link", { name: "here" });
    expect(a.getAttribute("href")).toBe("https://example.org");
  });

  it("renders a physicist inline as a PhysicistLink", () => {
    renderInlines([{ kind: "physicist", slug: "galileo-galilei", text: "Galileo" }]);
    const a = screen.getByRole("link", { name: "Galileo" });
    expect(a.getAttribute("href")).toContain("/physicists/galileo-galilei");
  });

  it("renders a term inline as a Term link", () => {
    renderInlines([{ kind: "term", slug: "isochronism" }]);
    const a = screen.getByRole("link");
    expect(a.getAttribute("href")).toContain("/dictionary/isochronism");
  });
});
