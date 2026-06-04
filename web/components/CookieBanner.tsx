"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "sp_cookie_consent";

function grantConsent() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
    });
    window.gtag("config", "G-KQ0HYYGJFR", { send_page_view: true });
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setTimeout(() => setVisible(true), 1200);
    } else if (consent === "granted") {
      grantConsent();
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "granted");
    grantConsent();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:pb-6 pointer-events-none">
      <div
        className="pointer-events-auto max-w-3xl mx-auto rounded-xl border border-sp-border bg-sp-surface/95 backdrop-blur-md px-5 py-4 shadow-2xl flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(47,128,237,0.08)" }}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-sp-primary/10 border border-sp-primary/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#2F80ED" strokeWidth="1.2"/>
            <circle cx="5.5" cy="7" r="1" fill="#2F80ED"/>
            <circle cx="9" cy="5" r="1" fill="#2F80ED"/>
            <circle cx="10.5" cy="9.5" r="1" fill="#2F80ED"/>
            <circle cx="7" cy="11" r="0.75" fill="#2F80ED"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sp-white text-sm font-medium mb-0.5">We use cookies</p>
          <p className="text-sp-muted text-xs leading-relaxed">
            We use analytics cookies to understand how visitors use SwarmPay. No personal data is sold or shared.{" "}
            <a href="/privacy" className="text-sp-primary hover:text-blue-400 transition-colors underline underline-offset-2">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-medium text-sp-muted hover:text-sp-white border border-sp-border hover:border-sp-muted rounded-md transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-medium text-white bg-sp-primary hover:bg-blue-500 rounded-md transition-colors btn-shimmer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
