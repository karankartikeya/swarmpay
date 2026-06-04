import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Reputation Explorer | SwarmPay",
  description: "Enter any Base mainnet agent address to get a behavioral trust score powered by SwarmPay Behavioral Intelligence.",
};

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
