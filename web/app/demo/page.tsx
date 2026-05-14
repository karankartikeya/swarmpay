"use client";

import { useEffect, useRef, useState } from "react";

const AGENT_ADDRESS = "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028";
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

function truncate(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function tierBadge(tier: string | null) {
  if (!tier || tier === "Unrated")
    return { label: "Unrated", bg: "#1C2333", color: "#8B949E" };
  if (tier === "AAA") return { label: "AAA", bg: "#065F46", color: "#6EE7B7" };
  if (tier === "AA") return { label: "AA", bg: "#14532D", color: "#86EFAC" };
  return { label: tier, bg: "#1E3A5F", color: "#60A5FA" };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest font-mono mb-3"
      style={{ color: "#8B949E" }}
    >
      {children}
    </p>
  );
}

export default function DemoDashboard() {
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);
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
        const data = await res.json();
        setScore(data.score ?? null);
        setTier(data.tier ?? null);
      }
    } catch {
      // silently fail — score stays as last known value
    }
  }

  useEffect(() => {
    fetchScore();
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

    // Reset state
    setRunning(true);
    setStatus("PAYING");
    setCompletedSteps(new Set());
    setStepMs({});
    setScoreAtPayment(null);
    startTimer();

    const es = new EventSource(`${MERCHANT_URL}/demo/run`);
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
        const finalMs = Date.now() - startRef.current;
        stopTimer();
        setElapsed(finalMs);
        setStatus("DONE");
        setUsdcReceived((u) => parseFloat((u + 0.001).toFixed(3)));
        if (data.score != null) {
          setScore(data.score);
          setScoreAtPayment(data.score);
          setTier(data.tier ?? tier);
        }
        es.close();
        setRunning(false);
        // Refresh score from API after a short delay to catch any propagation lag
        setTimeout(fetchScore, 2000);
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
      className="flex h-screen w-screen overflow-hidden font-mono"
      style={{ background: "#080B10", color: "#E6EDF3" }}
    >
      {/* ── PANEL 1: AI AGENT ── */}
      <div
        className="flex flex-col w-1/3 border-r p-10 gap-10"
        style={{ background: "#0D1117", borderColor: "#1C2333" }}
      >
        <div>
          <Label>AI Agent</Label>
          <p className="text-sm" style={{ color: "#2F80ED" }}>
            {truncate(AGENT_ADDRESS)}
          </p>
        </div>

        <div>
          <Label>Reputation Score</Label>
          <div className="flex items-center gap-4">
            <span
              className="font-bold leading-none"
              style={{ fontSize: 72, color: "#E6EDF3" }}
            >
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

      {/* ── PANEL 2: X402 PAYMENT FLOW ── */}
      <div
        className="flex flex-col w-1/3 border-r p-10 gap-6"
        style={{ background: "#0D1117", borderColor: "#1C2333" }}
      >
        <div>
          <Label>X402 Payment Flow</Label>
          <p className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
            {elapsed > 0 ? `${elapsed.toLocaleString()}ms` : "0ms"}
          </p>
        </div>

        <div className="flex flex-col flex-1" style={{ gap: 16 }}>
          {STEPS.map((label, i) => {
            const step = i + 1;
            const done = completedSteps.has(step);
            return (
              <div key={step} className="flex items-center gap-3">
                {/* Circle */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-all duration-300"
                  style={
                    done
                      ? {
                          background: "#27AE60",
                          borderColor: "#27AE60",
                          color: "#fff",
                        }
                      : {
                          background: "transparent",
                          borderColor: "#1C2333",
                          color: "#8B949E",
                        }
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

                {/* Label */}
                <span
                  className="text-sm flex-1 transition-colors duration-300"
                  style={{ color: done ? "#E6EDF3" : "#8B949E" }}
                >
                  {label}
                </span>

                {/* Timestamp */}
                <span
                  className="text-xs transition-opacity duration-300"
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

        {/* RUN DEMO button */}
        <button
          onClick={runDemo}
          disabled={running}
          className="w-full py-4 text-sm uppercase font-bold tracking-widest rounded transition-all duration-200"
          style={{
            background: running ? "#1C2333" : "#2F80ED",
            color: running ? "#8B949E" : "#fff",
            cursor: running ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {running ? "RUNNING..." : "RUN DEMO"}
        </button>
      </div>

      {/* ── PANEL 3: API MERCHANT ── */}
      <div
        className="flex flex-col w-1/3 p-10 gap-10"
        style={{ background: "#0D1117" }}
      >
        <div>
          <Label>API Merchant</Label>
          <p className="text-sm" style={{ color: "#2F80ED" }}>
            {truncate(MERCHANT_ADDRESS)}
          </p>
        </div>

        <div>
          <Label>USDC Received</Label>
          <p
            className="font-bold leading-none"
            style={{ fontSize: 56, color: "#27AE60" }}
          >
            {usdcReceived.toFixed(3)}
            <span
              className="text-base font-normal ml-2"
              style={{ color: "#8B949E" }}
            >
              USDC
            </span>
          </p>
        </div>

        <div>
          <Label>Agent Score at Payment</Label>
          <p
            className="font-bold leading-none"
            style={{ fontSize: 48, color: "#E6EDF3" }}
          >
            {scoreAtPayment ?? "—"}
          </p>
        </div>

        <div>
          <Label>Serve This Agent?</Label>
          {score == null ? (
            <span style={{ color: "#8B949E" }}>—</span>
          ) : score > 400 ? (
            <span
              className="text-2xl font-bold px-5 py-2 rounded border"
              style={{ color: "#27AE60", borderColor: "#27AE60" }}
            >
              YES
            </span>
          ) : (
            <span
              className="text-2xl font-bold px-5 py-2 rounded border"
              style={{ color: "#E74C3C", borderColor: "#E74C3C" }}
            >
              NO
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
