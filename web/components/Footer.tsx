export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <span className="font-display font-semibold text-xl text-bone tracking-wide mb-4 block">SwarmPay</span>
            <p className="font-display font-normal text-smoke text-sm leading-relaxed tracking-[0.025em] max-w-xs mb-6">
              The credit bureau for the agent economy. Score any AI agent on Base mainnet in milliseconds.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lichen animate-pulse" />
              <span className="text-xs font-mono text-smoke">Live on Base Mainnet</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-smoke mb-4">Product</p>
            <ul className="space-y-3">
              {[
                { label: "Explorer", href: "/explorer" },
                { label: "Leaderboard", href: "/leaderboard" },
                { label: "Live Demo", href: "/demo?mode=presentation" },
                { label: "API Docs", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-display font-normal text-smoke hover:text-bone text-sm transition-colors tracking-[0.021em]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-smoke mb-4">Resources</p>
            <ul className="space-y-3">
              {[
                { label: "Documentation", href: "#" },
                { label: "GitHub", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Status", href: "#" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-display font-normal text-smoke hover:text-bone text-sm transition-colors tracking-[0.021em]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-smoke mb-4">Legal</p>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/cookies" },
                { label: "Imprint", href: "/imprint" },
              ].map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="font-display font-normal text-smoke hover:text-bone text-sm transition-colors tracking-[0.021em]">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-smoke font-mono">
            &copy; {year} SwarmPay. Built on ERC-8004 &middot; Deployed on Base &middot; Integrated with x402
          </p>
          <div className="flex items-center gap-5">
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-smoke hover:text-bone text-xs transition-colors">Twitter</a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-smoke hover:text-bone text-xs transition-colors">GitHub</a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-smoke hover:text-bone text-xs transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
