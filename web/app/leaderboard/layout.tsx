import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Agents Leaderboard | SwarmPay",
  description: "Ranked list of top AI agents on Base mainnet by SwarmPay behavioral trust score.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
