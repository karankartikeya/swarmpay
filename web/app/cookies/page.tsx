import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | SwarmPay",
  description: "SwarmPay Cookie Policy — what cookies we use and how to manage them.",
};

const COOKIES = [
  {
    name: "sp_cookie_consent",
    purpose: "Stores your cookie consent preference (granted/denied)",
    duration: "1 year",
    type: "Essential",
  },
  {
    name: "_ga, _ga_*",
    purpose: "Google Analytics — measures visitor traffic and behavior on our site",
    duration: "2 years",
    type: "Analytics",
  },
  {
    name: "_gid",
    purpose: "Google Analytics — distinguishes unique users",
    duration: "24 hours",
    type: "Analytics",
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-sp-bg text-sp-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">LEGAL</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-3">Cookie Policy</h1>
          <p className="text-sp-muted text-sm font-mono">Last updated: June 1, 2026</p>
        </div>

        <div className="prose-dark">
          <p>
            This Cookie Policy explains how SwarmPay uses cookies and similar technologies when you visit swarmpay.tech. By using our site, you agree to the use of cookies as described here.
          </p>

          <h2>What are cookies?</h2>
          <p>
            Cookies are small text files stored on your device by your browser. They allow websites to remember your preferences and understand how you interact with the site.
          </p>

          <h2>Cookies we use</h2>
        </div>

        {/* Cookie table */}
        <div className="mt-6 rounded-xl border border-sp-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sp-border bg-sp-surface/60">
                  <th className="text-left px-4 py-3 text-sp-muted text-xs font-mono uppercase tracking-wide">Cookie</th>
                  <th className="text-left px-4 py-3 text-sp-muted text-xs font-mono uppercase tracking-wide">Purpose</th>
                  <th className="text-left px-4 py-3 text-sp-muted text-xs font-mono uppercase tracking-wide">Duration</th>
                  <th className="text-left px-4 py-3 text-sp-muted text-xs font-mono uppercase tracking-wide">Type</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c, i) => (
                  <tr key={c.name} className={`border-b border-sp-border/50 ${i % 2 === 0 ? "bg-sp-surface/20" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-sp-white">{c.name}</td>
                    <td className="px-4 py-3 text-sp-muted text-xs">{c.purpose}</td>
                    <td className="px-4 py-3 text-sp-muted text-xs whitespace-nowrap">{c.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        c.type === "Essential"
                          ? "text-sp-primary border-sp-primary/30 bg-sp-primary/10"
                          : "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                      }`}>
                        {c.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="prose-dark mt-6">
          <h2>Essential cookies</h2>
          <p>
            Essential cookies are required for the site to function. They cannot be disabled. The <code>sp_cookie_consent</code> cookie stores your own privacy preference — without it, we couldn&apos;t remember that you&apos;ve opted out.
          </p>

          <h2>Analytics cookies</h2>
          <p>
            Analytics cookies (Google Analytics 4) help us understand how visitors use SwarmPay — which pages are popular, where users drop off, and how our product is performing. <strong>These cookies are only set after you give explicit consent.</strong> If you decline, no analytics data is collected.
          </p>
          <p>
            We have configured Google Analytics with IP anonymization enabled. No personal data is shared with Google for advertising purposes.
          </p>

          <h2>Managing cookies</h2>
          <p>You have several options to manage or disable cookies:</p>
          <ul>
            <li><strong>Cookie banner:</strong> Use the Accept/Decline buttons on the banner that appears when you first visit SwarmPay.</li>
            <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies. Note that blocking essential cookies may break site functionality.</li>
            <li><strong>Google Analytics opt-out:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</li>
          </ul>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Cookie Policy when we add or change the cookies we use. Material changes will be communicated via the cookie banner.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? Email <a href="mailto:privacy@swarmpay.tech">privacy@swarmpay.tech</a>.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
