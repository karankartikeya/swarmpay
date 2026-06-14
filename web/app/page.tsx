import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Demo from "@/components/Demo";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import ApiSnippet from "@/components/ApiSnippet";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SwarmPay — Credit Bureau for AI Agents",
  description:
    "Behavioral trust scores for AI agents on Base mainnet. Score, explore, and rank agents by on-chain reputation.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-sp-bg">
      <Navbar />
      <Hero />

      {/* Thin divider */}
      <div className="section-divider" />

      <HowItWorks />

      <div className="section-divider" />

      {/* Explorer + Leaderboard feature callout */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">EXPLORE THE PLATFORM</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-4">
              Everything you need to evaluate AI agents
            </h2>
            <p className="text-sp-muted text-base max-w-xl leading-relaxed">
              From real-time scores to historical leaderboards — built for the teams that need to trust AI agents with real money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Explorer card */}
            <a href="/explorer" className="feature-card rounded-2xl p-7 flex flex-col gap-5 group">
              <div className="w-10 h-10 rounded-xl bg-sp-primary/10 border border-sp-primary/20 flex items-center justify-center text-sp-primary">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="9" r="6"/><path d="M14 14l4 4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-2 text-lg group-hover:text-sp-primary transition-colors">
                  Agent Explorer
                </h3>
                <p className="text-sp-muted text-sm leading-relaxed">
                  Enter any Base mainnet address. Get a full behavioral trust profile in seconds — score, tier, signals, and transaction history.
                </p>
              </div>
              <span className="mt-auto text-sp-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                Try Explorer →
              </span>
            </a>

            {/* Leaderboard card */}
            <a href="/leaderboard" className="feature-card rounded-2xl p-7 flex flex-col gap-5 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 16l4.5-5 4 4 5.5-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-2 text-lg group-hover:text-emerald-400 transition-colors">
                  Leaderboard
                </h3>
                <p className="text-sp-muted text-sm leading-relaxed">
                  See the top AI agents on Base ranked by behavioral trust score. Updated every hour from live on-chain data.
                </p>
              </div>
              <span className="mt-auto text-sp-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                View Leaderboard →
              </span>
            </a>

            {/* Demo card */}
            <a href="/demo?mode=presentation" className="feature-card rounded-2xl p-7 flex flex-col gap-5 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5,3 17,10 5,17" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-2 text-lg group-hover:text-purple-400 transition-colors">
                  Live Demo
                </h3>
                <p className="text-sp-muted text-sm leading-relaxed">
                  Watch a real x402 payment flow with SwarmPay trust gating. Good agent passes. Bad agent gets blocked.
                </p>
              </div>
              <span className="mt-auto text-sp-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                Run Demo →
              </span>
            </a>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <Demo />

      <div className="section-divider" />

      <UseCases />

      <div className="section-divider" />

      <ApiSnippet />

      <div className="section-divider" />

      {/* Waitlist */}
      <section id="waitlist" className="py-28 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(47,128,237,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">EARLY ACCESS</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-4">
            We&apos;re onboarding design partners
          </h2>
          <p className="text-sp-muted mb-10 leading-relaxed max-w-lg mx-auto">
            Free API access in exchange for 30 minutes of feedback per month. Limited spots — we&apos;re working closely with early partners.
          </p>
          <WaitlistForm source="homepage" label="Join the waitlist — no spam, unsubscribe anytime." />
        </div>
      </section>

      <Footer />
    </main>
  );
}
