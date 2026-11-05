import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function ageFromDob(dob: Date, now = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function isAdult(dob: Date, now = new Date()): boolean {
  return ageFromDob(dob, now) >= 18;
}

export function formatDate(locale: string, date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatDayLabel(date: Date, locale: string): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return locale === "bn" ? "আজ" : "Today";
  if (same(date, yesterday)) return locale === "bn" ? "গতকাল" : "Yesterday";
  return formatDate(locale, date);
}

export function timeAgo(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "bn" ? "এইমাত্র" : "just now";
  if (mins < 60) return locale === "bn" ? `${mins} মিনিট আগে` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "bn" ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "bn" ? `${days} দিন আগে` : `${days}d ago`;
  return formatDate(locale, d);
}

export function csvToList(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function listToCsv(list: string[] | undefined | null): string {
  return Array.from(new Set((list ?? []).filter(Boolean))).join(",");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable hue from an arbitrary seed, used for generated portrait placeholders. */
export function hueFromSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 360;
}

export function portraitStyle(seed: string, variant: number, offset = 0) {
  const hue = (hueFromSeed(seed) + variant * 27 + offset) % 360;
  return {
    background: `radial-gradient(120% 120% at 20% 15%, hsl(${hue} 42% 82%) 0%, hsl(${(hue + 18) % 360} 38% 70%) 45%, hsl(${(hue + 34) % 360} 32% 52%) 100%)`,
    accent: `hsl(${(hue + 12) % 360} 45% 34%)`,
  };
}

export function maskPhone(last4: string): string {
  return `+880 •••• ••${last4}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Reject display names / bios that leak contact details. */
export function containsContactDetails(text: string): boolean {
  const compact = text.replace(/[\s\-().]/g, "");
  const patterns = [
    /(?:\+?88)?01[3-9]\d{8}/, // BD phone
    /[\w.+-]+@[\w-]+\.[\w.]+/, // email
    /\b(?:wa|whatsapp|telegram|insta|instagram|facebook|fb|imo|viber)\b/i,
    /\b(?:t\.me|wa\.me)\//i,
    /\b\d{6,}\b/, // long digit strings
  ];
  return patterns.some((p) => p.test(compact) || p.test(text));
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeRedirectPath(value: string | undefined | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
