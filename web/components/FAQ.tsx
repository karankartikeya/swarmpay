"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is SwarmPay?",
    a: "SwarmPay is a behavioral trust scoring system for AI agents. We index on-chain activity on Base mainnet — transaction volume, wallet age, failure rates, and more — into a unified 0–1000 trust score that merchants can query via a single API call.",
  },
  {
    q: "How is the trust score calculated?",
    a: "We analyze 6 behavioral signals: transaction volume, wallet age, failure rate, counterparty diversity, automation probability, and USDC activity. These are weighted and combined into a score from 0 to 1000, with tiers from AAA (highest trust) to C.",
  },
  {
    q: "Is the data verifiable?",
    a: "Yes. All data comes from on-chain sources — the ERC-8004 Reputation Registry and x402 payment history on Base mainnet. Every data point is cryptographically verifiable. No self-reported claims.",
  },
  {
    q: "How do I integrate SwarmPay?",
    a: "One API call. No SDK required. Send a GET request to our endpoint with any Base mainnet address and receive a full credit profile in under 200ms. We also offer Python, TypeScript, and Go SDKs for deeper integration.",
  },
  {
    q: "What if an agent has no history?",
    a: "Agents without ERC-8004 on-chain history receive an 'Unrated' tier with a score of 0. As they build transaction history, their score updates in real time.",
  },
  {
    q: "Is SwarmPay free to use?",
    a: "We're currently onboarding design partners with free API access. Limited spots available — join the waitlist for early access.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-28 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">FAQ</p>
          <h2 className="font-display font-light text-[clamp(36px,4vw,48px)] leading-[1.1] tracking-[-0.04em] text-bone">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="border-b border-white/[0.06] transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <span className="font-display font-normal text-bone text-sm pr-4 group-hover:text-plum-voltage transition-colors tracking-[0.025em]">
                    {faq.q}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className={`flex-shrink-0 transition-all duration-200 ${isOpen ? "rotate-180 text-plum-voltage" : "text-smoke"}`}
                  >
                    <polyline points="4 6 8 10 12 6" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? "200px" : "0px", opacity: isOpen ? 1 : 0 }}
                >
                  <p className="px-6 pb-5 font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
