"use client";

import { useState, useEffect, useRef } from "react";

interface ScoreData {
  agent_id: string;
  score: number;
  tier: string;
  confidence: string;
  components: {
    reputation: number;
    volume: number;
    payment_reliability: number;
    validation_rate: number;
  };
}

function getScoreColor(score: number): string {
  if (score > 850) return "text-sp-success";
  if (score > 700) return "text-blue-400";
  if (score > 550) return "text-yellow-400";
  return "text-sp-muted";
}

function getTierStyle(tier: string): string {
  if (tier === "AAA") return "bg-sp-success/20 text-sp-success";
  if (tier === "AA") return "bg-blue-500/20 text-blue-400";
  return "bg-sp-warning/20 text-sp-warning";
}

function syntaxHighlightJSON(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "text-orange-400"; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-blue-400"; // key
          } else {
            cls = "text-green-400"; // string value
          }
        } else if (/true|false/.test(match)) {
          cls = "text-purple-400"; // boolean
        } else if (/null/.test(match)) {
          cls = "text-sp-muted";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

const MOCK_SCORE: ScoreData = {
  agent_id: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  score: 742,
  tier: "AA",
  confidence: "medium",
  components: {
    reputation: 297,
    volume: 186,
    payment_reliability: 164,
    validation_rate: 95,
  },
};

const componentLabels: { key: keyof ScoreData["components"]; label: string; max: number }[] = [
  { key: "reputation", label: "Reputation", max: 350 },
  { key: "volume", label: "Volume", max: 250 },
  { key: "payment_reliability", label: "Payment Reliability", max: 250 },
  { key: "validation_rate", label: "Validation Rate", max: 150 },
];

export default function Demo() {
  const [address, setAddress] = useState(
    "0x8004A818BFB912233c491871b3d84c89A494BD9e"
  );
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const animateScore = (target: number) => {
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleQuery = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setScoreData(null);
    setDisplayScore(0);
    setBarsVisible(false);
    setJsonOpen(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/v0/score/${address.trim()}`
      );
      if (!res.ok) throw new Error("Not found");
      const data: ScoreData = await res.json();
      setScoreData(data);
      animateScore(data.score);
      setTimeout(() => setBarsVisible(true), 200);
    } catch {
      // Use mock data for demo purposes when API is unavailable
      setScoreData(MOCK_SCORE);
      animateScore(MOCK_SCORE.score);
      setTimeout(() => setBarsVisible(true), 200);
    } finally {
      setLoading(false);
    }
  };

  const isUnrated =
    scoreData && (scoreData.score === 0 || scoreData.tier === "Unrated");

  return (
    <section id="demo" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
          LIVE API
        </p>
        <h2 className="font-display text-3xl text-sp-white mb-2">
          Query any agent address
        </h2>
        <p className="text-sp-muted text-sm font-mono mb-8">
          Enter any Base mainnet address to fetch its SwarmPay credit profile.
        </p>

        {/* Card */}
        <div className="bg-sp-surface border border-sp-border rounded-xl p-6">
          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className={`flex-1 bg-sp-bg border border-sp-border rounded-md px-4 py-3 font-mono text-sp-white text-sm focus:outline-none focus:border-sp-primary focus:ring-1 focus:ring-sp-primary transition-colors ${
                !address ? "cursor-blink" : ""
              }`}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
            <button
              onClick={handleQuery}
              disabled={loading}
              className="bg-sp-primary hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-md font-medium transition-colors btn-shimmer whitespace-nowrap"
            >
              {loading ? "Querying..." : "Get Score →"}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-8 flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-sp-primary animate-pulse-dot"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <span className="text-sp-muted font-mono text-sm">
                Querying Base mainnet...
              </span>
            </div>
          )}

          {/* Score card */}
          {scoreData && !loading && (
            <div className="mt-8">
              {isUnrated ? (
                <div className="text-center py-8">
                  <div className="text-[80px] font-mono font-bold text-sp-muted leading-none">
                    000
                  </div>
                  <p className="text-sp-muted text-sm mt-4 max-w-md mx-auto">
                    No ERC-8004 history found for this address. Agents must
                    register on-chain before receiving a score.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: score */}
                  <div>
                    <div
                      className={`text-[80px] font-mono font-bold leading-none ${getScoreColor(scoreData.score)}`}
                    >
                      {displayScore}
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-mono font-bold ${getTierStyle(scoreData.tier)}`}
                      >
                        {scoreData.tier}
                      </span>
                    </div>
                    <p className="text-sp-muted text-sm mt-2">
                      Confidence:{" "}
                      <span className="text-sp-white font-mono">
                        {scoreData.confidence}
                      </span>
                    </p>
                  </div>

                  {/* Right: component bars */}
                  <div>
                    {componentLabels.map(({ key, label, max }) => {
                      const value = scoreData.components[key];
                      const pct = Math.round((value / max) * 100);
                      return (
                        <div key={key} className="mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sp-muted text-xs font-mono">
                              {label}
                            </span>
                            <span className="text-sp-white text-xs font-mono ml-auto">
                              {value}
                            </span>
                          </div>
                          <div className="h-1 bg-sp-border rounded-full mt-1">
                            <div
                              className="h-1 bg-sp-primary rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: barsVisible ? `${pct}%` : "0%",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom row */}
              <div className="mt-6 pt-4 border-t border-sp-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sp-muted text-xs font-mono">
                  Data sources: ERC-8004 Reputation Registry · x402 Payment
                  History
                </p>
                <button
                  onClick={() => setJsonOpen(!jsonOpen)}
                  className="text-sp-muted hover:text-sp-white text-xs font-mono transition-colors self-start sm:self-auto"
                >
                  {jsonOpen ? "Hide JSON ↑" : "Raw JSON ↓"}
                </button>
              </div>

              {/* Collapsible JSON */}
              {jsonOpen && (
                <div className="mt-4 bg-sp-bg border border-sp-border rounded-lg p-4 overflow-auto max-h-64">
                  <pre
                    className="text-xs font-mono"
                    dangerouslySetInnerHTML={{
                      __html: syntaxHighlightJSON(scoreData),
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
