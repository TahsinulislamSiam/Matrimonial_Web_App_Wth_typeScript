import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTENT_LABELS, type Intent } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";

export function VerifiedBadge({
  level,
  locale,
  compact = false,
}: {
  level: number;
  locale: Locale;
  compact?: boolean;
}) {
  if (level <= 0) {
    return (
      <span className="pill bg-parchment text-muted">
        <Clock className="h-3 w-3" aria-hidden="true" />
        {locale === "bn" ? "অযাচিত" : "Unverified"}
      </span>
    );
  }
  const label =
    level >= 3
      ? locale === "bn"
        ? "আইডি যাচাইকৃত"
        : "ID verified"
      : level === 2
        ? locale === "bn"
          ? "শিক্ষার্থী যাচাইকৃত"
          : "Student verified"
        : locale === "bn"
          ? "ইমেইল যাচাইকৃত"
          : "Email verified";

  return (
    <span
      className={cn(
        "pill bg-mint text-forest",
        compact && "px-2 py-0.5 text-[10px] tracking-wide"
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function IntentChip({ intent, locale }: { intent: Intent; locale: Locale }) {
  const tone =
    intent === "marriage_after_graduation"
      ? "bg-gold/15 text-gold"
      : intent === "serious_relationship"
        ? "bg-mint text-forest"
        : "bg-lilac text-forest/80";
  return <span className={cn("pill", tone)}>{INTENT_LABELS[intent][locale]}</span>;
}

export function ProtectionNote({ locale }: { locale: Locale }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
      <ShieldCheck className="h-3.5 w-3.5 text-leaf" aria-hidden="true" />
      {locale === "bn" ? "ছবি শুধু ম্যাচে দেখা যায়" : "Photos visible only to matches"}
    </p>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <span className="relative grid h-10 w-10 place-items-center" aria-label={`${score}% match`}>
      <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-line" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="text-leaf"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-forest">{score}%</span>
    </span>
  );
}
