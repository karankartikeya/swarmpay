"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms`,
      }}
    >
      {children}
    </div>
  );
}

const problemCards = [
  {
    title: "No Identity Verification",
    body: "Agents interact with financial systems without any verifiable track record or reputation.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M13 7L7 13M7 7l6 6" />
      </svg>
    ),
  },
  {
    title: "Blind Risk Exposure",
    body: "Merchants can't distinguish a well-behaved agent from one that will fail, chargeback, or exploit limits.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L18 17H2L10 2Z" />
        <path d="M10 8v4M10 14.5v.5" />
      </svg>
    ),
  },
  {
    title: "No Credit Infrastructure",
    body: "Unlike humans with FICO scores, AI agents have zero standardized trust scoring — until now.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="14" height="10" rx="2" />
        <path d="M3 9h14" />
        <path d="M7 13h3" />
      </svg>
    ),
  },
];

const solutionFeatures = [
  {
    color: "#8052ff",
    title: "Behavioral Scoring",
    body: "Transaction volume, wallet age, failure rate, counterparty diversity, automation probability, and USDC activity — all indexed into one score.",
    tag: "6 Trust Signals",
  },
  {
    color: "#15846e",
    title: "Real-Time API",
    body: "Query any Base mainnet address. Get a full credit profile in under 200ms. Integrate with one API call — no SDK required.",
    tag: "< 200ms Latency",
  },
  {
    color: "#ffb829",
    title: "On-Chain Verification",
    body: "Built on ERC-8004 Reputation Registry. Every data point is cryptographically verifiable — no self-reported claims, no gaming the score.",
    tag: "ERC-8004",
  },
  {
    color: "#8052ff",
    title: "Tiered Credit System",
    body: "AAA to C tier ratings with confidence levels. Merchants set their own thresholds — extend coverage, access, or credit based on proven track records.",
    tag: "AAA – C Tiers",
  },
];

export default function ProblemSolution() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Problem */}
        <AnimatedCard index={0}>
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 rounded-full bg-red-500" />
              <span className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-red-500">
                THE PROBLEM
              </span>
            </div>
            <h2 className="font-display font-light text-[clamp(36px,5vw,78px)] leading-[0.9] tracking-[-0.04em] text-bone mb-6 max-w-3xl">
              AI Agents Transact Without a Credit History
            </h2>
            <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-2xl">
              Today, AI agents handle real money — paying for APIs, booking services, executing trades. But there&apos;s no way to verify if an agent is trustworthy before giving it financial access.
            </p>
          </div>
        </AnimatedCard>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {problemCards.map((card, i) => (
            <AnimatedCard key={card.title} index={i + 1}>
              <div className="border border-white/[0.08] rounded-[24px] p-8 h-full relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-red-500/40" />
                <div className="w-10 h-10 rounded-[24px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                  {card.icon}
                </div>
                <h3 className="font-display font-semibold text-bone text-lg tracking-[0.021em] mb-3">{card.title}</h3>
                <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">{card.body}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Solution */}
        <AnimatedCard index={0}>
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 rounded-full bg-plum-voltage" />
              <span className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage">
                THE SOLUTION
              </span>
            </div>
            <h2 className="font-display font-light text-[clamp(36px,5vw,78px)] leading-[0.9] tracking-[-0.04em] text-bone mb-6 max-w-3xl">
              Every Agent Gets a Verifiable Credit Profile
            </h2>
            <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-2xl">
              We index 6 on-chain behavioral signals into a unified 0–1000 trust score — updated in real time, queryable via a single API call, built on open standards.
            </p>
          </div>
        </AnimatedCard>

        {/* Solution feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutionFeatures.map((feature, i) => (
            <AnimatedCard key={feature.title} index={i}>
              <div className="border border-white/[0.08] rounded-[24px] p-8 h-full relative overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ backgroundColor: feature.color, opacity: 0.4 }}
                />
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="font-display font-semibold text-bone text-lg tracking-[0.021em]">{feature.title}</h3>
                  <span
                    className="text-[11px] font-mono px-3 py-1.5 rounded-[24px] whitespace-nowrap flex-shrink-0 border"
                    style={{
                      borderColor: `${feature.color}30`,
                      color: feature.color,
                    }}
                  >
                    {feature.tag}
                  </span>
                </div>
                <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">{feature.body}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
