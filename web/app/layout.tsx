import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SwarmPay — Credit Bureau for AI Agents",
  description:
    "The financial trust layer for the agent economy. Query any agent address for a real-time credit score built on ERC-8004 reputation data and x402 payment history.",
  openGraph: {
    title: "SwarmPay — Credit Bureau for AI Agents",
    description:
      "The financial trust layer for the agent economy. Query any agent address for a real-time credit score.",
    images: ["/og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwarmPay — Credit Bureau for AI Agents",
    description: "The financial trust layer for the agent economy.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}
      style={{ scrollBehavior: "smooth", backgroundColor: "#080B10" }}
    >
      <body
        className={`${dmSans.className} antialiased bg-sp-bg text-sp-white`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
