"use client";

import { useEffect, useRef, useState } from "react";

const AGENT_ADDRESS = "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028";
const BAD_AGENT_ADDRESS = "0x0d5CFf2655FbDA89dF5f767335099eeFEEe55A2D";
const MERCHANT_ADDRESS = "0xb194262C09f89F726172d5E29a4bb18f11403a52";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MERCHANT_URL = "http://localhost:9000";

const STEPS = [
  "Agent calls /data endpoint",
  "Server returns HTTP 402",
  "Agent parses payment requirements",
  "ERC-3009 signature constructed",
  "Payment proof submitted",
  "Merchant verifies signature",
  "Access granted — data returned",
  "Reputation score updated on-chain",
];

type Status = "IDLE" | "PAYING" | "DONE";
type AgentKey = "good" | "bad";

function trunc(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function tierBadge(tier: string | null): { label: string; bg: string; color: string } {
  if (!tier || tier === "Unrated")
    return { label: "Unrated", bg: "#1C2333", color: "#8B949E" };
  if (tier === "AAA") return { label: "AAA", bg: "#065F46", color: "#6EE7B7" };
  if (tier === "AA") return { label: "AA", bg: "#14532D", color: "#86EFAC" };
  return { label: tier, bg: "#1E3A5F", color: "#60A5FA" };
}

function Label({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <p
      className="text-xs uppercase tracking-widest font-mono mb-3"
      style={{ color: red ? "#E74C3C" : "#8B949E" }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return <div className="w-px h-full" style={{ background: "#1C2333" }} />;
}

export default function DemoDashboard() {
  // Good agent
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  // Bad agent
  const [badScore, setBadScore] = useState<number | null>(null);

  // Selected agent for the demo run
  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("good");

  // Flow state
  const [status, setStatus] = useState<Status>("IDLE");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepMs, setStepMs] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [usdcReceived, setUsdcReceived] = useState(0);
  const [scoreAtPayment, setScoreAtPayment] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const startRef = useRef<number>(0);

  async function fetchScore() {
    try {
      const res = await fetch(`${API_URL}/v0/score/${AGENT_ADDRESS}`);
      if (res.ok) {
        const d = await res.json();
        setScore(d.score ?? null);
        setTier(d.tier ?? null);
      }
    } catch {}
  }

  async function fetchBadScore() {
    try {
      const res = await fetch(`${API_URL}/v0/score/${BAD_AGENT_ADDRESS}`);
      if (res.ok) {
        const d = await res.json();
        setBadScore(d.score ?? 0);
      }
    } catch {
      setBadScore(0);
    }
  }

  useEffect(() => {
    fetchScore();
    fetchBadScore();
  }, []);

  function startTimer() {
    startRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 50);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function runDemo() {
    if (running) return;
    setRunning(true);
    setStatus("PAYING");
    setCompletedSteps(new Set());
    setStepMs({});
    setScoreAtPayment(null);
    startTimer();

    const agentAddr = selectedAgent === "good" ? AGENT_ADDRESS : BAD_AGENT_ADDRESS;
    const es = new EventSource(`${MERCHANT_URL}/demo/run?agent=${agentAddr}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as {
        step: number;
        label: string;
        ms: number;
        done?: boolean;
        score?: number;
        tier?: string;
      };

      setCompletedSteps((prev) => new Set([...prev, data.step]));
      setStepMs((prev) => ({ ...prev, [data.step]: data.ms }));

      if (data.done) {
        stopTimer();
        setElapsed(Date.now() - startRef.current);
        setStatus("DONE");
        if (selectedAgent === "good") {
          setUsdcReceived((u) => parseFloat((u + 0.001).toFixed(3)));
          if (data.score != null) {
            setScore(data.score);
            setScoreAtPayment(data.score);
            if (data.tier) setTier(data.tier);
          }
        } else {
          // Bad agent run: update bad score, no USDC (payment rejected)
          if (data.score != null) setBadScore(data.score);
          setScoreAtPayment(data.score ?? badScore);
        }
        es.close();
        setRunning(false);
      }
    };

    es.onerror = () => {
      stopTimer();
      setStatus("IDLE");
      setRunning(false);
      es.close();
    };
  }

  const badge = tierBadge(tier);

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden font-mono"
      style={{ background: "#080B10", color: "#E6EDF3" }}
    >
      {/* Home link */}
      <a
        href="/"
        className="absolute top-4 left-6 z-10 text-xs font-mono transition-colors"
        style={{ color: "#8B949E" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#E6EDF3")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8B949E")}
      >
        ← Home
      </a>

      {/* ── PANEL 1: GOOD AGENT ── */}
      <div
        className="flex flex-col border-r p-8 gap-8 transition-all duration-200"
        style={{
          background: selectedAgent === "good" && !running ? "#0F1820" : "#0D1117",
          borderColor: selectedAgent === "good" ? "#2F80ED" : "#1C2333",
          width: "19%",
          boxShadow: selectedAgent === "good" ? "inset 0 0 0 1px #2F80ED22" : "none",
        }}
      >
        <div>
          <Label>AI Agent</Label>
          <p className="text-xs" style={{ color: "#2F80ED" }}>
            {trunc(AGENT_ADDRESS)}
          </p>
        </div>

        <div>
          <Label>Reputation Score</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold leading-none" style={{ fontSize: 56, color: "#E6EDF3" }}>
              {score ?? "—"}
            </span>
            {tier && (
              <span
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            )}
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <span
            className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border uppercase tracking-widest ${
              status === "PAYING"
                ? "border-blue-500 text-blue-400"
                : status === "DONE"
                ? "border-green-500 text-green-400"
                : "border-gray-600 text-gray-400"
            }`}
          >
            {status === "PAYING" && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
            {status}
          </span>
        </div>
      </div>

      {/* ── PANEL 2: X402 FLOW ── */}
      <div
        className="flex flex-col border-r p-8 gap-6"
        style={{ background: "#0D1117", borderColor: "#1C2333", width: "34%" }}
      >
        <div>
          <Label>X402 Payment Flow</Label>
          <p className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
            {elapsed > 0 ? `${elapsed.toLocaleString()}ms` : "0ms"}
          </p>
        </div>

        <div className="flex flex-col flex-1" style={{ gap: 14 }}>
          {STEPS.map((label, i) => {
            const step = i + 1;
            const done = completedSteps.has(step);
            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-all duration-300"
                  style={
                    done
                      ? { background: "#27AE60", borderColor: "#27AE60", color: "#fff" }
                      : { background: "transparent", borderColor: "#1C2333", color: "#8B949E" }
                  }
                >
                  {done ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className="text-sm flex-1 transition-colors duration-300"
                  style={{ color: done ? "#E6EDF3" : "#8B949E" }}
                >
                  {label}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "#8B949E",
                    opacity: done && stepMs[step] != null ? 1 : 0,
                    minWidth: 52,
                    textAlign: "right",
                  }}
                >
                  {stepMs[step] != null ? `${stepMs[step]}ms` : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Agent selector */}
        <div>
          <Label>Run As Agent</Label>
          <div className="flex gap-2">
            <button
              onClick={() => !running && setSelectedAgent("good")}
              className="flex-1 py-2 text-xs uppercase tracking-widest rounded border transition-all duration-150"
              style={{
                borderColor: selectedAgent === "good" ? "#2F80ED" : "#1C2333",
                background: selectedAgent === "good" ? "#1E3A5F" : "transparent",
                color: selectedAgent === "good" ? "#60A5FA" : "#8B949E",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {trunc(AGENT_ADDRESS)}
            </button>
            <button
              onClick={() => !running && setSelectedAgent("bad")}
              className="flex-1 py-2 text-xs uppercase tracking-widest rounded border transition-all duration-150"
              style={{
                borderColor: selectedAgent === "bad" ? "#E74C3C" : "#1C2333",
                background: selectedAgent === "bad" ? "#3B1010" : "transparent",
                color: selectedAgent === "bad" ? "#F87171" : "#8B949E",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {trunc(BAD_AGENT_ADDRESS)}
            </button>
          </div>
        </div>

        <button
          onClick={runDemo}
          disabled={running}
          className="w-full py-4 text-sm uppercase font-bold tracking-widest rounded transition-all duration-200"
          style={{
            background: running ? "#1C2333" : selectedAgent === "bad" ? "#7F1D1D" : "#2F80ED",
            color: running ? "#8B949E" : "#fff",
            cursor: running ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {running ? "RUNNING..." : `RUN DEMO`}
        </button>
      </div>

      {/* ── PANEL 3: BAD AGENT ── */}
      <div
        className="flex flex-col border-r p-8 gap-8 transition-all duration-200"
        style={{
          background: selectedAgent === "bad" && !running ? "#180F0F" : "#0D1117",
          borderColor: selectedAgent === "bad" ? "#E74C3C" : "#1C2333",
          width: "19%",
          boxShadow: selectedAgent === "bad" ? "inset 0 0 0 1px #E74C3C22" : "none",
        }}
      >
        <div>
          <Label red>Unverified Agent</Label>
          <p className="text-xs" style={{ color: "#E74C3C" }}>
            {trunc(BAD_AGENT_ADDRESS)}
          </p>
        </div>

        <div>
          <Label>Reputation Score</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold leading-none" style={{ fontSize: 56, color: "#E6EDF3" }}>
              {badScore ?? "0"}
            </span>
            <span
              className="text-xs font-bold px-2 py-1 rounded"
              style={{ background: "#1C2333", color: "#8B949E" }}
            >
              Unrated
            </span>
          </div>
          <p className="text-xs mt-2" style={{ color: "#E74C3C" }}>
            Last attempt: signature replay detected
          </p>
        </div>

        <div>
          <Label>Status</Label>
          <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border uppercase tracking-widest border-gray-600 text-gray-400">
            IDLE
          </span>
        </div>

        <div>
          <Label>Payment Attempts</Label>
          <p className="text-sm font-bold" style={{ color: "#E74C3C" }}>
            3 failed attempts
          </p>
        </div>
      </div>

      {/* ── PANEL 4: MERCHANT ── */}
      <div
        className="flex flex-col p-8 gap-8"
        style={{ background: "#0D1117", width: "28%" }}
      >
        <div>
          <Label>API Merchant</Label>
          <p className="text-xs" style={{ color: "#2F80ED" }}>
            {trunc(MERCHANT_ADDRESS)}
          </p>
        </div>

        <div>
          <Label>USDC Received</Label>
          <p className="font-bold leading-none" style={{ fontSize: 48, color: "#27AE60" }}>
            {usdcReceived.toFixed(3)}
            <span className="text-sm font-normal ml-2" style={{ color: "#8B949E" }}>
              USDC
            </span>
          </p>
        </div>

        <div>
          <Label>Agent Score at Payment</Label>
          <p className="font-bold leading-none" style={{ fontSize: 40, color: "#E6EDF3" }}>
            {scoreAtPayment ?? "—"}
          </p>
          {scoreAtPayment != null && (
            <p className="text-xs mt-1" style={{ color: "#8B949E" }}>
              {trunc(selectedAgent === "good" ? AGENT_ADDRESS : BAD_AGENT_ADDRESS)}
            </p>
          )}
        </div>

        <div>
          <Label>Serve This Agent?</Label>

          {/* Good agent */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#8B949E" }}>
              {trunc(AGENT_ADDRESS)}
            </span>
            {score == null ? (
              <span className="text-xs" style={{ color: "#8B949E" }}>—</span>
            ) : score > 400 ? (
              <span
                className="text-sm font-bold px-3 py-0.5 rounded border"
                style={{ color: "#27AE60", borderColor: "#27AE60" }}
              >
                ✅ YES
              </span>
            ) : (
              <span
                className="text-sm font-bold px-3 py-0.5 rounded border"
                style={{ color: "#E74C3C", borderColor: "#E74C3C" }}
              >
                ❌ NO
              </span>
            )}
          </div>

          {/* Bad agent — always NO */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#8B949E" }}>
              {trunc(BAD_AGENT_ADDRESS)}
            </span>
            <span
              className="text-sm font-bold px-3 py-0.5 rounded border"
              style={{ color: "#E74C3C", borderColor: "#E74C3C" }}
            >
              ❌ NO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
