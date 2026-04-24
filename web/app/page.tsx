import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Demo from "@/components/Demo";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import ApiSnippet from "@/components/ApiSnippet";
import Waitlist from "@/components/Waitlist";
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
      <Waitlist />
      <Footer />
    </main>
  );
}
