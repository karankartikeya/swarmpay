"use client";

import { useEffect, useRef, useState } from "react";

const AGENT_ADDRESS = "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028";
const MERCHANT_ADDRESS = "0xb194262C09f89F726172d5E29a4bb18f11403a52";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MERCHANT_URL = "http://localhost:9000";

function truncate(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

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

function tierColor(tier: string) {
  if (tier === "AAA") return "text-emerald-400 border-emerald-400";
  if (tier === "AA") return "text-green-400 border-green-400";
  return "text-blue-400 border-blue-400";
}

function scoreToTier(score: number): string {
  if (score >= 700) return "AAA";
  if (score >= 500) return "AA";
  return "A";
}

export default function DemoDashboard() {
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("IDLE");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepMs, setStepMs] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [usdcReceived, setUsdcReceived] = useState(0);
  const [confirmedScore, setConfirmedScore] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  async function fetchScore() {
    try {
      const res = await fetch(`${API_URL}/v0/score/${AGENT_ADDRESS}`);
      if (res.ok) {
        const data = await res.json();
        setScore(data.score ?? data.total_score ?? null);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchScore();
  }, []);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 50);
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
    setCompletedSteps([]);
    setStepMs({});
    setConfirmedScore(null);
    startTimer();

    const es = new EventSource(`${MERCHANT_URL}/demo/run`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const step: number = data.step;
      const ms: number = data.ms ?? 0;

      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step]);
        setStepMs((prev) => ({ ...prev, [step]: ms }));
      }, (step - 1) * 300);

      if (data.done) {
        stopTimer();
        setElapsed(ms);
        setStatus("DONE");
        setUsdcReceived((u) => parseFloat((u + 0.001).toFixed(3)));
        if (data.score != null) {
          setScore(data.score);
          setConfirmedScore(data.score);
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

  const tier = score != null ? scoreToTier(score) : "A";

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "#080B10", color: "#E6EDF3" }}
    >
      {/* PANEL 1 — AGENT */}
      <div
        className="flex flex-col gap-6 p-8 w-1/3 border-r"
        style={{ background: "#0D1117", borderColor: "#1C2333" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#8B949E" }}>
            AI Agent
          </p>
          <p className="font-mono text-sm" style={{ color: "#2F80ED" }}>
            {truncate(AGENT_ADDRESS)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8B949E" }}>
            Reputation Score
          </p>
          <div className="flex items-end gap-4">
            <span
              className="font-mono"
              style={{ fontSize: "3.5rem", lineHeight: 1, color: "#E6EDF3" }}
            >
              {score ?? "—"}
            </span>
            {score != null && (
              <span
                className={`font-mono text-sm border px-2 py-0.5 rounded ${tierColor(tier)}`}
              >
                {tier}
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8B949E" }}>
            Status
          </p>
          <span
            className={`inline-flex items-center gap-2 font-mono text-sm px-3 py-1 rounded border ${
              status === "PAYING"
                ? "border-yellow-400 text-yellow-400"
                : status === "DONE"
                ? "text-green-400 border-green-400"
                : "text-gray-400 border-gray-600"
            }`}
          >
            {status === "PAYING" && (
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {status}
          </span>
        </div>
      </div>

      {/* PANEL 2 — TRANSACTION */}
      <div
        className="flex flex-col gap-6 p-8 w-1/3 border-r"
        style={{ background: "#080B10", borderColor: "#1C2333" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#8B949E" }}>
            x402 Payment Flow
          </p>
          <div className="font-mono text-sm" style={{ color: "#2F80ED" }}>
            {elapsed > 0 ? `${elapsed}ms` : "—"}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {STEPS.map((label, i) => {
            const step = i + 1;
            const done = completedSteps.includes(step);
            return (
              <div
                key={step}
                className="flex items-center gap-3 transition-all duration-300"
                style={{ opacity: done ? 1 : 0.35 }}
              >
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs border"
                  style={{
                    borderColor: done ? "#27AE60" : "#1C2333",
                    background: done ? "#27AE60" : "transparent",
                    color: done ? "#080B10" : "#8B949E",
                    transition: "all 300ms",
                  }}
                >
                  {done ? "✓" : step}
                </div>
                <span
                  className="text-sm"
                  style={{ color: done ? "#E6EDF3" : "#8B949E" }}
                >
                  {label}
                </span>
                {done && stepMs[step] != null && (
                  <span className="ml-auto font-mono text-xs" style={{ color: "#8B949E" }}>
                    {stepMs[step]}ms
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={runDemo}
          disabled={running}
          className="w-full py-3 font-mono text-sm rounded border transition-all duration-200"
          style={{
            background: running ? "transparent" : "#2F80ED",
            borderColor: "#2F80ED",
            color: running ? "#2F80ED" : "#080B10",
            cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "RUNNING..." : "RUN DEMO"}
        </button>
      </div>

      {/* PANEL 3 — MERCHANT */}
      <div
        className="flex flex-col gap-6 p-8 w-1/3"
        style={{ background: "#0D1117" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#8B949E" }}>
            API Merchant
          </p>
          <p className="font-mono text-sm" style={{ color: "#2F80ED" }}>
            {truncate(MERCHANT_ADDRESS)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8B949E" }}>
            USDC Received
          </p>
          <span className="font-mono" style={{ fontSize: "3rem", lineHeight: 1, color: "#27AE60" }}>
            {usdcReceived.toFixed(3)}
          </span>
          <span className="ml-2 text-sm" style={{ color: "#8B949E" }}>USDC</span>
        </div>

        {confirmedScore != null && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#8B949E" }}>
              Score After Confirmation
            </p>
            <span className="font-mono text-2xl" style={{ color: "#27AE60" }}>{confirmedScore}</span>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#8B949E" }}>
            Serve This Agent?
          </p>
          {score == null ? (
            <span className="font-mono text-sm" style={{ color: "#8B949E" }}>—</span>
          ) : score > 400 ? (
            <span
              className="font-mono text-lg px-4 py-1 rounded border"
              style={{ color: "#27AE60", borderColor: "#27AE60" }}
            >
              YES
            </span>
          ) : (
            <span
              className="font-mono text-lg px-4 py-1 rounded border"
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
