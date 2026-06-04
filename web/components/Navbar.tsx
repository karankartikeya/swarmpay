"use client";

import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-sp-bg/80 border-b border-sp-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-display font-bold text-sp-white text-lg">
              SwarmPay
            </span>
            <span className="ml-2 bg-sp-primary/20 text-sp-primary text-xs px-2 py-0.5 rounded-full font-mono">
              BETA
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors"
            >
              Docs
            </a>
            <a
              href="/demo?mode=presentation"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors"
            >
              Demo
            </a>
            <a
              href="/explorer"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors"
            >
              Explorer
            </a>
            <a
              href="/leaderboard"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors"
            >
              Leaderboard
            </a>
            {/* <
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors"
            >
              GitHub
            </a> */}
            <a
              href="#waitlist"
              className="bg-sp-primary hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md transition-colors btn-shimmer"
            >
              Request Access
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-sp-muted hover:text-sp-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-sp-border bg-sp-surface/95 backdrop-blur-md py-4 flex flex-col gap-4 px-2">
            <a
              href="#"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors px-2 py-1"
              onClick={() => setMenuOpen(false)}
            >
              Docs
            </a>
            <a
              href="/demo?mode=presentation"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors px-2 py-1"
              onClick={() => setMenuOpen(false)}
            >
              Demo
            </a>
            <a
              href="/explorer"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors px-2 py-1"
              onClick={() => setMenuOpen(false)}
            >
              Explorer
            </a>
            <a
              href="/leaderboard"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors px-2 py-1"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sp-muted hover:text-sp-white text-sm transition-colors px-2 py-1"
              onClick={() => setMenuOpen(false)}
            >
              GitHub
            </a>
            <a
              href="#waitlist"
              className="bg-sp-primary hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md transition-colors text-center btn-shimmer"
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
