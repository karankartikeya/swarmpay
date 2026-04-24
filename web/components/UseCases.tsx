const cases = [
  {
    icon: "🛡️",
    title: "Agent Insurers",
    body: "Price liability coverage against verified on-chain performance history — not self-reported claims. Reduce adverse selection with cryptographic proof of past behavior.",
    tag: "Mount · AIUC · Klaimee",
  },
  {
    icon: "🏪",
    title: "Agent Marketplaces",
    body: "Vet agents before granting access to production systems, APIs, and financial accounts. Surface trust scores directly in your listing UI.",
    tag: "Humwork · agent.ai",
  },
  {
    icon: "💳",
    title: "Agent Lenders",
    body: "Extend credit lines based on verified on-chain earnings and task completion rates. Underwrite agent working capital with real payment history.",
    tag: "Coming Q3 2026",
  },
];

export default function UseCases() {
  return (
    <section className="py-24 px-4 bg-sp-surface/30">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
          WHO USES IT
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-sp-white mb-12">
          Built for the agent economy&apos;s infrastructure layer
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div
              key={c.title}
              className="bg-sp-surface border border-sp-border border-t-2 border-t-sp-primary rounded-xl p-6 card-hover flex flex-col"
            >
              <div className="text-3xl mb-4">{c.icon}</div>
              <h3 className="font-display text-xl text-sp-white mb-2">
                {c.title}
              </h3>
              <p className="text-sp-muted text-sm leading-relaxed mb-4 flex-1">
                {c.body}
              </p>
              <span className="text-xs font-mono text-sp-primary bg-sp-primary/10 px-2 py-1 rounded self-start">
                {c.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
