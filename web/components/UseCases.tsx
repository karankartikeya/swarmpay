"use client";

import { useEffect, useRef, useState } from "react";

const cases = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M11 2L3 6.5v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11v-5L11 2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.5 11l2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#2F80ED",
    glow: "rgba(47,128,237,0.1)",
    title: "Agent Insurers",
    body: "Price liability coverage against verified on-chain performance history — not self-reported claims. Reduce adverse selection with cryptographic proof of past behavior.",
    tag: "Mount · AIUC · Klaimee",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="6" width="18" height="13" rx="2" strokeLinejoin="round"/>
        <path d="M7 6V4a4 4 0 0 1 8 0v2" strokeLinecap="round"/>
        <circle cx="11" cy="13" r="2"/>
      </svg>
    ),
    color: "#27AE60",
    glow: "rgba(39,174,96,0.1)",
    title: "Agent Marketplaces",
    body: "Vet agents before granting access to production systems, APIs, and financial accounts. Surface trust scores directly in your listing UI with a single API call.",
    tag: "Humwork · agent.ai",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="5" width="18" height="14" rx="2"/>
        <path d="M2 10h18M7 15h3" strokeLinecap="round"/>
      </svg>
    ),
    color: "#F2994A",
    glow: "rgba(242,153,74,0.1)",
    title: "Agent Lenders",
    body: "Extend credit lines based on verified on-chain earnings and task completion rates. Underwrite agent working capital with real payment history, not promises.",
    tag: "Coming Q3 2026",
  },
];

function CaseCard({ c, index }: { c: typeof cases[0]; index: number }) {
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
      className="feature-card rounded-2xl p-7 flex flex-col gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 100}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 100}ms`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.glow, color: c.color, border: `1px solid ${c.color}25` }}
      >
        {c.icon}
      </div>

      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold text-sp-white mb-2">{c.title}</h3>
        <p className="text-sp-muted text-sm leading-relaxed">{c.body}</p>
      </div>

      <span
        className="text-xs font-mono px-2.5 py-1 rounded-md self-start"
        style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}
      >
        {c.tag}
      </span>
    </div>
  );
}

export default function UseCases() {
  return (
    <section className="py-28 px-4" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(13,17,23,0.5) 50%, transparent 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-14">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
            WHO USES IT
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-4">
            Built for the agent economy
          </h2>
          <p className="text-sp-muted text-base max-w-xl leading-relaxed">
            Infrastructure for every layer of the AI agent stack — from coverage to credit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cases.map((c, i) => (
            <CaseCard key={c.title} c={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
