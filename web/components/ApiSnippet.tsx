export default function ApiSnippet() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-3">
          SIMPLE INTEGRATION
        </p>
        <h2 className="font-display font-light text-[clamp(36px,4vw,48px)] leading-[1.1] tracking-[-0.04em] text-bone mb-12">
          One API call. Full agent credit profile.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: curl command */}
          <div className="border border-white/[0.08] rounded-[24px] p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-smoke text-xs ml-2 font-mono">terminal</span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <code>
                <span className="text-plum-voltage">curl</span>{" "}
                <span className="text-bone">
                  https://api.swarmpay.tech/v0/score/
                  <span className="text-smoke">{"{agent_address}"}</span>
                </span>
                {"\n\n"}
                <span className="text-smoke"># With authentication</span>
                {"\n"}
                <span className="text-plum-voltage">curl</span>{" "}
                <span className="text-smoke">-H</span>{" "}
                <span className="text-bone">
                  &quot;Authorization: Bearer $API_KEY&quot;
                </span>{" "}
                <span className="text-smoke">\</span>
                {"\n     "}
                <span className="text-bone">
                  https://api.swarmpay.tech/v0/score/
                  <span className="text-smoke">{"{agent_address}"}</span>
                </span>
              </code>
            </pre>
          </div>

          {/* Right: JSON response */}
          <div className="border border-white/[0.08] rounded-[24px] p-6">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-smoke text-xs ml-2 font-mono">response</span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <code>
                {"{\n"}
                {"  "}<span className="text-plum-voltage">&quot;agent_id&quot;</span>{": "}<span className="text-lichen">&quot;0x8004...BD9e&quot;</span>{",\n"}
                {"  "}<span className="text-plum-voltage">&quot;score&quot;</span>{": "}<span className="text-amber-spark">742</span>{",\n"}
                {"  "}<span className="text-plum-voltage">&quot;tier&quot;</span>{": "}<span className="text-lichen">&quot;AA&quot;</span>{",\n"}
                {"  "}<span className="text-plum-voltage">&quot;confidence&quot;</span>{": "}<span className="text-lichen">&quot;medium&quot;</span>{",\n"}
                {"  "}<span className="text-plum-voltage">&quot;components&quot;</span>{": {\n"}
                {"    "}<span className="text-plum-voltage">&quot;reputation&quot;</span>{": "}<span className="text-amber-spark">297</span>{",\n"}
                {"    "}<span className="text-plum-voltage">&quot;volume&quot;</span>{": "}<span className="text-amber-spark">186</span>{",\n"}
                {"    "}<span className="text-plum-voltage">&quot;payment_reliability&quot;</span>{": "}<span className="text-amber-spark">164</span>{",\n"}
                {"    "}<span className="text-plum-voltage">&quot;validation_rate&quot;</span>{": "}<span className="text-amber-spark">95</span>{"\n"}
                {"  }\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-8">
          {[
            "< 200ms p99",
            "99.9% uptime SLA",
            "Webhook support",
            "SDKs: Python · TypeScript · Go",
          ].map((f) => (
            <span
              key={f}
              className="text-xs font-mono text-smoke border border-white/[0.08] px-3 py-1.5 rounded-[24px]"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
