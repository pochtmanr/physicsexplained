import { forwardRef } from "react";
import { clsx } from "clsx";

/**
 * Shared button styling for the whole UI. Controls read as raised panel keycaps
 * — a faint top-edge highlight + soft drop shadow at rest (--shadow-control),
 * a lift + glow on hover, and a 1px press on click — on the oscilloscope-panel
 * identity (cyan phosphor accent, hairline borders, the .btn-tracer sweep).
 *
 * Exported as both a `<button>` component and a `buttonVariants()` class string,
 * so the many `<Link>`-as-button call sites can share the exact same styling:
 *   <Link className={buttonVariants({ variant: "primary", size: "cta" })} />
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "icon"
  | "danger"
  | "danger-solid";
export type ButtonSize = "sm" | "icon" | "icon-lg" | "cta" | "cta-row" | "hero";

const BASE =
  "btn-tracer group relative inline-flex items-center justify-center gap-2 " +
  "font-mono uppercase tracking-wider rounded-[var(--radius-control)] " +
  "transition-[box-shadow,background-color,border-color,color,transform] " +
  "duration-[var(--duration-fast)] ease-out active:translate-y-px " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)]/50 " +
  "disabled:opacity-60 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  // Filled cyan with a resting phosphor glow — the primary CTA. The transparent
  // border keeps padding-sized buttons the same height as bordered variants.
  primary:
    "border border-transparent bg-[var(--color-cyan)] !text-white shadow-[var(--shadow-control-primary)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-cyan)_92%,white)] " +
    "hover:shadow-[var(--shadow-control-primary-hover)]",
  // Cyan outline over a faint cyan surface fill — secondary actions.
  secondary:
    "border border-[var(--color-cyan)] text-[var(--color-cyan)] " +
    "bg-[color-mix(in_srgb,var(--color-cyan)_7%,transparent)] shadow-[var(--shadow-control)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-cyan)_14%,transparent)] " +
    "hover:shadow-[var(--shadow-control-hover)]",
  // Hairline chrome over a faint neutral fill — nav controls.
  ghost:
    "border border-[var(--color-fg-4)] text-[var(--color-fg-1)] " +
    "bg-[color-mix(in_srgb,var(--color-fg-4)_22%,transparent)] shadow-[var(--shadow-control)] " +
    "hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] " +
    "hover:shadow-[var(--shadow-control-hover)]",
  // Same chrome as ghost, used with the square `icon` size.
  icon:
    "border border-[var(--color-fg-4)] text-[var(--color-fg-1)] " +
    "bg-[color-mix(in_srgb,var(--color-fg-4)_22%,transparent)] shadow-[var(--shadow-control)] " +
    "hover:border-[var(--color-cyan-dim)] hover:text-[var(--color-cyan-dim)] " +
    "hover:shadow-[var(--shadow-control-hover)]",
  // Magenta outline over a faint magenta fill — destructive secondary actions
  // (sign out, delete-all-chats, cancel). Mirrors `secondary` with the warning hue.
  danger:
    "border border-[var(--color-magenta)] text-[var(--color-magenta)] " +
    "bg-[color-mix(in_srgb,var(--color-magenta)_7%,transparent)] shadow-[var(--shadow-control)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-magenta)_14%,transparent)] " +
    "hover:shadow-[var(--shadow-control-hover)]",
  // Filled magenta with a resting glow — the confirm step of a destructive action.
  // Mirrors `primary` with the warning hue.
  "danger-solid":
    "border border-transparent bg-[var(--color-magenta)] !text-white shadow-[var(--shadow-control-danger)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-magenta)_92%,white)] " +
    "hover:shadow-[var(--shadow-control-danger-hover)]",
};

// Pressed-in keycap for segmented toggles when selected — a cyan surface fill with
// an inset shadow (the inverse of the raised resting bevel). Inactive toggles fall
// back to the `ghost` chrome.
const ACTIVE =
  "border border-[var(--color-cyan)] text-[var(--color-cyan)] " +
  "bg-[color-mix(in_srgb,var(--color-cyan)_18%,transparent)] " +
  "shadow-[inset_0_2px_4px_-1px_color-mix(in_srgb,var(--color-cyan)_35%,transparent)]";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-6 px-3 text-xs md:h-8",
  icon: "h-6 w-6 md:h-8 md:w-8",
  "icon-lg": "h-9 w-9",
  cta: "px-4 py-2 text-xs md:px-6 md:py-3 md:text-sm",
  // Landing-section CTA — a full-width keycap row on mobile (same px-4/py-3
  // metrics as the mobile-nav drawer rows), collapsing to the compact `sm`
  // chrome from md up.
  "cta-row": "w-full px-4 py-3 text-xs md:w-auto md:h-8 md:px-3 md:py-0",
  // Hero CTA — `cta-row` on mobile, but keeps the prominent `cta` metrics
  // from md up so it outweighs the nav chrome instead of matching it.
  hero: "w-full px-4 py-3 text-xs md:w-auto md:px-6 md:text-sm",
};

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Toggle state for segmented controls. When set, the button renders the
   * pressed-in `ACTIVE` look while `true` and the `ghost` chrome while `false`
   * (ignoring `variant`). Leave `undefined` for normal, non-toggle buttons.
   */
  active?: boolean;
  className?: string;
}

export function buttonVariants({
  variant = "ghost",
  size = "sm",
  active,
  className,
}: ButtonVariantsOptions = {}): string {
  const look =
    active === undefined ? VARIANTS[variant] : active ? ACTIVE : VARIANTS.ghost;
  return clsx(BASE, look, SIZES[size], className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Toggle state — renders the pressed-in look and sets `aria-pressed`. */
  active?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, active, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={buttonVariants({ variant, size, active, className })}
      {...props}
    />
  ),
);

Button.displayName = "Button";
