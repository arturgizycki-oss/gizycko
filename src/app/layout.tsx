import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getDocumentLanguage } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Gizycko", template: "%s — Gizycko" },
  description:
    "Meet people around Giżycko. A dating app with a real social side — match, chat, and share what you are up to.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Arabic, Hebrew and Persian flip the whole document.
  const { locale, dir } = await getDocumentLanguage();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
