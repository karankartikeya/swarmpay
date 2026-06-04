"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Explorer", href: "/explorer" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Demo", href: "/demo?mode=presentation" },
  { label: "Docs", href: "#" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "backdrop-blur-xl bg-sp-bg/85 border-b border-sp-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 py-3.5">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <span className="font-display font-bold text-sp-white text-base group-hover:text-sp-primary transition-colors">
              SwarmPay
            </span>
            <span className="bg-sp-primary/15 text-sp-primary text-[10px] px-2 py-0.5 rounded-full font-mono tracking-wide border border-sp-primary/20">
              BETA
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`relative px-3.5 py-2 text-sm rounded-md transition-all duration-150 ${
                  isActive(link.href)
                    ? "text-sp-white bg-sp-primary/10"
                    : "text-sp-muted hover:text-sp-white hover:bg-sp-surface/60"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-primary" />
                )}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/#waitlist"
              className="bg-sp-primary hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 btn-shimmer shadow-sm shadow-sp-primary/20"
            >
              Request Access
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-sp-muted hover:text-sp-white hover:bg-sp-surface/60 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="3" y1="3" x2="15" y2="15" />
                  <line x1="15" y1="3" x2="3" y2="15" />
                </>
              ) : (
                <>
                  <line x1="2" y1="5" x2="16" y2="5" />
                  <line x1="2" y1="9" x2="16" y2="9" />
                  <line x1="2" y1="13" x2="16" y2="13" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 pb-5 flex flex-col gap-1 border-t border-sp-border/40">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? "text-sp-white bg-sp-primary/10"
                    : "text-sp-muted hover:text-sp-white hover:bg-sp-surface"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="h-px bg-sp-border/40 my-2" />
            <a
              href="/#waitlist"
              className="mx-1 bg-sp-primary hover:bg-blue-500 text-white text-sm px-4 py-2.5 rounded-lg font-medium transition-colors text-center btn-shimmer"
              onClick={() => setMenuOpen(false)}
            >
              Request Access
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
