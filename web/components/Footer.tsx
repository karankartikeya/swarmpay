export default function Footer() {
  return (
    <footer className="border-t border-sp-border bg-sp-surface py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {/* Left */}
          <div>
            <span className="font-display text-xl text-sp-white">
              SwarmPay
            </span>
            <p className="text-sp-muted text-sm mt-2 leading-relaxed max-w-xs">
              The financial trust layer for the agent economy.
            </p>
          </div>

          {/* Center */}
          <div className="flex items-start md:items-center md:justify-center">
            <p className="text-sp-muted text-sm font-mono leading-relaxed">
              Built on ERC-8004
              <br className="md:hidden" />
              {" · "}Deployed on Base
              <br className="md:hidden" />
              {" · "}Integrated with x402
            </p>
          </div>

          {/* Right */}
          <div className="flex items-start md:items-center md:justify-end">
            <div className="flex gap-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sp-muted hover:text-sp-white text-sm transition-colors"
              >
                GitHub
              </a>
              <a
                href="#"
                className="text-sp-muted hover:text-sp-white text-sm transition-colors"
              >
                Docs
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sp-muted hover:text-sp-white text-sm transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="border-t border-sp-border mt-8 pt-8 text-center text-sp-muted text-xs">
          © 2026 SwarmPay. The financial trust layer for the agent economy.
        </div>
      </div>
    </footer>
  );
}
