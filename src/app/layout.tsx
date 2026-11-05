import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Sans_Bengali } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { RegisterServiceWorker } from "@/components/pwa";
import { DemoProvider } from "@/lib/demo-store";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "CampusMatch — verified student matchmaking",
    template: "%s · CampusMatch",
  },
  description:
    "A trust-first matchmaking space for verified university students in Bangladesh. Six thoughtful matches a day, chat only by mutual consent.",
  applicationName: "CampusMatch",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CampusMatch" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#12452A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = cookieLocale === "en" || cookieLocale === "bn" ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={locale} className={`${inter.variable} ${bengali.variable} ${fraunces.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
        >
          {locale === "bn" ? "মূল কনটেন্টে যান" : "Skip to content"}
        </a>
        <DemoProvider>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </DemoProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
