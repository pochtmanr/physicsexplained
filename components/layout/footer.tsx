import Link from "next/link";
import { GitBranch, User, BookOpen, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "./logo";
import { WIDE_CONTAINER } from "@/lib/layout";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const navLinkClass =
  "nav-link inline-flex items-center gap-2 border border-[var(--color-fg-3)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-fg-1)] transition-colors hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)]";

export async function Footer() {
  const t = await getTranslations("common.footer");

  const NAV_LINKS = [
    { href: "/#branches", label: t("branches"), icon: GitBranch },
    { href: "/physicists", label: t("physicists"), icon: User },
    { href: "/dictionary", label: t("dictionary"), icon: BookOpen },
  ] as const;

  const LEGAL_LINKS = [
    { href: "/privacy", label: t("privacyPolicy") },
    { href: "/terms", label: t("termsOfService") },
    { href: "/cookies", label: t("cookiePolicy") },
  ] as const;

  return (
    <footer className="border-t border-[var(--color-fg-3)]/40 mt-12">
      <div className={`${WIDE_CONTAINER} py-16`}>
        {/* Logo + socials row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 font-display text-xl">
            <Logo className="h-6 w-auto" />
            <div>
              <span className="text-[var(--color-fg-0)] font-semibold">
                Physics.
              </span>
              <span className="text-[var(--color-cyan)] font-semibold">
                explained
              </span>
            </div>
          </Link>

          {/* GitHub star + socials */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/pochtmanr/physicsexplained"
              target="_blank"
              rel="noopener noreferrer"
              className={navLinkClass}
            >
              <Star className="h-3.5 w-3.5" />
              {t("starOnGithub")}
            </a>
            <a
              href="https://www.linkedin.com/in/romanpochtman/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://x.com/RPochtman"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[var(--color-fg-2)] transition-colors hover:text-[var(--color-cyan)]"
              aria-label="X (Twitter)"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Nav + Newsletter row */}
        <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Navigation links */}
          <nav className="flex flex-wrap gap-3" aria-label="Footer navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={navLinkClass}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Newsletter */}
          <NewsletterForm />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--color-fg-3)]/40 mt-12 pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Legal links */}
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-mono text-xs text-[var(--color-fg-2)] transition-colors duration-[var(--duration-fast)] hover:text-[var(--color-fg-1)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="font-mono text-xs text-[var(--color-fg-2)]">
            &copy; 2026{" "}
            <a
              href="https://www.simnetiq.store/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--color-cyan)]"
            >
              Simnetiq Ltd
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
