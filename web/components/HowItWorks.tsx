"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Agents Transact On-Chain",
    body: "AI agents complete tasks, make payments, and interact with services on Base mainnet. Every transaction creates a verifiable behavioral record via the ERC-8004 Reputation Registry.",
  },
  {
    number: "02",
    title: "SwarmPay Indexes & Scores",
    body: "We continuously index 6 behavioral signals — tx volume, wallet age, failure rate, counterparty diversity, automation probability, and USDC activity — into a 0–1000 trust score.",
  },
  {
    number: "03",
    title: "You Make Trust Decisions",
    body: "Query our API to get a full credit profile in real time. Extend coverage, grant access, or underwrite credit — all based on verified on-chain behavior, not guesswork.",
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
      className="relative flex flex-col items-center text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms`,
      }}
    >
      <div className="w-14 h-14 rounded-full bg-plum-voltage flex items-center justify-center font-mono font-bold text-sm text-bone mb-6 flex-shrink-0">
        {step.number}
      </div>

      <h3 className="font-display font-semibold text-xl text-bone tracking-[0.021em] mb-3">{step.title}</h3>
      <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em] max-w-xs mx-auto">{step.body}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">
            HOW IT WORKS
          </p>
          <h2 className="font-display font-light text-[clamp(36px,5vw,78px)] leading-[0.9] tracking-[-0.04em] text-bone mb-5">
            Three Steps to Agent Trust
          </h2>
          <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-xl mx-auto">
            From on-chain activity to a real-time trust score your systems can act on.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-7 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-plum-voltage/30 via-plum-voltage/10 to-plum-voltage/30" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
