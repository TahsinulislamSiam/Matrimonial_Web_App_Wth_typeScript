"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Clock, MessageCircle, Send } from "lucide-react";
import { useDemo, matchBetween } from "@/lib/demo-store";
import { useI18n } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/model";

export function useRelation(personId: string) {
  const { state } = useDemo();
  const me = state.currentUserId;
  const sent = state.interests.find(
    (i) =>
      i.senderId === me &&
      i.receiverId === personId &&
      (i.status === "pending" || i.status === "accepted")
  );
  const received = state.interests.find(
    (i) =>
      i.receiverId === me &&
      i.senderId === personId &&
      (i.status === "pending" || i.status === "accepted")
  );
  const match = me ? matchBetween(state, me, personId) : undefined;
  const blocked = state.blocks.includes(personId);
  return { sent, received, match, blocked };
}

export function InterestButton({
  person,
  size = "sm",
  className,
}: {
  person: Person;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { state, sendInterest } = useDemo();
  const { tr, locale } = useI18n();
  const relation = useRelation(person.id);
  const [error, setError] = useState<string | null>(null);

  if (relation.blocked) {
    return (
      <span className={cn("btn-secondary cursor-default opacity-70", size === "sm" && "btn-sm", className)}>
        {locale === "bn" ? "ব্লক করা হয়েছে" : "Blocked"}
      </span>
    );
  }

  if (relation.match) {
    return (
      <Link
        href={`/chat/${relation.match.id}`}
        className={cn("btn-primary", size === "sm" && "btn-sm", className)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {tr("profile.message")}
      </Link>
    );
  }

  if (relation.sent) {
    return (
      <span
        className={cn(
          "btn-secondary cursor-default border-leaf/30 bg-mint text-forest",
          size === "sm" && "btn-sm",
          className
        )}
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {relation.sent.status === "accepted"
          ? locale === "bn"
            ? "গ্রহণ করা হয়েছে"
            : "Accepted"
          : tr("profile.interestPending")}
      </span>
    );
  }

  if (relation.received?.status === "pending") {
    return (
      <span
        className={cn(
          "btn-secondary cursor-default border-gold/30 bg-gold/10 text-gold",
          size === "sm" && "btn-sm",
          className
        )}
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        {locale === "bn" ? "তাদের আগ্রহ অপেক্ষমাণ" : "Their interest is waiting"}
      </span>
    );
  }

  const remaining = state.interests.filter(
    (i) => i.senderId === state.currentUserId && new Date(i.createdAt).toDateString() === new Date().toDateString()
  ).length;

  function onClick() {
    const result = sendInterest(person.id);
    if (!result.ok) {
      setError(
        result.error === "dailyLimit"
          ? tr("errors.dailyLimit")
          : result.error === "alreadySent"
            ? tr("errors.alreadySent")
            : tr("errors.generic")
      );
    } else {
      setError(null);
    }
  }

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn("btn-primary", size === "sm" && "btn-sm")}
        title={remaining >= 5 ? tr("today.dailyLimit") : undefined}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {tr("profile.sendInterest")}
      </button>
      {error && (
        <span role="status" className="text-[11px] font-medium text-rose">
          {error}
        </span>
      )}
    </span>
  );
}

export function ShortlistButton({
  personId,
  withLabel = false,
  className,
}: {
  personId: string;
  withLabel?: boolean;
  className?: string;
}) {
  const { state, toggleShortlist } = useDemo();
  const { locale } = useI18n();
  const saved = state.shortlist.includes(personId);
  return (
    <button
      type="button"
      onClick={() => toggleShortlist(personId)}
      aria-pressed={saved}
      aria-label={
        saved
          ? locale === "bn"
            ? "শর্টলিস্ট থেকে সরান"
            : "Remove from shortlist"
          : locale === "bn"
            ? "শর্টলিস্টে যোগ করুন"
            : "Add to shortlist"
      }
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition",
        saved
          ? "border-gold/40 bg-gold/15 text-gold"
          : "border-line bg-white text-muted hover:border-forest/30 hover:text-forest",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden="true" />
      {withLabel && (saved ? (locale === "bn" ? "সংরক্ষিত" : "Saved") : locale === "bn" ? "শর্টলিস্ট" : "Shortlist")}
    </button>
  );
}
