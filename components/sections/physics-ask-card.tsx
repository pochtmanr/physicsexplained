import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./physics-ask-card.module.css";

type Variant = "default" | "inverted" | "accent";

interface PhysicsAskCardProps {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  pill: string;
  variant?: Variant;
  background: ReactNode;
  className?: string;
}

export function PhysicsAskCard({
  href,
  eyebrow,
  title,
  body,
  pill,
  variant = "default",
  background,
  className,
}: PhysicsAskCardProps) {
  const variantClass =
    variant === "inverted"
      ? styles.inverted
      : variant === "accent"
        ? styles.accent
        : "";

  return (
    <Link
      href={href}
      className={[styles.card, variantClass, className].filter(Boolean).join(" ")}
    >
      {background}
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.copy}>{body}</p>
        <div className={styles.pillRow}>
          <span className={styles.pill}>{pill}</span>
        </div>
      </div>
    </Link>
  );
}
