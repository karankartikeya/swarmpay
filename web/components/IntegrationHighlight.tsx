"use client";

import { useEffect, useRef, useState } from "react";

export default function IntegrationHighlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-28 px-4 relative overflow-hidden">
      <div
        ref={ref}
        className="relative max-w-[1200px] mx-auto text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">SIMPLE INTEGRATION</p>
        <h2 className="font-display font-light text-[clamp(36px,5vw,78px)] leading-[0.9] tracking-[-0.04em] text-bone mb-4">
          Score Any Agent in{" "}
          <span className="gradient-text">1 API Call</span>
        </h2>
        <p className="font-display font-normal text-[18px] leading-[1.5] tracking-[0.025em] text-ash max-w-xl mx-auto mb-12">
          No SDK required. No complex setup. Query our REST API and get a full credit profile in under 200ms.
        </p>

        {/* Code block */}
        <div className="max-w-2xl mx-auto border border-white/[0.08] rounded-[24px] p-6 text-left">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/[0.06]">
            <span className="w-3 h-3 rounded-full bg-white/20" />
            <span className="w-3 h-3 rounded-full bg-white/20" />
            <span className="w-3 h-3 rounded-full bg-white/20" />
            <span className="text-smoke text-xs ml-2 font-mono">terminal</span>
          </div>
          <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
            <code>
              <span className="text-smoke"># Score any agent — one line</span>
              {"\n"}
              <span className="text-plum-voltage">curl</span>{" "}
              <span className="text-bone">https://api.swarmpay.tech/v0/score/</span>
              <span className="text-smoke">{"<agent_address>"}</span>
              {"\n\n"}
              <span className="text-smoke"># Response</span>
              {"\n"}
              <span className="text-bone">{"{"}</span>
              {"\n  "}
              <span className="text-plum-voltage">&quot;score&quot;</span>
              <span className="text-bone">: </span>
              <span className="text-amber-spark">742</span>
              <span className="text-bone">,</span>
              {"\n  "}
              <span className="text-plum-voltage">&quot;tier&quot;</span>
              <span className="text-bone">: </span>
              <span className="text-lichen">&quot;AA&quot;</span>
              <span className="text-bone">,</span>
              {"\n  "}
              <span className="text-plum-voltage">&quot;confidence&quot;</span>
              <span className="text-bone">: </span>
              <span className="text-lichen">&quot;medium&quot;</span>
              {"\n"}
              <span className="text-bone">{"}"}</span>
            </code>
          </pre>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            "Setup in 60 Seconds",
            "99.9% Uptime SLA",
            "Webhook Support",
            "SDKs: Python · TypeScript · Go",
          ].map((f) => (
            <span
              key={f}
              className="text-xs font-mono text-smoke border border-white/[0.08] px-4 py-2 rounded-[24px]"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
