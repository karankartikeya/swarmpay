"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "EXPLORER", href: "/explorer" },
  { label: "LEADERBOARD", href: "/leaderboard" },
  { label: "PROGRESS", href: "/#progress" },
  { label: "USE CASES", href: "/#use-cases" },
  { label: "DEMO", href: "/demo?mode=presentation" },
  { label: "DOCS", href: "#" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && !href.startsWith("/#") && pathname.startsWith(href.split("?")[0]));

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-void/95 backdrop-blur-md border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <span className="font-display font-semibold text-bone text-lg tracking-wide group-hover:text-plum-voltage transition-colors">
              SwarmPay
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-display font-normal transition-colors duration-150 tracking-[0.021em] ${
                  isActive(link.href)
                    ? "text-bone"
                    : "text-smoke hover:text-bone"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <a
              href="/#waitlist"
              className="bg-plum-voltage hover:bg-plum-voltage/90 text-bone text-xs font-display font-semibold uppercase tracking-[0.05em] px-4 py-3 rounded-[24px] transition-colors duration-200"
            >
              Request Access
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 text-smoke hover:text-bone transition-colors"
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
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-3 pb-5 flex flex-col gap-1 border-t border-white/[0.06]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-3 py-2.5 text-sm font-display tracking-[0.021em] transition-colors ${
                  isActive(link.href)
                    ? "text-bone"
                    : "text-smoke hover:text-bone"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="h-px bg-white/[0.06] my-2" />
            <a
              href="/#waitlist"
              className="mx-1 bg-plum-voltage hover:bg-plum-voltage/90 text-bone text-xs font-display font-semibold uppercase tracking-[0.05em] px-4 py-3 rounded-[24px] transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              Request Access
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
