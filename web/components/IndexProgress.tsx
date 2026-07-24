"use client";

import { useEffect, useRef, useState } from "react";
import type { IndexStats } from "@/lib/stats";

const TILES = [
  {
    key: "agents" as const,
    label: "Agents Indexed",
    sub: "Wallets profiled on Base",
    accent: "#8052ff",
  },
  {
    key: "likelyAgents" as const,
    label: "Likely Agents",
    sub: "Flagged by behavioral model",
    accent: "#15846e",
  },
  {
    key: "transactions" as const,
    label: "Transactions Indexed",
    sub: "On-chain events scored",
    accent: "#ffb829",
  },
  {
    key: "latestBlock" as const,
    label: "Latest Block Synced",
    sub: "Base mainnet head",
    accent: "#8052ff",
  },
];

// Counts up to `value` once the tile scrolls into view.
function CountUp({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }

    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast start, long settle, reads as "counting up"
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(value * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, active]);

  return <>{display.toLocaleString()}</>;
}

export default function IndexProgress({ stats }: { stats: IndexStats }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const updated = new Date(stats.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section id="progress" className="py-28 px-4">
      <div ref={ref} className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-lichen opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lichen" />
            </span>
            <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage">
              LIVE INDEX
            </p>
          </div>
          <h2 className="font-display font-light text-[clamp(36px,4vw,48px)] leading-[1.1] tracking-[-0.04em] text-bone mb-4">
            The Index So Far
          </h2>
          <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-xl mx-auto">
            Every number below is read straight from our production index on Base
            mainnet — no projections, no estimates.
          </p>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TILES.map((tile, i) => (
            <div
              key={tile.key}
              className="feature-card rounded-[24px] p-7 flex flex-col gap-2"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity .6s cubic-bezier(.16,1,.3,1) ${i * 120}ms, transform .6s cubic-bezier(.16,1,.3,1) ${i * 120}ms`,
              }}
            >
              <span
                className="block w-8 h-[2px] rounded-full mb-2"
                style={{ background: tile.accent }}
              />
              <p className="stat-number font-display font-light text-bone leading-none text-[clamp(32px,3.4vw,42px)] tracking-[-0.03em]">
                <CountUp value={stats[tile.key]} active={visible} />
              </p>
              <p className="font-display font-semibold text-bone text-sm tracking-[0.021em] mt-1">
                {tile.label}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-smoke">
                {tile.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Footer meta */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-smoke">
            Refreshed daily · Last updated {updated}
          </span>
          <span className="hidden sm:block w-px h-4 bg-white/[0.08]" />
          <a
            href="/explorer"
            className="font-display font-semibold text-sm tracking-[0.021em] text-plum-voltage hover:text-bone transition-colors"
          >
            Explore the index →
          </a>
        </div>
      </div>
    </section>
  );
}
