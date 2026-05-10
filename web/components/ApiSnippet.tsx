export default function ApiSnippet() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
          SIMPLE INTEGRATION
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-sp-white mb-12">
          One API call. Full agent credit profile.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: curl command */}
          <div className="bg-sp-bg border border-sp-border rounded-xl p-6">
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-sp-border">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-sp-muted text-xs ml-2 font-mono">
                terminal
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <code>
                <span className="text-sp-primary">curl</span>{" "}
                <span className="text-green-400">
                  https://api.swarmpay.tech/v0/score/
                  <span className="text-sp-muted">{"{agent_address}"}</span>
                </span>
                {"\n\n"}
                <span className="text-sp-muted"># With authentication</span>
                {"\n"}
                <span className="text-sp-primary">curl</span>{" "}
                <span className="text-sp-muted">-H</span>{" "}
                <span className="text-green-400">
                  &quot;Authorization: Bearer $API_KEY&quot;
                </span>{" "}
                <span className="text-sp-muted">\</span>
                {"\n     "}
                <span className="text-green-400">
                  https://api.swarmpay.tech/v0/score/
                  <span className="text-sp-muted">{"{agent_address}"}</span>
                </span>
              </code>
            </pre>
          </div>

          {/* Right: JSON response */}
          <div className="bg-sp-bg border border-sp-border rounded-xl p-6">
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-sp-border">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-sp-muted text-xs ml-2 font-mono">
                response
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <code>
                {"{\n"}
                {"  "}
                <span className="text-blue-400">&quot;agent_id&quot;</span>
                {": "}
                <span className="text-green-400">
                  &quot;0x8004...BD9e&quot;
                </span>
                {",\n"}
                {"  "}
                <span className="text-blue-400">&quot;score&quot;</span>
                {": "}
                <span className="text-orange-400">742</span>
                {",\n"}
                {"  "}
                <span className="text-blue-400">&quot;tier&quot;</span>
                {": "}
                <span className="text-green-400">&quot;AA&quot;</span>
                {",\n"}
                {"  "}
                <span className="text-blue-400">&quot;confidence&quot;</span>
                {": "}
                <span className="text-green-400">&quot;medium&quot;</span>
                {",\n"}
                {"  "}
                <span className="text-blue-400">&quot;components&quot;</span>
                {": {\n"}
                {"    "}
                <span className="text-blue-400">&quot;reputation&quot;</span>
                {": "}
                <span className="text-orange-400">297</span>
                {",\n"}
                {"    "}
                <span className="text-blue-400">&quot;volume&quot;</span>
                {": "}
                <span className="text-orange-400">186</span>
                {",\n"}
                {"    "}
                <span className="text-blue-400">
                  &quot;payment_reliability&quot;
                </span>
                {": "}
                <span className="text-orange-400">164</span>
                {",\n"}
                {"    "}
                <span className="text-blue-400">
                  &quot;validation_rate&quot;
                </span>
                {": "}
                <span className="text-orange-400">95</span>
                {"\n"}
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
              className="text-xs font-mono text-sp-muted bg-sp-surface border border-sp-border px-3 py-1.5 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
