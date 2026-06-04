"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WaitlistForm from "@/components/WaitlistForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const COMPONENT_LABELS: Record<string, { label: string; max: number }> = {
  transaction_volume:     { label: "Transaction Volume",     max: 200 },
  wallet_age:             { label: "Wallet Age",             max: 150 },
  failure_rate:           { label: "Failure Rate",           max: 150 },
  counterparty_diversity: { label: "Counterparty Diversity", max: 200 },
  automation_probability: { label: "Automation Probability", max: 200 },
  usdc_activity:          { label: "USDC Activity",          max: 100 },
};

const TIER_COLORS: Record<string, string> = {
  AAA: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  AA:  "text-blue-400 border-blue-400/30 bg-blue-400/10",
  A:   "text-sky-400 border-sky-400/30 bg-sky-400/10",
  C:   "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Unrated: "text-sp-muted border-sp-border bg-sp-surface",
};

function truncate(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

type ExploreResult = {
  address: string;
  score: number;
  tier: string;
  message?: string;
  components?: Record<string, number>;
  signals?: Record<string, string | number | null>;
  recent_transactions?: {
    hash: string;
    type: string;
    value_eth: string;
    counterparty: string;
    timestamp: string;
    status: string;
  }[];
};

function ExplorerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState(params.get("address") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExploreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze(addr: string) {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setError(null);
    router.replace(`/explorer?address=${trimmed}`);
    try {
      const res = await fetch(`${API_URL}/v0/explore/${trimmed}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      const data: ExploreResult = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const addr = params.get("address");
    if (addr) analyze(addr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noHistory = result && (result.score === 0 || result.message);

  return (
    <main className="min-h-screen bg-sp-bg text-sp-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Heading */}
        <div className="mb-10 text-center animate-fade-slide-up">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-sp-white mb-3">
            Agent Reputation Explorer
          </h1>
          <p className="text-sp-muted text-base">
            Enter any Base mainnet agent address to get a behavioral trust score
          </p>
        </div>

        {/* Search bar */}
        <div className="animate-fade-slide-up animate-delay-100">
          <form
            onSubmit={(e) => { e.preventDefault(); analyze(input); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0x... agent wallet address"
              spellCheck={false}
              className="flex-1 bg-sp-surface border border-sp-border rounded-lg px-4 py-3 text-sp-white placeholder-sp-muted font-mono text-sm focus:outline-none focus:border-sp-primary transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-sp-primary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors btn-shimmer whitespace-nowrap"
            >
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </form>
        </div>

        {/* Waitlist */}
        {!result && !loading && (
          <div className="mt-6 animate-fade-slide-up animate-delay-200">
            <WaitlistForm source="explorer" label="Join the waitlist to get API access" />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-16 text-center text-sp-muted animate-fade-slide-up">
            <div className="inline-flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-sp-primary animate-pulse-dot" />
              <span className="text-sm">Analyzing agent behaviour on Base mainnet…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm animate-fade-slide-up">
            {error}
          </div>
        )}

        {/* No history */}
        {noHistory && !loading && (
          <div className="mt-8 rounded-lg border border-sp-border bg-sp-surface px-5 py-6 text-center animate-fade-slide-up">
            <p className="text-sp-muted text-sm">No transaction history found on Base mainnet for</p>
            <p className="font-mono text-sp-white text-sm mt-1 break-all">{result!.address}</p>
          </div>
        )}

        {/* Results */}
        {result && !noHistory && !loading && (
          <div className="mt-8 flex flex-col gap-6 animate-fade-slide-up">

            {/* Score card */}
            <div className="rounded-xl border border-sp-border bg-sp-surface p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-display font-bold text-sp-white leading-none">
                      {result.score}
                    </span>
                    <span className="text-sp-muted text-sm mb-1">/ 1000</span>
                    <span className={`ml-1 mb-1 text-sm font-mono font-semibold px-2.5 py-1 rounded-md border ${TIER_COLORS[result.tier] ?? TIER_COLORS["Unrated"]}`}>
                      {result.tier}
                    </span>
                  </div>
                  <p className="text-sp-muted text-xs mt-2">Powered by SwarmPay Behavioral Intelligence</p>
                </div>
                <div className="flex flex-col gap-2 text-right text-xs shrink-0">
                  <span className="font-mono text-sp-muted break-all">{result.address}</span>
                  <a
                    href={`https://basescan.org/address/${result.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sp-primary hover:underline"
                  >
                    View on Basescan ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Component bars */}
            {result.components && (
              <div className="rounded-xl border border-sp-border bg-sp-surface p-6">
                <h2 className="text-sm font-semibold text-sp-white mb-5">Score Components</h2>
                <div className="flex flex-col gap-4">
                  {Object.entries(result.components).map(([key, val]) => {
                    const meta = COMPONENT_LABELS[key];
                    const pct = meta ? Math.round((val / meta.max) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-sp-muted">{meta?.label ?? key}</span>
                          <span className="text-sp-white font-mono">{val} <span className="text-sp-muted">/ {meta?.max}</span></span>
                        </div>
                        <div className="h-1.5 bg-sp-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sp-primary rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Signals grid */}
            {result.signals && (
              <div className="rounded-xl border border-sp-border bg-sp-surface p-6">
                <h2 className="text-sm font-semibold text-sp-white mb-5">On-chain Signals</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: "total_transactions",    label: "Total Txns" },
                    { key: "failed_transactions",   label: "Failed Txns" },
                    { key: "unique_counterparties", label: "Counterparties" },
                    { key: "wallet_age_days",       label: "Wallet Age (days)" },
                    { key: "usdc_transfers",        label: "USDC Transfers" },
                    { key: "first_seen",            label: "First Seen", date: true },
                    { key: "last_seen",             label: "Last Seen", date: true },
                  ].map(({ key, label, date }) => (
                    <div key={key} className="bg-sp-bg rounded-lg px-4 py-3">
                      <p className="text-sp-muted text-xs mb-1">{label}</p>
                      <p className="text-sp-white text-sm font-mono">
                        {date
                          ? fmt(result.signals![key] as string)
                          : (result.signals![key] ?? "—").toString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent transactions */}
            {result.recent_transactions && result.recent_transactions.length > 0 && (
              <div className="rounded-xl border border-sp-border bg-sp-surface p-6">
                <h2 className="text-sm font-semibold text-sp-white mb-5">Recent Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-sp-muted border-b border-sp-border">
                        <th className="text-left pb-3 font-medium">Type</th>
                        <th className="text-left pb-3 font-medium">Counterparty</th>
                        <th className="text-left pb-3 font-medium">Value</th>
                        <th className="text-left pb-3 font-medium">Time</th>
                        <th className="text-left pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.recent_transactions.map((tx) => (
                        <tr key={tx.hash} className="border-b border-sp-border/50 hover:bg-sp-bg/50 transition-colors">
                          <td className="py-3 pr-4">
                            <a
                              href={`https://basescan.org/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sp-primary hover:underline font-mono"
                            >
                              {tx.type}
                            </a>
                          </td>
                          <td className="py-3 pr-4 font-mono text-sp-muted">
                            {tx.counterparty ? (
                              <a
                                href={`https://basescan.org/address/${tx.counterparty}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-sp-white transition-colors"
                              >
                                {truncate(tx.counterparty)}
                              </a>
                            ) : "—"}
                          </td>
                          <td className="py-3 pr-4 font-mono text-sp-white">
                            {tx.value_eth} ETH
                          </td>
                          <td className="py-3 pr-4 text-sp-muted">
                            {fmt(tx.timestamp)}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${tx.status === "success" ? "bg-emerald-400" : "bg-red-400"}`} />
                              <span className={tx.status === "success" ? "text-emerald-400" : "text-red-400"}>
                                {tx.status}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense>
      <ExplorerInner />
    </Suspense>
  );
}
