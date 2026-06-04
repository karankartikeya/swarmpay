import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SwarmPay",
  description: "SwarmPay Privacy Policy — how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-sp-bg text-sp-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">LEGAL</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-3">Privacy Policy</h1>
          <p className="text-sp-muted text-sm font-mono">Last updated: June 1, 2026</p>
        </div>

        <div className="prose-dark">
          <p>
            SwarmPay (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates swarmpay.tech and the SwarmPay API. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>

          <h2>1. Information We Collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li><strong>Waitlist submissions:</strong> Email address and optionally an agent wallet address when you sign up for early access.</li>
            <li><strong>API inquiries:</strong> Contact information provided when reaching out to us directly.</li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li><strong>Usage data:</strong> Pages visited, time spent, referral source, browser type, and device information — collected via Google Analytics (only after cookie consent).</li>
            <li><strong>Log data:</strong> IP addresses, request timestamps, and API call patterns for security and reliability purposes.</li>
            <li><strong>Cookies:</strong> Session cookies necessary for site functionality and, with your consent, analytics cookies. See our <a href="/cookies">Cookie Policy</a> for details.</li>
          </ul>

          <h3>Blockchain data</h3>
          <p>
            The SwarmPay Explorer and API process publicly available on-chain data from Base mainnet (wallet addresses, transaction history, token transfers). This data is inherently public and we do not consider it personal data under applicable law.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To operate, maintain, and improve our services</li>
            <li>To send you product updates and early access invitations (waitlist emails only)</li>
            <li>To analyze usage patterns and improve user experience</li>
            <li>To detect, prevent, and address technical issues or abuse</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul>
            <li><strong>Supabase:</strong> Database infrastructure for waitlist storage (SOC 2 Type II certified)</li>
            <li><strong>Vercel:</strong> Hosting and deployment infrastructure</li>
            <li><strong>Google Analytics:</strong> Usage analytics (only after cookie consent; data is anonymized)</li>
            <li><strong>Law enforcement:</strong> Where required by applicable law or court order</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            Waitlist email addresses are retained until you request deletion or until the waitlist program ends. Analytics data is retained per Google&apos;s default retention settings (14 months). Server logs are retained for 30 days.
          </p>

          <h2>5. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <a href="mailto:privacy@swarmpay.tech">privacy@swarmpay.tech</a>.
          </p>

          <h2>6. Cookies</h2>
          <p>
            We use essential cookies for site functionality and, with your consent, analytics cookies. You can manage your preferences at any time via the cookie banner or by clearing your browser cookies. See our <a href="/cookies">Cookie Policy</a> for full details.
          </p>

          <h2>7. Security</h2>
          <p>
            We implement industry-standard security measures including HTTPS encryption, access controls, and regular security reviews. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under 13 years of age. We do not knowingly collect personal information from children.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify waitlist subscribers of material changes by email. Continued use of our services after changes constitutes acceptance.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            For privacy-related questions or requests, contact us at:{" "}
            <a href="mailto:privacy@swarmpay.tech">privacy@swarmpay.tech</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
