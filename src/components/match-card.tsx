"use client";

import Link from "next/link";
import { Lock, MapPin } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { IntentChip, ScoreRing } from "@/components/badge";
import { InterestButton, ShortlistButton, useRelation } from "@/components/interest-button";
import { useI18n } from "@/components/locale-provider";
import { departmentLabel, universityLabel } from "@/lib/mock-data";
import type { Person } from "@/lib/model";
import type { MatchReason } from "@/lib/matching";
import { cn } from "@/lib/utils";

function reasonLabel(reason: MatchReason, locale: "en" | "bn") {
  const map: Record<MatchReason["key"], [string, string]> = {
    intent: ["Same intent", "একই উদ্দেশ্য"],
    interests: [`${reason.n ?? 0} shared interests`, `${reason.n ?? 0}টি মিলিত আগ্রহ`],
    campus: ["Same campus", "একই ক্যাম্পাস"],
    city: ["Same city", "একই শহর"],
    timeline: ["Similar timeline", "মিলিত পরিকল্পনা"],
    values: ["Values align", "মূল্যবোধ মেলে"],
    active: ["Recently active", "সম্প্রতি সক্রিয়"],
    verified: ["ID verified", "আইডি যাচাইকৃত"],
  };
  return locale === "bn" ? map[reason.key][1] : map[reason.key][0];
}

export function MatchCard({
  person,
  score,
  reasons,
  showReasons = true,
}: {
  person: Person;
  score: number;
  reasons: MatchReason[];
  showReasons?: boolean;
}) {
  const { locale } = useI18n();
  const { match } = useRelation(person.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/profile/${person.id}`} className="relative block">
        <Portrait
          name={person.name}
          seed={person.photoSeed}
          variant={0}
          blurred={!match}
          watermark={!match ? "CampusMatch · protected" : undefined}
          rounded="rounded-none"
          className="aspect-[4/3.4] w-full"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-forest">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {match ? (locale === "bn" ? "ছবি খোলা" : "Photos open") : locale === "bn" ? "ছবি গোপন" : "Photos private"}
          </span>
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-white/95 p-0.5 shadow-soft">
          <ScoreRing score={score} />
        </div>
        {person.lastActiveDays <= 2 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-forest/85 px-2 py-1 text-[10px] font-medium text-cream">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden="true" />
            {locale === "bn" ? "সম্প্রতি সক্রিয়" : "Active recently"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/profile/${person.id}`} className="font-display text-lg font-semibold text-forest hover:underline">
              {person.name}
            </Link>
            <span className="text-xs text-muted">{person.age}</span>
            {person.verificationLevel >= 2 && (
              <span className="text-[11px] font-semibold text-leaf">
                {locale === "bn" ? "✓ যাচাইকৃত" : "✓ Verified"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            {universityLabel(person.universityId, locale)} · {departmentLabel(person.departmentId, locale)} ·{" "}
            {locale === "bn" ? `${person.year} বর্ষ` : `Year ${person.year}`}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {person.city === "dhaka" ? (locale === "bn" ? "ঢাকা" : "Dhaka") : person.city === "savar" ? (locale === "bn" ? "সাভার" : "Savar") : person.city}
          </p>
        </div>

        <IntentChip intent={person.intent} locale={locale} />

        {showReasons && reasons.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {locale === "bn" ? "কেন মিলছে" : "Why you match"}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {reasons.slice(0, 3).map((r, i) => (
                <li key={`${r.key}-${i}`} className="chip py-0.5 text-[10px]">
                  {reasonLabel(r, locale)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <InterestButton person={person} className="flex-1" />
          <ShortlistButton personId={person.id} />
        </div>
      </div>
    </article>
  );
}

export function PersonRowCard({
  person,
  children,
  note,
  className,
}: {
  person: Person;
  children?: React.ReactNode;
  note?: string;
  className?: string;
}) {
  const { locale } = useI18n();
  const { match } = useRelation(person.id);
  return (
    <div className={cn("flex flex-col gap-4 rounded-3xl border border-line/80 bg-white p-4 sm:flex-row sm:items-center", className)}>
      <Link href={`/profile/${person.id}`} className="shrink-0">
        <Portrait
          name={person.name}
          seed={person.photoSeed}
          blurred={!match}
          rounded="rounded-2xl"
          className="h-20 w-20"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link href={`/profile/${person.id}`} className="font-display text-lg font-semibold text-forest hover:underline">
            {person.name}
          </Link>
          <span className="text-xs text-muted">{person.age}</span>
          {person.verificationLevel >= 2 && (
            <span className="text-[11px] font-semibold text-leaf">{locale === "bn" ? "✓ যাচাইকৃত" : "✓ Verified"}</span>
          )}
        </div>
        <p className="truncate text-[12px] text-muted">
          {universityLabel(person.universityId, locale)} · {departmentLabel(person.departmentId, locale)}
        </p>
        {note && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink/80">{note}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>}
    </div>
  );
}
