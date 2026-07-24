"use client";

import { useEffect, useRef, useState } from "react";

const cases = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M14 3L5 8.5v7c0 6 4.5 12 9 13.5 4.5-1.5 9-7.5 9-13.5v-7L14 3z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 14l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Agent Insurers",
    subtitle: "Price coverage against verified performance",
    body: "Underwrite liability coverage using cryptographic proof of on-chain behavior. Reduce adverse selection by scoring agents on actual payment history — not self-reported claims.",
    partners: ["Mount", "AIUC", "Klaimee"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="8" width="22" height="16" rx="2.5" strokeLinejoin="round"/>
        <path d="M9 8V6a5 5 0 0 1 10 0v2" strokeLinecap="round"/>
        <circle cx="14" cy="17" r="2.5"/>
      </svg>
    ),
    title: "Agent Marketplaces",
    subtitle: "Vet agents before granting access",
    body: "Surface trust scores in your listing UI with a single API call. Gate access to production systems, APIs, and financial accounts based on verified on-chain reputation.",
    partners: ["Humwork", "agent.ai"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="7" width="22" height="17" rx="2.5"/>
        <path d="M3 13h22M9 19h4" strokeLinecap="round"/>
      </svg>
    ),
    title: "Agent Lenders",
    subtitle: "Extend credit with real payment history",
    body: "Underwrite agent working capital based on verified on-chain earnings and task completion rates. Real data, not promises — enabling a new class of agent financial products.",
    partners: ["Coming Q3 2026"],
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
      className="border border-white/[0.08] rounded-[24px] p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:border-plum-voltage/30"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
      }}
    >
      <div className="w-12 h-12 rounded-[24px] flex items-center justify-center flex-shrink-0 border border-plum-voltage/20 text-plum-voltage">
        {c.icon}
      </div>

      <div className="flex-1">
        <h3 className="font-display font-semibold text-xl text-bone tracking-[0.021em] mb-1">{c.title}</h3>
        <p className="text-plum-voltage text-sm font-display font-semibold tracking-[0.021em] mb-3">{c.subtitle}</p>
        <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">{c.body}</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/[0.06]">
        {c.partners.map((p) => (
          <span
            key={p}
            className="text-[11px] font-mono px-2.5 py-1 rounded-[24px] text-smoke border border-white/[0.08]"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function UseCases() {
  return (
    <section id="use-cases" className="py-28 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">
            USE CASES
          </p>
          <h2 className="font-display font-light text-[clamp(36px,5vw,78px)] leading-[0.9] tracking-[-0.04em] text-bone mb-4">
            Built for the Agent Economy
          </h2>
          <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-xl mx-auto">
            Infrastructure for every layer of the AI agent stack — from coverage to credit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <CaseCard key={c.title} c={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
