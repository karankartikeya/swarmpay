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
  title: "SwarmPay — Trust Infrastructure for AI Agents",
  description: "Behavioral trust scores for AI agents on Base mainnet. Score, explore, and rank agents by on-chain reputation.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-sp-bg">
      <Navbar />
      <Hero />
      <Demo />
      <HowItWorks />
      <UseCases />
      <ApiSnippet />

      {/* Features highlight */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest text-center mb-3">EXPLORE THE PLATFORM</p>
          <h2 className="font-display text-2xl md:text-3xl text-sp-white text-center mb-10">
            Everything you need to evaluate AI agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-sp-surface border border-sp-border rounded-xl p-6 flex flex-col gap-4 card-hover">
              <div className="w-8 h-8 rounded-lg bg-sp-primary/10 border border-sp-primary/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2F80ED" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-1">Agent Explorer</h3>
                <p className="text-sp-muted text-sm leading-relaxed">Score any AI agent on Base mainnet instantly</p>
              </div>
              <a href="/explorer" className="mt-auto text-sp-primary text-sm hover:text-blue-400 transition-colors font-medium">
                Try Explorer →
              </a>
            </div>

            <div className="bg-sp-surface border border-sp-border rounded-xl p-6 flex flex-col gap-4 card-hover">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#27AE60" strokeWidth="1.5">
                  <path d="M2 12l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-1">Leaderboard</h3>
                <p className="text-sp-muted text-sm leading-relaxed">See the top agents by behavioral trust score</p>
              </div>
              <a href="/leaderboard" className="mt-auto text-sp-primary text-sm hover:text-blue-400 transition-colors font-medium">
                View Leaderboard →
              </a>
            </div>

            <div className="bg-sp-surface border border-sp-border rounded-xl p-6 flex flex-col gap-4 card-hover">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9B59B6" strokeWidth="1.5">
                  <polygon points="5,2 14,8 5,14" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-sp-white mb-1">Live Demo</h3>
                <p className="text-sp-muted text-sm leading-relaxed">Watch a real x402 payment happen in milliseconds</p>
              </div>
              <a href="/demo?mode=presentation" className="mt-auto text-sp-primary text-sm hover:text-blue-400 transition-colors font-medium">
                Run Demo →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">EARLY ACCESS</p>
          <h2 className="font-display text-3xl md:text-4xl text-sp-white mb-4">We&apos;re onboarding design partners</h2>
          <p className="text-sp-muted mb-10 leading-relaxed">Free API access in exchange for 30 minutes of feedback per month. Limited spots.</p>
          <WaitlistForm source="homepage" label="Request early access — no spam, unsubscribe anytime." />
        </div>
      </section>
      <Footer />
    </main>
  );
}
