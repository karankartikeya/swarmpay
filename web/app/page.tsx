import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Demo from "@/components/Demo";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import ApiSnippet from "@/components/ApiSnippet";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-sp-bg">
      <Navbar />
      <Hero />
      <Demo />
      <HowItWorks />
      <UseCases />
      <ApiSnippet />
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
