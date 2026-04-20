import { Logo } from "./logo";

export function PageLoader({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-6 px-6 py-24"
    >
      <Logo
        className="h-14 w-auto motion-safe:animate-[page-loader-spin_2.4s_linear_infinite] motion-safe:[animation-play-state:running]"
      />
      {label ? (
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-2)] motion-safe:animate-[page-loader-pulse_1.8s_ease-in-out_infinite]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
