"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TIER_COLORS: Record<string, string> = {
  AAA: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  AA:  "text-green-400 border-green-400/30 bg-green-400/10",
  A:   "text-blue-400 border-blue-400/30 bg-blue-400/10",
  C:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Unrated: "text-sp-muted border-sp-border bg-sp-surface",
};

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

type Entry = {
  rank: number;
  address: string;
  short: string;
  score: number;
  tier: string;
  total_txs: number;
  wallet_age_days: number;
};

type LeaderboardData = {
  entries: Entry[];
  cached_at: string;
};

function timeSince(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-sp-border/50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-sp-border rounded animate-pulse" style={{ width: i === 1 ? "120px" : "48px" }} />
        </td>
      ))}
    </tr>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // re-render timestamp every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchLeaderboard = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v0/leaderboard${refresh ? "?refresh=true" : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return (
    <main className="min-h-screen bg-sp-bg text-sp-white pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center animate-fade-slide-up">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-sp-white mb-3">
            Top Agents on Base Mainnet
          </h1>
          <p className="text-sp-muted text-base">
            Ranked by SwarmPay Behavioral Intelligence Score
          </p>
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-sp-border bg-sp-surface overflow-hidden animate-fade-slide-up animate-delay-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sp-border text-sp-muted text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-medium w-12">Rank</th>
                  <th className="text-left py-3 px-4 font-medium">Address</th>
                  <th className="text-right py-3 px-4 font-medium">Score</th>
                  <th className="text-center py-3 px-4 font-medium">Tier</th>
                  <th className="text-right py-3 px-4 font-medium">Txns</th>
                  <th className="text-right py-3 px-4 font-medium">Age (days)</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(8)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-red-400 text-sm">{error}</td>
                  </tr>
                )}

                {!loading && !error && data?.entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sp-muted text-sm">No data available</td>
                  </tr>
                )}

                {!loading && !error && data?.entries.map((entry) => (
                  <tr
                    key={entry.address}
                    className="border-b border-sp-border/50 hover:bg-sp-bg/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className={`font-display font-bold text-base ${RANK_COLORS[entry.rank] ?? "text-sp-muted"}`}>
                        {entry.rank <= 3 ? (
                          <span>{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
                        ) : (
                          <span className="font-mono text-sp-muted">{entry.rank}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <a
                        href={`/explorer?address=${entry.address}`}
                        className="font-mono text-sp-primary hover:text-blue-400 transition-colors text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">{entry.address}</span>
                        <span className="sm:hidden">{entry.short}</span>
                      </a>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-display font-bold text-sp-white">{entry.score}</span>
                      <span className="text-sp-muted text-xs ml-1">/ 1000</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${TIER_COLORS[entry.tier] ?? TIER_COLORS["Unrated"]}`}>
                        {entry.tier}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sp-white">{entry.total_txs}</td>
                    <td className="py-4 px-4 text-right font-mono text-sp-white">{entry.wallet_age_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-sp-border text-xs text-sp-muted">
            <span>
              {data?.cached_at
                ? `Last updated: ${timeSince(data.cached_at)}`
                : loading ? "Loading…" : ""}
              {/* tick dependency keeps this live */}
              {tick >= 0 ? "" : ""}
            </span>
            <button
              onClick={() => fetchLeaderboard(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 text-sp-primary hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                className={refreshing ? "animate-spin" : ""}
              >
                <path d="M10 6A4 4 0 1 1 6 2" strokeLinecap="round"/>
                <polyline points="10 2 10 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-sp-muted mt-6">
          Scores computed from on-chain data via{" "}
          <span className="text-sp-primary">SwarmPay Behavioral Intelligence</span> · Base Mainnet
        </p>
      </div>
    </main>
  );
}
