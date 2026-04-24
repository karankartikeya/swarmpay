const steps = [
  {
    number: "01",
    title: "Agent Completes Tasks",
    body: "Clients post signed feedback to the ERC-8004 Reputation Registry on Base mainnet, creating an immutable, verifiable record of every completed task.",
  },
  {
    number: "02",
    title: "SwarmPay Aggregates",
    body: "We index reputation signals, x402 payment proofs, and validation attestations into a unified score — updated in real time as new on-chain events arrive.",
  },
  {
    number: "03",
    title: "Risk Gets Priced",
    body: "Insurers, marketplaces, and lenders query our API to make real-time trust decisions — extending coverage, access, and credit to agents with proven track records.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
          THE PROTOCOL
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-sp-white mb-12">
          How SwarmPay Works
        </h2>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="flex md:flex-1 items-start gap-4 w-full">
              {/* Card */}
              <div className="flex-1 bg-sp-surface border border-sp-border border-t-2 border-t-sp-primary rounded-xl p-6 card-hover">
                <p className="text-sp-primary font-mono text-sm mb-3">
                  {step.number}
                </p>
                <h3 className="font-display text-xl text-sp-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sp-muted text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>

              {/* Arrow connector (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center self-center pt-2 text-sp-primary text-2xl flex-shrink-0">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
