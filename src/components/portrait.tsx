import { Lock } from "lucide-react";
import { cn, hueFromSeed, initials } from "@/lib/utils";

type PortraitProps = {
  name: string;
  seed: string;
  variant?: number;
  blurred?: boolean;
  watermark?: string;
  className?: string;
  rounded?: string;
  showLock?: boolean;
  lockLabel?: string;
};

/**
 * A generated, privacy-safe portrait placeholder. Real photo uploads go to
 * private S3 + signed URLs (see docs/02-architecture.md §5.2); this keeps the
 * demo free of other people's faces while preserving the product's photo
 * privacy behaviour (blur until match, viewer watermark).
 */
export function Portrait({
  name,
  seed,
  variant = 0,
  blurred = false,
  watermark,
  className,
  rounded = "rounded-3xl",
  showLock = false,
  lockLabel,
}: PortraitProps) {
  const hue = (hueFromSeed(seed) + variant * 23) % 360;
  const bg = `radial-gradient(120% 110% at 22% 12%, hsl(${hue} 45% 86%) 0%, hsl(${(hue + 16) % 360} 40% 72%) 42%, hsl(${(hue + 30) % 360} 34% 52%) 100%)`;
  const ink = `hsl(${(hue + 18) % 360} 38% 30%)`;

  return (
    <div
      className={cn("relative isolate overflow-hidden", rounded, className)}
      style={{ background: bg }}
      role="img"
      aria-label={blurred ? `${name} — photo hidden until you match` : `${name}'s photo`}
    >
      <svg
        viewBox="0 0 200 240"
        className={cn("absolute inset-0 h-full w-full", blurred && "scale-105 blur-xl")}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle cx="100" cy="88" r="42" fill={ink} opacity="0.32" />
        <ellipse cx="100" cy="212" rx="78" ry="74" fill={ink} opacity="0.28" />
        <circle cx="146" cy="52" r="26" fill="#fff" opacity="0.14" />
        <path d="M0 190 Q 52 150 104 190 T 210 186 V 240 H 0 Z" fill={ink} opacity="0.14" />
      </svg>

      {!blurred && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-3">
          <span
            className="rounded-full bg-white/85 px-2 py-0.5 font-display text-[11px] font-semibold tracking-wide"
            style={{ color: ink }}
          >
            {initials(name)}
          </span>
        </div>
      )}

      {watermark && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.13]" aria-hidden="true">
          <div className="absolute -inset-10 flex rotate-[-24deg] flex-wrap content-center justify-center gap-x-6 gap-y-4 text-[10px] font-semibold uppercase tracking-widest text-white">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i}>CM · {watermark}</span>
            ))}
          </div>
        </div>
      )}

      {showLock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-forest/25 text-center backdrop-blur-[2px]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-forest shadow-soft">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </span>
          {lockLabel && (
            <span className="rounded-full bg-forest/80 px-3 py-1 text-[11px] font-medium text-cream">
              {lockLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
