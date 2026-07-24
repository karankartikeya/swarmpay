import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import HowItWorks from "@/components/HowItWorks";
import IntegrationHighlight from "@/components/IntegrationHighlight";
import Demo from "@/components/Demo";
import UseCases from "@/components/UseCases";
import FAQ from "@/components/FAQ";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SwarmPay — Credit Bureau for AI Agents",
  description:
    "Behavioral trust scores for AI agents on Base mainnet. Score, explore, and rank agents by on-chain reputation.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-void">
      {/* Announcement Banner */}
      {/* <div className="bg-void border-b border-white/[0.06] text-bone text-center py-2.5 px-4 text-sm font-display tracking-[0.021em]">
        <span className="text-smoke">SwarmPay is live on Base Mainnet.</span>{" "}
        <a href="/explorer" className="text-plum-voltage hover:text-bone font-semibold transition-colors">Try the Explorer →</a>
      </div> */}
      <Navbar />
      <Hero />

      <div className="section-divider" />

      <ProblemSolution />

      <div className="section-divider" />

      <HowItWorks />

      <div className="section-divider" />

      <IntegrationHighlight />

      <div className="section-divider" />

      <Demo />

      <div className="section-divider" />

      <UseCases />

      <div className="section-divider" />

      {/* Platform features callout */}
      <section className="py-28 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">EXPLORE THE PLATFORM</p>
            <h2 className="font-display font-light text-[clamp(36px,4vw,48px)] leading-[1.1] tracking-[-0.04em] text-bone mb-4">
              Everything You Need to Evaluate AI Agents
            </h2>
            <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-xl mx-auto">
              From real-time scores to historical leaderboards — built for teams that need to trust AI agents with real money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/explorer" className="feature-card rounded-[24px] p-8 flex flex-col gap-5 group">
              <div className="w-11 h-11 rounded-[24px] border border-plum-voltage/20 flex items-center justify-center text-plum-voltage">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="10" cy="10" r="7"/><path d="M15.5 15.5l4 4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-bone mb-2 text-lg tracking-[0.021em] group-hover:text-plum-voltage transition-colors">
                  Agent Explorer
                </h3>
                <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">
                  Enter any Base mainnet address. Get a full behavioral trust profile — score, tier, signals, and transaction history.
                </p>
              </div>
              <span className="mt-auto text-plum-voltage text-sm font-display font-semibold tracking-[0.021em] group-hover:translate-x-1 transition-transform inline-block">
                Try Explorer →
              </span>
            </a>

            <a href="/leaderboard" className="feature-card rounded-[24px] p-8 flex flex-col gap-5 group">
              <div className="w-11 h-11 rounded-[24px] border border-lichen/20 flex items-center justify-center text-lichen">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 18l5-6 4.5 4.5 6.5-8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-bone mb-2 text-lg tracking-[0.021em] group-hover:text-lichen transition-colors">
                  Leaderboard
                </h3>
                <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">
                  See top AI agents on Base ranked by behavioral trust score. Updated every hour from live on-chain data.
                </p>
              </div>
              <span className="mt-auto text-plum-voltage text-sm font-display font-semibold tracking-[0.021em] group-hover:translate-x-1 transition-transform inline-block">
                View Leaderboard →
              </span>
            </a>

            <a href="/demo?mode=presentation" className="feature-card rounded-[24px] p-8 flex flex-col gap-5 group">
              <div className="w-11 h-11 rounded-[24px] border border-amber-spark/20 flex items-center justify-center text-amber-spark">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="6,3 18,11 6,19" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-bone mb-2 text-lg tracking-[0.021em] group-hover:text-amber-spark transition-colors">
                  Live Demo
                </h3>
                <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em]">
                  Watch a real x402 payment flow with SwarmPay trust gating. Good agent passes. Bad agent gets blocked.
                </p>
              </div>
              <span className="mt-auto text-plum-voltage text-sm font-display font-semibold tracking-[0.021em] group-hover:translate-x-1 transition-transform inline-block">
                Run Demo →
              </span>
            </a>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <FAQ />

      <div className="section-divider" />

      {/* Waitlist CTA */}
      <section id="waitlist" className="py-28 px-4 relative overflow-hidden">
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">EARLY ACCESS</p>
          <h2 className="font-display font-light text-[clamp(36px,4vw,48px)] leading-[1.1] tracking-[-0.04em] text-bone mb-4">
            We&apos;re Onboarding Design Partners
          </h2>
          <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash mb-10 max-w-lg mx-auto">
            Free API access in exchange for 30 minutes of feedback per month. Limited spots — we&apos;re working closely with early partners.
          </p>
          <WaitlistForm source="homepage" label="Join the waitlist — no spam, unsubscribe anytime." />
        </div>
      </section>

      <Footer />
    </main>
  );
}
