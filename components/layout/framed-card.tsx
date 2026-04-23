import styles from "@/components/sections/section-frame.module.css";

interface Props {
  /** Optional eyebrow label rendered above the top-left of the frame, e.g. "FIG.01 · THE EPICYCLE". */
  figLabel?: string;
  /** Extra classes for the outer shell (positioning, width). */
  className?: string;
  /** Extra classes for the inner content container (padding overrides, etc). */
  innerClassName?: string;
  children: React.ReactNode;
}

/**
 * Reusable hairline shell with four corner-square accents — the framed-figure
 * chrome used across the site. Pass `figLabel` to render a small mono eyebrow
 * above the top-left corner (the "FIG.XX" treatment used on scene cards).
 */
export function FramedCard({ figLabel, className, innerClassName, children }: Props) {
  return (
    <div className={`${styles.shell} relative${className ? ` ${className}` : ""}`}>
      <span className={`${styles.shellCorner} ${styles.scTl}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scTr}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scBl}`} aria-hidden="true" />
      <span className={`${styles.shellCorner} ${styles.scBr}`} aria-hidden="true" />
      {figLabel ? (
        <div className="pointer-events-none absolute -top-4 start-0 px-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-cyan-dim)]">
          {figLabel}
        </div>
      ) : null}
      <div className={`${styles.shellInner} p-4 md:p-6${innerClassName ? ` ${innerClassName}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
