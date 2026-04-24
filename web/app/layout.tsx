import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwarmPay",
  description: "Agent credit scoring for the x402 payment ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
