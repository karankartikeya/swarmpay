export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sp-border bg-sp-surface/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display font-bold text-xl text-sp-white">SwarmPay</span>
              <span className="bg-sp-primary/20 text-sp-primary text-[10px] px-2 py-0.5 rounded-full font-mono tracking-wide">
                BETA
              </span>
            </div>
            <p className="text-sp-muted text-sm leading-relaxed max-w-xs mb-5">
              The behavioral trust layer for the agent economy. Score any AI agent on Base mainnet in milliseconds.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sp-success animate-pulse-dot" />
              <span className="text-xs font-mono text-sp-muted">Live on Base Mainnet</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-mono text-sp-muted uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                { label: "Explorer", href: "/explorer" },
                { label: "Leaderboard", href: "/leaderboard" },
                { label: "Live Demo", href: "/demo?mode=presentation" },
                { label: "API Docs", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sp-muted hover:text-sp-white text-sm transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-mono text-sp-muted uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Imprint", href: "/imprint" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sp-muted hover:text-sp-white text-sm transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-sp-border mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-sp-muted font-mono">
            © {year} SwarmPay. Built on ERC-8004 · Deployed on Base · Integrated with x402
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sp-muted hover:text-sp-white text-xs transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sp-muted hover:text-sp-white text-xs transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
