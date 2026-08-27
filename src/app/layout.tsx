import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getDocumentLanguage, getMessages } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Gizycko", template: "%s - Gizycko" },
  description:
    "Chat and share with people anywhere in the world, in your own language. Post, message, and join groups.",
};

/**
 * `viewportFit: "cover"` is what makes `env(safe-area-inset-*)` return a real
 * number, which the bottom navigation bar needs to clear a phone's home bar.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Arabic, Hebrew and Persian flip the whole document.
  const [{ locale, dir }, messages] = await Promise.all([
    getDocumentLanguage(),
    getMessages(),
  ]);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider messages={messages} locale={locale}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
