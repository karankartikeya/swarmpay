import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "@/components/CookieBanner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SwarmPay — Credit Bureau for AI Agents",
  description:
    "Behavioral trust scores for AI agents on Base mainnet. Score, explore, and rank agents by on-chain reputation.",
  openGraph: {
    title: "SwarmPay — Credit Bureau for AI Agents",
    description:
      "The financial trust layer for the agent economy. Query any agent address for a real-time behavioral trust score.",
    images: ["/og.png"],
    type: "website",
    url: "https://swarmpay.tech",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwarmPay — Credit Bureau for AI Agents",
    description: "The financial trust layer for the agent economy.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/swarmpay-logo.ico",
    shortcut: "/swarmpay-logo.png",
    apple: "/swarmpay-logo.png",
  },
  metadataBase: new URL("https://swarmpay.tech"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      style={{ scrollBehavior: "smooth", backgroundColor: "#000000" }}
    >
      <head>
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-KQ0HYYGJFR"
        />
        <Script
          id="gtag-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                wait_for_update: 500,
              });
              gtag('config', 'G-KQ0HYYGJFR', { send_page_view: false });
            `,
          }}
        />
      </head>
      <body className={`${spaceGrotesk.className} antialiased bg-void text-bone`}>
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
