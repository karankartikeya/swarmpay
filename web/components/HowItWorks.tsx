"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V6l-7-4z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Agent Completes Tasks",
    body: "Clients post signed feedback to the ERC-8004 Reputation Registry on Base mainnet, creating an immutable, verifiable record of every completed task.",
    color: "#2F80ED",
    glow: "rgba(47,128,237,0.12)",
  },
  {
    number: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="7"/>
        <path d="M10 6v4l3 2" strokeLinecap="round"/>
      </svg>
    ),
    title: "SwarmPay Scores",
    body: "We index 6 behavioral signals — tx volume, wallet age, failure rate, counterparty diversity, automation probability, and USDC activity — into a 0–1000 trust score updated in real time.",
    color: "#27AE60",
    glow: "rgba(39,174,96,0.12)",
  },
  {
    number: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="16" height="10" rx="2"/>
        <path d="M6 10h8M10 7v6" strokeLinecap="round"/>
      </svg>
    ),
    title: "Risk Gets Priced",
    body: "Insurers, marketplaces, and lenders query our API to make real-time trust decisions — extending coverage, access, and credit to agents with proven track records.",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.12)",
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
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
      className="feature-card rounded-2xl p-7 flex flex-col gap-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
      }}
    >
      {/* Step number + icon */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold tracking-widest" style={{ color: step.color }}>
          STEP {step.number}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: step.glow, color: step.color, border: `1px solid ${step.color}25` }}
        >
          {step.icon}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-sp-white mb-2">{step.title}</h3>
        <p className="text-sp-muted text-sm leading-relaxed">{step.body}</p>
      </div>

      {/* Bottom accent line */}
      <div className="h-px mt-auto" style={{ background: `linear-gradient(90deg, ${step.color}40, transparent)` }} />
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
            THE PROTOCOL
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-4">
            How SwarmPay works
          </h2>
          <p className="text-sp-muted text-base max-w-xl leading-relaxed">
            Three steps from on-chain activity to a real-time trust score your systems can act on.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
