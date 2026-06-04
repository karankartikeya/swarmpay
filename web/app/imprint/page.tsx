import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint | SwarmPay",
  description: "Legal imprint and company information for SwarmPay.",
};

export default function ImprintPage() {
  return (
    <main className="min-h-screen bg-sp-bg text-sp-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">LEGAL</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sp-white mb-3">Imprint</h1>
          <p className="text-sp-muted text-sm font-mono">Last updated: June 1, 2026</p>
        </div>

        <div className="prose-dark">
          <p>
            This imprint provides the legally required information about the operator of swarmpay.tech in accordance with applicable law (including §5 TMG for users in Germany/EU).
          </p>

          <h2>Service Operator</h2>
          <p>
            SwarmPay<br />
            A product of Viberank Technologies<br />
            Germany
          </p>

          <h2>Contact</h2>
          <p>
            Email: <a href="mailto:karan@swarmpay.tech">karan@swarmpay.tech</a><br />
            Website: <a href="https://swarmpay.tech">swarmpay.tech</a>
          </p>

          <h2>Responsible for Content</h2>
          <p>
            Karan Kartikeya<br />
            SwarmPay<br />
            Email: <a href="mailto:karan@swarmpay.tech">karan@swarmpay.tech</a>
          </p>

          <h2>Platform Status</h2>
          <p>
            SwarmPay is currently in public beta. The platform provides AI agent behavioral trust scores derived from publicly available on-chain data on the Base blockchain network. Trust scores are informational only and do not constitute financial advice, credit ratings, or investment recommendations.
          </p>

          <h2>Disclaimer of Liability</h2>
          <h3>Content</h3>
          <p>
            The contents of this website have been compiled with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the information provided. On-chain data is sourced from third-party providers (Alchemy, Base mainnet) and we are not liable for errors, omissions, or inaccuracies in that data.
          </p>

          <h3>External Links</h3>
          <p>
            This website contains links to external websites. We have no influence over the content of those sites and therefore accept no liability for the content of external links. The operators of linked pages are solely responsible for their content.
          </p>

          <h3>Blockchain Data</h3>
          <p>
            All wallet addresses and transaction data processed by SwarmPay are publicly available on the Base blockchain. We do not store, modify, or enrich this data beyond what is necessary to compute behavioral trust scores. SwarmPay is not a credit rating agency as defined under applicable financial regulations.
          </p>

          <h2>Copyright</h2>
          <p>
            The content and works on this website created by SwarmPay are subject to copyright law. Reproduction, adaptation, distribution, or any form of commercialization of such material beyond the scope of copyright law requires the prior written consent of SwarmPay. Downloads and copies of the website are only permitted for private, non-commercial use.
          </p>

          <h2>EU Online Dispute Resolution</h2>
          <p>
            The European Commission provides a platform for online dispute resolution (ODR):{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . We are not obligated to participate in dispute resolution proceedings before a consumer arbitration board and do not voluntarily do so.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
