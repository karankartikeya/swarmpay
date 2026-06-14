"use client";

import { useEffect, useState } from "react";

const STATS = [
  { value: "< 200ms", label: "API latency" },
  { value: "Base", label: "Mainnet" },
  { value: "6", label: "Trust signals" },
  { value: "AAA–C", label: "Tier system" },
];

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-4 pb-[80px] overflow-hidden">

      {/* ── Background layers ── */}

      {/* Deep radial glow behind hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 10%, rgba(47,128,237,0.07) 0%, transparent 65%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(47,128,237,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(47,128,237,0.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Horizontal glow lines (Stripe-like) */}
      <div
        className="absolute top-1/3 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(47,128,237,0.15) 30%, rgba(47,128,237,0.25) 50%, rgba(47,128,237,0.15) 70%, transparent 100%)",
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute top-20 left-[10%] w-64 h-64 rounded-full pointer-events-none animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(47,128,237,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-32 right-[8%] w-80 h-80 rounded-full pointer-events-none animate-glow-pulse animate-delay-500"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center max-w-5xl w-full mx-auto">

        {/* Status badge */}
        <div
          className={`transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-sp-border bg-sp-surface/80 backdrop-blur-sm px-4 py-1.5 text-xs font-mono text-sp-muted mb-10 shadow-lg">
            {/* <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sp-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sp-success" />
            </span> */}
            Live on Base Mainnet · ERC-8004 + x402
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold leading-[1.06] tracking-tight mb-0">
          <span
            className={`block text-[clamp(40px,7vw,80px)] text-sp-white animate-fade-slide-up animate-delay-100`}
          >
            Credit Bureau
          </span>
          <span
            className={`block text-[clamp(40px,7vw,80px)] gradient-text animate-fade-slide-up animate-delay-200`}
          >
            for AI Agents
          </span>
        </h1>

        {/* Sub headline */}
        <p
          className={`max-w-2xl text-sp-muted text-lg sm:text-xl leading-relaxed font-body mt-6 animate-fade-slide-up animate-delay-300`}
        >
          SwarmPay indexes on-chain behavioral signals into a unified trust score - so
          merchants, marketplaces, and lenders can price agent risk in real time.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-3 mt-10 animate-fade-slide-up animate-delay-400`}
        >
          <a
            href="/explorer"
            className="group relative bg-sp-primary hover:bg-blue-500 text-white px-7 py-3.5 rounded-lg font-semibold transition-all duration-200 btn-shimmer shadow-lg shadow-sp-primary/20 hover:shadow-sp-primary/40"
          >
            Explore an Agent
            <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
          </a>
          <a
            href="/demo?mode=presentation"
            className="border border-sp-border hover:border-sp-primary/40 text-sp-muted hover:text-sp-white bg-sp-surface/50 hover:bg-sp-surface px-7 py-3.5 rounded-lg font-medium transition-all duration-200 backdrop-blur-sm"
          >
            Watch Live Demo
          </a>
        </div>

        {/* Stats bar */}
        <div
          className={`mt-16 w-full max-w-2xl animate-fade-slide-up animate-delay-500`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-sp-border rounded-xl overflow-hidden border border-sp-border">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`bg-sp-surface/60 backdrop-blur-sm px-5 py-4 flex flex-col items-center gap-0.5 ${
                  i === 0 ? "rounded-l-xl" : i === 3 ? "rounded-r-xl" : ""
                }`}
              >
                <span className="font-display font-bold text-sp-white text-lg stat-number">
                  {stat.value}
                </span>
                <span className="text-sp-muted text-xs font-mono uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sp-muted/40 animate-chevron-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
