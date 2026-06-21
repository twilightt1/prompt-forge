import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://promptforge.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PromptForge — Production AI Prompt Studio",
    template: "%s | PromptForge",
  },
  description:
    "Rewrite, optimize, benchmark, and guardrail production-grade AI prompts with an English/Vietnamese user interface and OpenAI-compatible workflow.",
  applicationName: "PromptForge",
  keywords: ["AI prompt optimizer", "prompt engineering", "OpenRouter", "OpenAI", "Vercel", "prompt rewrite"],
  authors: [{ name: "PromptForge" }],
  creator: "PromptForge",
  publisher: "PromptForge",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PromptForge — Production AI Prompt Studio",
    description: "Rewrite, optimize, benchmark, and guardrail production-grade AI prompts with English/Vietnamese UI support.",
    url: "/",
    siteName: "PromptForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptForge — Production AI Prompt Studio",
    description: "Rewrite, optimize, benchmark, and guardrail production-grade AI prompts with English/Vietnamese UI support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
