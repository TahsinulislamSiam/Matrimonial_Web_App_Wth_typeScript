"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  Compass,
  Inbox,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useDemo } from "@/lib/demo-store";
import { useI18n } from "@/components/locale-provider";
import { Portrait } from "@/components/portrait";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/today", key: "nav.today", icon: Sparkles },
  { href: "/discover", key: "nav.discover", icon: Compass },
  { href: "/inbox", key: "nav.inbox", icon: Inbox },
  { href: "/shortlist", key: "nav.shortlist", icon: Bookmark },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated, currentPerson, logout } = useDemo();
  const { tr, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.currentUserId || !currentPerson) {
      router.replace("/login");
    } else if (!state.onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [hydrated, state.currentUserId, state.onboardingComplete, currentPerson, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!hydrated || !currentPerson) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-pulse-soft">
            <LogoMark className="h-12 w-12" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{tr("common.loading")}</p>
        </div>
      </div>
    );
  }

  const showVerifyBanner = currentPerson.verificationLevel < 2 && !isActive(pathname, "/verify");

  return (
    <div className="min-h-dvh bg-cream pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo href="/today" />

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
                    active ? "bg-mint text-forest" : "text-muted hover:bg-parchment/70 hover:text-forest"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tr(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Link
              href="/settings"
              className="hidden rounded-full p-2 text-muted transition hover:bg-parchment hover:text-forest sm:inline-flex"
              aria-label={tr("nav.settings")}
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1 rounded-full border border-line bg-white p-0.5 pr-1.5 transition hover:border-forest/30"
              >
                <Portrait
                  name={currentPerson.name}
                  seed={currentPerson.photoSeed}
                  rounded="rounded-full"
                  className="h-8 w-8"
                />
                <Menu className="h-4 w-4 text-muted" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift"
                >
                  <div className="px-3 py-2">
                    <p className="truncate font-display text-sm font-semibold text-forest">{currentPerson.name}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted">
                      <ShieldCheck className="h-3 w-3 text-leaf" aria-hidden="true" />
                      {currentPerson.verificationLevel >= 2
                        ? locale === "bn"
                          ? "শিক্ষার্থী যাচাইকৃত"
                          : "Student verified"
                        : locale === "bn"
                          ? "যাচাই বাকি"
                          : "Verification pending"}
                    </p>
                  </div>
                  <div className="divider my-1" />
                  <MenuLink href={`/profile/${currentPerson.id}`} icon={UserRound} label={tr("nav.profile")} />
                  <MenuLink href="/verify" icon={ShieldCheck} label={locale === "bn" ? "যাচাই" : "Verification"} />
                  <MenuLink href="/settings" icon={Settings} label={tr("nav.settings")} />
                  <MenuLink href="/admin" icon={ShieldCheck} label={tr("nav.admin")} />
                  <div className="divider my-1" />
                  <div className="px-3 py-1.5 sm:hidden">
                    <LanguageSwitcher />
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose hover:bg-rose/5"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {tr("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showVerifyBanner && (
        <div className="border-b border-gold/20 bg-gold/10">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 text-[13px] text-forest/90 sm:px-6 lg:px-8">
            <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />
            <span>
              {locale === "bn"
                ? "আপনার অ্যাকাউন্ট এখনো সম্পূর্ণ যাচাই হয়নি।"
                : "Your student status is not fully verified yet."}
            </span>
            <Link href="/verify" className="font-semibold text-gold underline decoration-gold/40 underline-offset-4">
              {locale === "bn" ? "এখনই যাচাই করুন" : "Verify now"}
            </Link>
          </div>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        {children}
      </main>

      <footer className="hidden border-t border-line/60 py-6 md:block">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-[11px] text-muted sm:px-6 lg:px-8">
          <p>
            {locale === "bn"
              ? "ক্যাম্পাসম্যাচ — শুধু ভেরিফায়েড শিক্ষার্থীদের জন্য। ১৮+"
              : "CampusMatch — for verified students only. 18+"}
          </p>
          <p>
            {locale === "bn"
              ? "এটি একটি ডেমো। নমুনা প্রোফাইল ব্যবহৃত হয়েছে।"
              : "Demo build. Seeded profiles, no real student data."}
          </p>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Mobile"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-forest" : "text-muted"
                )}
              >
                <span className={cn("grid h-8 w-10 place-items-center rounded-full", active && "bg-mint")}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                {tr(item.key)}
              </Link>
            );
          })}
          <Link
            href="/settings"
            aria-current={isActive(pathname, "/settings") ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
              isActive(pathname, "/settings") ? "text-forest" : "text-muted"
            )}
          >
            <span
              className={cn(
                "grid h-8 w-10 place-items-center rounded-full",
                isActive(pathname, "/settings") && "bg-mint"
              )}
            >
              <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {tr("nav.settings")}
          </Link>
        </div>
      </nav>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink/85 hover:bg-parchment hover:text-forest"
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      {label}
    </Link>
  );
}
