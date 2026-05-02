import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./physics-ask-card.module.css";

type Variant = "default" | "inverted" | "accent";
type Tone = "ask" | "play";

interface PhysicsAskCardProps {
  href: string;
  /** Numbered eyebrow above the title (e.g. "01 / ASK"). */
  eyebrow: string;
  /** Optional product label that sits opposite the eyebrow (e.g. "PHYSICS.ASK", "PLAYGROUNDS"). */
  kicker?: string;
  title: string;
  body: string;
  variant?: Variant;
  /** Visual accent — controls the kicker color so playground cards can sit beside ask cards without color collision. */
  tone?: Tone;
  background: ReactNode;
  /** When true, the body text gets a translucent backdrop so an underlying image can show through unfiltered. */
  imageBleed?: boolean;
  className?: string;
}

export function PhysicsAskCard({
  href,
  eyebrow,
  kicker,
  title,
  body,
  variant = "default",
  tone = "ask",
  background,
  imageBleed = false,
  className,
}: PhysicsAskCardProps) {
  const variantClass =
    variant === "inverted"
      ? styles.inverted
      : variant === "accent"
        ? styles.accent
        : "";

  const toneClass = tone === "play" ? styles.tonePlay : styles.toneAsk;

  return (
    <Link
      href={href}
      className={[
        styles.card,
        variantClass,
        toneClass,
        imageBleed ? styles.imageBleed : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {background}
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          {kicker ? <span className={styles.kicker}>{kicker}</span> : null}
          <span aria-hidden="true" className={styles.arrow}>
            →
          </span>
        </div>
        <div className={imageBleed ? styles.copyBlock : undefined}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.copy}>{body}</p>
        </div>
      </div>
    </Link>
  );
}
