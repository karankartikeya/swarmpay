"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

interface Props {
  source: string;
  label?: string;
}

export default function WaitlistForm({ source, label = "Join the waitlist to get API access" }: Props) {
  const [email, setEmail] = useState("");
  const [agentAddress, setAgentAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    const { error } = await getSupabase().from("waitlist").insert({
      email: email.trim(),
      agent_address: agentAddress.trim() || null,
      source,
    });
    if (!error) {
      setStatus("success");
    } else if (error.code === "23505") {
      setStatus("duplicate");
    } else {
      setStatus("error");
    }
  }

  const inputClass =
    "bg-sp-bg border border-sp-border rounded-md px-4 py-2.5 text-sp-white text-sm w-full focus:border-sp-primary focus:outline-none focus:ring-1 focus:ring-sp-primary transition-colors placeholder:text-sp-muted/50";

  if (status === "success") {
    return (
      <div className="rounded-xl border border-sp-border bg-sp-surface px-6 py-5 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <p className="text-sp-white text-sm">
          You&apos;re on the list! We&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sp-border bg-sp-surface px-6 py-5">
      <p className="text-sp-muted text-xs mb-4">{label}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={inputClass}
        />
        <input
          type="text"
          value={agentAddress}
          onChange={(e) => setAgentAddress(e.target.value)}
          placeholder="Agent address (optional) — 0x..."
          spellCheck={false}
          className={`${inputClass} font-mono`}
        />

        {status === "duplicate" && (
          <p className="text-yellow-400 text-xs font-mono">Already registered with that email.</p>
        )}
        {status === "error" && (
          <p className="text-red-400 text-xs font-mono">Something went wrong. Try again.</p>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="bg-sp-primary hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-medium transition-colors btn-shimmer"
        >
          {status === "loading" ? "Joining…" : "Join Waitlist"}
        </button>
      </form>
    </div>
  );
}
