import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | SwarmPay",
  description: "SwarmPay Terms of Service — the rules governing use of our platform and API.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-sp-bg text-sp-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">LEGAL</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-3">Terms of Service</h1>
          <p className="text-sp-muted text-sm font-mono">Last updated: June 1, 2026</p>
        </div>

        <div className="prose-dark">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of SwarmPay&apos;s website, API, and related services (collectively, the &quot;Services&quot;). By using the Services, you agree to these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Services, you confirm that you are at least 18 years old, have read and understood these Terms, and agree to be bound by them.
          </p>

          <h2>2. Description of Services</h2>
          <p>
            SwarmPay provides behavioral trust scoring infrastructure for AI agents on the Base blockchain network. Our services include:
          </p>
          <ul>
            <li>The Agent Explorer — a tool to query behavioral trust scores for any Base mainnet address</li>
            <li>The Trust Score API — programmatic access to agent scores and signals</li>
            <li>The Leaderboard — a ranked view of top agents by trust score</li>
            <li>Score Badges — embeddable SVG badges displaying agent trust scores</li>
          </ul>

          <h2>3. Beta Services</h2>
          <p>
            SwarmPay is currently in beta. Services may be modified, interrupted, or discontinued at any time without notice. Trust scores are provided for informational purposes only and should not be the sole basis for financial or risk decisions.
          </p>

          <h2>4. Permitted Use</h2>
          <p>You may use the Services to:</p>
          <ul>
            <li>Query trust scores for AI agents you operate or are evaluating</li>
            <li>Integrate score data into your own products or workflows</li>
            <li>Display score badges on your website or documentation</li>
          </ul>

          <h2>5. Prohibited Use</h2>
          <p>You must not:</p>
          <ul>
            <li>Use the Services for any unlawful purpose or in violation of applicable regulations</li>
            <li>Attempt to reverse-engineer, scrape at scale, or extract our entire dataset</li>
            <li>Misrepresent trust scores or present them in a misleading context</li>
            <li>Use the Services to discriminate against individuals based on protected characteristics</li>
            <li>Attempt to manipulate or game the scoring system</li>
            <li>Interfere with the security or integrity of the Services</li>
          </ul>

          <h2>6. API Usage</h2>
          <p>
            API access is subject to rate limits. Abuse of the API (including automated scraping, excessive requests, or attempts to extract training data) may result in suspension of access without notice.
          </p>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. SWARMPAY DOES NOT WARRANT THAT TRUST SCORES ARE ACCURATE, COMPLETE, OR SUITABLE FOR ANY PARTICULAR PURPOSE. SCORES ARE BASED ON PUBLICLY AVAILABLE ON-CHAIN DATA AND MAY NOT REFLECT AN AGENT&apos;S TRUE RELIABILITY OR INTENTIONS.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SWARMPAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICES, INCLUDING ANY RELIANCE ON TRUST SCORES FOR FINANCIAL OR RISK DECISIONS.
          </p>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold SwarmPay harmless from any claims, damages, or expenses arising from your use of the Services or violation of these Terms.
          </p>

          <h2>10. Intellectual Property</h2>
          <p>
            The SwarmPay name, logo, scoring methodology, and software are proprietary to SwarmPay. On-chain data processed by the Services remains public domain per the nature of blockchain technology.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. Continued use of the Services after changes constitutes acceptance. We will provide notice of material changes via email to registered users.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Delaware, United States, without regard to conflict of law principles.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a href="mailto:legal@swarmpay.tech">legal@swarmpay.tech</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
