"use client";

import { useEffect, useState } from "react";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#2F80ED 1px, transparent 1px), linear-gradient(90deg, #2F80ED 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(47,128,237,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Badge */}
        <div
          className={`transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <span className="inline-flex items-center rounded-full border border-sp-border bg-sp-surface px-4 py-1.5 text-sm font-mono text-sp-muted mb-8">
            <span className="inline-block w-2 h-2 rounded-full bg-sp-success mr-2 animate-pulse-dot" />
            LIVE &nbsp;·&nbsp; Built on ERC-8004 + x402
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[40px] md:text-[72px] leading-tight font-display font-bold text-sp-white mb-0">
          <span
            className={`block animate-fade-slide-up animate-delay-100 ${mounted ? "" : "opacity-0"}`}
          >
            The Credit Bureau
          </span>
          <span
            className={`block bg-gradient-to-r from-sp-primary to-blue-300 bg-clip-text text-transparent animate-fade-slide-up animate-delay-200 ${mounted ? "" : "opacity-0"}`}
          >
            for AI Agents
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`max-w-2xl mx-auto text-sp-muted text-xl leading-relaxed font-body mt-6 animate-fade-slide-up animate-delay-300 ${mounted ? "" : "opacity-0"}`}
        >
          SwarmPay indexes on-chain reputation signals, x402 payment proofs, and
          ERC-8004 attestations into a unified credit score — so insurers,
          marketplaces, and lenders can price agent risk in real time.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-4 mt-10 animate-fade-slide-up animate-delay-400 ${mounted ? "" : "opacity-0"}`}
        >
          <a
            href="#demo"
            className="bg-sp-primary hover:bg-blue-500 text-white px-8 py-3 rounded-md font-medium transition-colors btn-shimmer"
          >
            Try the API →
          </a>
          <a
            href="#"
            className="border border-sp-border text-sp-white hover:border-sp-primary px-8 py-3 rounded-md transition-colors"
          >
            Read the Docs
          </a>
        </div>

        {/* Stats row */}
        <div
          className={`flex flex-wrap gap-4 sm:gap-6 items-center justify-center mt-10 font-mono text-sm text-sp-muted animate-fade-slide-up animate-delay-500 ${mounted ? "" : "opacity-0"}`}
        >
          <span>ERC-8004 Native</span>
          <span className="w-px h-4 bg-sp-border inline-block" />
          <span>x402 Integrated</span>
          <span className="w-px h-4 bg-sp-border inline-block" />
          <span>Base Mainnet</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sp-muted animate-chevron-bounce">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
