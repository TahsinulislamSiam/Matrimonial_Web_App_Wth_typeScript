"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/locale-provider";

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale } = useI18n();
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-[11px] font-semibold",
        tone === "dark" ? "border-cream/25 bg-cream/10 text-cream" : "border-line bg-white text-muted"
      )}
      role="group"
      aria-label="Language / ভাষা"
    >
      {(["bn", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          aria-pressed={locale === code}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === code
              ? tone === "dark"
                ? "bg-cream text-forest"
                : "bg-forest text-cream"
              : "hover:text-forest"
          )}
        >
          {code === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}
