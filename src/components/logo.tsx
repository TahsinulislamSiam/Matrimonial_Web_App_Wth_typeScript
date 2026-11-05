import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
      fill="none"
    >
      <rect width="40" height="40" rx="12" fill="#12452A" />
      <path
        d="M12.5 24.5c0-5.4 3.9-9.8 8.7-10.9-1.1 4.8-5.5 8.7-10.9 8.7"
        fill="#E5F1E8"
        opacity=".92"
      />
      <path
        d="M27.5 15.5c0 5.4-3.9 9.8-8.7 10.9 1.1-4.8 5.5-8.7 10.9-8.7"
        fill="#B0802A"
        opacity=".95"
      />
      <circle cx="20" cy="20" r="2.1" fill="#FAF7F1" />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  wordmark = true,
}: {
  className?: string;
  href?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5 rounded-full", className)}
      aria-label="CampusMatch home"
    >
      <LogoMark />
      {wordmark && (
        <span className="font-display text-[19px] font-semibold tracking-tight text-forest">
          Campus<span className="text-gold">Match</span>
        </span>
      )}
    </Link>
  );
}
