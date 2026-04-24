"use client";

import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  company: string;
  useCase: string;
}

export default function Waitlist() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    useCase: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "bg-sp-bg border border-sp-border rounded-md px-4 py-3 text-sp-white font-body text-sm w-full focus:border-sp-primary focus:outline-none focus:ring-1 focus:ring-sp-primary transition-colors placeholder:text-sp-muted/50";

  return (
    <section id="waitlist" className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-xs font-mono text-sp-primary uppercase tracking-widest mb-3">
          EARLY ACCESS
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-sp-white mb-4">
          We&apos;re onboarding design partners
        </h2>
        <p className="text-sp-muted mb-10 leading-relaxed">
          Free API access in exchange for 30 minutes of feedback per month.
          Limited spots.
        </p>

        {/* Form card */}
        <div className="bg-sp-surface border border-sp-border rounded-xl p-8 text-left">
          {status === "success" ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  className="text-sp-success"
                >
                  <circle cx="28" cy="28" r="27" stroke="currentColor" strokeWidth="2" />
                  <path
                    className="checkmark-path"
                    d="M16 28l9 9 15-15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl text-sp-white mb-2">
                You&apos;re on the list.
              </h3>
              <p className="text-sp-muted text-sm">
                We&apos;ll reach out within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sp-muted text-sm mb-1 block">
                  Name <span className="text-sp-primary">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sp-muted text-sm mb-1 block">
                  Work Email <span className="text-sp-primary">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ada@company.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sp-muted text-sm mb-1 block">
                  Company{" "}
                  <span className="text-sp-muted/50 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-sp-muted text-sm mb-1 block">
                  What will you use it for?{" "}
                  <span className="text-sp-muted/50 text-xs">(optional)</span>
                </label>
                <textarea
                  name="useCase"
                  rows={3}
                  value={form.useCase}
                  onChange={handleChange}
                  placeholder="We're building an agent marketplace and want to surface trust scores..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {status === "error" && (
                <p className="text-red-400 text-sm font-mono">
                  Something went wrong. Try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-sp-primary hover:bg-blue-500 disabled:opacity-60 text-white py-3 rounded-md font-medium transition-colors btn-shimmer"
              >
                {status === "loading" ? "Submitting..." : "Request Early Access"}
              </button>

              <p className="text-sp-muted/50 text-xs text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
