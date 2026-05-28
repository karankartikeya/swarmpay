"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const AGENT_ADDRESS = "0x572b8caf4FbEAC5358946acD2C5EFfeeB035D028";
const BAD_AGENT_ADDRESS = "0x0d5CFf2655FbDA89dF5f767335099eeFEEe55A2D";
const MERCHANT_ADDRESS = "0xb194262C09f89F726172d5E29a4bb18f11403a52";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MERCHANT_URL = process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:9000";

const STEPS: { label: string; swarmpay: boolean }[] = [
  { label: "Agent calls /data endpoint",                    swarmpay: false },
  { label: "Merchant returns HTTP 402 — payment required",  swarmpay: false },
  { label: "SwarmPay fetches agent reputation score",       swarmpay: true  },
  { label: "Score check: 582 ≥ 400 threshold ✓",           swarmpay: true  },
  { label: "SwarmPay verifies agent USDC balance",          swarmpay: true  },
  { label: "Balance sufficient ✓",                         swarmpay: true  },
  { label: "ERC-3009 payment signature constructed",        swarmpay: false },
  { label: "Payment submitted to SwarmPay router contract", swarmpay: true  },
  { label: "Router splits: 0.3% → SwarmPay, 99.7% → Merchant", swarmpay: true },
  { label: "Access granted — data returned",               swarmpay: false },
  { label: "Reputation score updated on-chain",            swarmpay: true  },
];

// per-step delay in presentation mode (ms)
const STEP_DELAYS = [400, 400, 500, 500, 500, 500, 400, 400, 400, 600, 600];

type Status = "IDLE" | "PAYING" | "DONE" | "REJECTED";
type AgentKey = "good" | "bad";

function trunc(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function tierBadge(tier: string | null): { label: string; bg: string; color: string } {
  if (!tier || tier === "Unrated")
    return { label: "Unrated", bg: "#1C2333", color: "#8B949E" };
  if (tier === "AAA") return { label: "AAA", bg: "#065F46", color: "#6EE7B7" };
  if (tier === "AA")  return { label: "AA",  bg: "#14532D", color: "#86EFAC" };
  return { label: tier, bg: "#1E3A5F", color: "#60A5FA" };
}

function Label({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <p className="text-xs uppercase tracking-widest font-mono mb-3"
      style={{ color: red ? "#E74C3C" : "#8B949E" }}>
      {children}
    </p>
  );
}

// Animated score counter
function AnimatedScore({ value }: { value: number | null }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    if (value === null) { setDisplayed(null); prevRef.current = null; return; }
    const from = prevRef.current ?? value;
    prevRef.current = value;
    if (from === value) { setDisplayed(value); return; }
    const start = performance.now();
    const duration = 800;
    const target = value;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplayed(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{displayed ?? "—"}</>;
}

// USDC flash on increment
function UsdcCounter({ value }: { value: number }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <p className="font-bold leading-none transition-colors duration-300"
      style={{ fontSize: 48, color: flash ? "#6EE7B7" : "#27AE60" }}>
      {value.toFixed(3)}
      <span className="text-sm font-normal ml-2" style={{ color: "#8B949E" }}>USDC</span>
    </p>
  );
}

// Spinner SVG
function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="6" cy="6" r="5" stroke="#3B82F6" strokeWidth="2"
        strokeDasharray="20 12" strokeLinecap="round" />
    </svg>
  );
}

// Checkmark SVG
function Check({ color }: { color: string }) {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"
      style={{ animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
      <path d="M1 4l3 3 5-6" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Cross SVG
function Cross() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DemoDashboard() {
  const searchParams = useSearchParams();
  const isPresentationMode = searchParams.get("mode") === "presentation";

  const [score, setScore]       = useState<number | null>(null);
  const [tier, setTier]         = useState<string | null>(null);
  const [badScore, setBadScore] = useState<number | null>(null);

  const [selectedAgent, setSelectedAgent] = useState<AgentKey>("good");
  const [status, setStatus]     = useState<Status>("IDLE");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep]         = useState<number | null>(null);
  const [rejectedStep, setRejectedStep]     = useState<number | null>(null);
  const [stepMs, setStepMs]     = useState<Record<number, number>>({});
  const [elapsed, setElapsed]   = useState(0);
  const [usdcReceived, setUsdcReceived]     = useState(0);
  const [scoreAtPayment, setScoreAtPayment] = useState<number | null>(null);
  const [running, setRunning]   = useState(false);
  const [showBasescan, setShowBasescan]     = useState(false);
  const [mounted, setMounted]   = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const esRef    = useRef<EventSource | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => { setMounted(true); }, []);

  async function fetchScore() {
    try {
      const res = await fetch(`${API_URL}/v0/score/${AGENT_ADDRESS}`);
      if (res.ok) { const d = await res.json(); setScore(d.score ?? null); setTier(d.tier ?? null); }
    } catch {}
  }

  async function fetchBadScore() {
    try {
      const res = await fetch(`${API_URL}/v0/score/${BAD_AGENT_ADDRESS}`);
      if (res.ok) { const d = await res.json(); setBadScore(d.score ?? 0); }
    } catch { setBadScore(0); }
  }

  useEffect(() => { fetchScore(); fetchBadScore(); }, []);

  function startTimer() {
    startRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 50);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function resetState() {
    setCompletedSteps(new Set());
    setActiveStep(null);
    setRejectedStep(null);
    setStepMs({});
    setScoreAtPayment(null);
    setShowBasescan(false);
  }

  async function runDemoPresentation() {
    setRunning(true);
    setStatus("PAYING");
    resetState();
    startTimer();

    let cumulative = 0;
    for (let i = 0; i < STEPS.length; i++) {
      const step = i + 1;
      setActiveStep(step);
      await new Promise<void>((r) => setTimeout(r, STEP_DELAYS[i]));
      cumulative += STEP_DELAYS[i];
      setCompletedSteps((prev) => new Set(Array.from(prev).concat(step)));
      setStepMs((prev) => ({ ...prev, [step]: cumulative }));
    }

    setActiveStep(null);
    stopTimer();
    setElapsed(cumulative);
    setStatus("DONE");
    setUsdcReceived((u) => parseFloat((u + 0.001).toFixed(3)));
    setShowBasescan(true);

    try {
      const res = await fetch(`${API_URL}/v0/score/${AGENT_ADDRESS}`);
      if (res.ok) {
        const d = await res.json();
        setScore(d.score ?? null);
        setTier(d.tier ?? null);
        setScoreAtPayment(d.score ?? null);
      }
    } catch {}

    setRunning(false);
  }

  function runDemo() {
    if (running) return;
    if (isPresentationMode) { runDemoPresentation(); return; }

    setRunning(true);
    setStatus("PAYING");
    resetState();
    startTimer();

    const url = selectedAgent === "bad"
      ? `${MERCHANT_URL}/demo/run-bad`
      : `${MERCHANT_URL}/demo/run?agent=${AGENT_ADDRESS}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as {
        step: number; label: string; ms: number;
        done?: boolean; rejected?: boolean;
        score?: number; tier?: string;
      };

      if (data.rejected) {
        setActiveStep(null);
        setRejectedStep(data.step);
        setStepMs((prev) => ({ ...prev, [data.step]: data.ms }));
        stopTimer();
        setElapsed(Date.now() - startRef.current);
        setStatus("REJECTED");
        setScoreAtPayment(0);
        es.close();
        setRunning(false);
        return;
      }

      setActiveStep(data.step + 1 <= STEPS.length ? data.step + 1 : null);
      setCompletedSteps((prev) => new Set(Array.from(prev).concat(data.step)));
      setStepMs((prev) => ({ ...prev, [data.step]: data.ms }));

      if (data.done) {
        setActiveStep(null);
        stopTimer();
        setElapsed(Date.now() - startRef.current);
        setStatus("DONE");
        setUsdcReceived((u) => parseFloat((u + 0.001).toFixed(3)));
        setShowBasescan(true);
        if (data.score != null) {
          setScore(data.score);
          setScoreAtPayment(data.score);
          if (data.tier) setTier(data.tier);
        }
        es.close();
        setRunning(false);
      }
    };

    es.onerror = () => {
      setActiveStep(null);
      stopTimer();
      setStatus("IDLE");
      setRunning(false);
      es.close();
    };
  }

  const isBad        = selectedAgent === "bad";
  const displayScore = isBad ? badScore : score;
  const displayTier  = isBad ? null : tier;
  const badge        = tierBadge(displayTier);
  const accentColor  = isBad ? "#E74C3C" : "#2F80ED";

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes popIn {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50%       { box-shadow: 0 0 8px 2px rgba(59,130,246,0.25); }
        }
        .step-active {
          animation: pulse-glow 1.8s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex h-screen w-screen overflow-hidden font-mono"
        style={{ background: "#080B10", color: "#E6EDF3" }}>

        {/* Home */}
        <a href="/"
          className="absolute top-4 left-6 z-10 text-xs font-mono transition-colors"
          style={{ color: "#8B949E" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E6EDF3")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8B949E")}>
          ← Home
        </a>

        {/* ── PANEL 1: AGENT ── */}
        <div className="flex flex-col border-r p-8 gap-8 transition-all duration-300"
          style={{ background: "#0D1117", borderColor: accentColor, width: "22%" }}>

          <div>
            <Label red={isBad}>{isBad ? "Unverified Agent" : "AI Agent"}</Label>
            <p className="text-xs" style={{ color: accentColor }}>
              {trunc(isBad ? BAD_AGENT_ADDRESS : AGENT_ADDRESS)}
            </p>
          </div>

          <div>
            <Label>Reputation Score</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold leading-none" style={{ fontSize: 56, color: "#E6EDF3" }}>
                <AnimatedScore value={displayScore} />
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded"
                style={{ background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>
            {isBad && (
              <p className="text-xs mt-2" style={{ color: "#E74C3C" }}>
                Last attempt: signature replay detected
              </p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border uppercase tracking-widest ${
              status === "PAYING"     ? "border-blue-500 text-blue-400"
              : status === "DONE"    ? "border-green-500 text-green-400"
              : status === "REJECTED"? "border-red-500 text-red-400"
              : "border-gray-600 text-gray-400"
            }`}>
              {status === "PAYING" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
              {status}
            </span>
          </div>

          {isBad && (
            <div>
              <Label>Payment Attempts</Label>
              <p className="text-sm font-bold" style={{ color: "#E74C3C" }}>3 failed attempts</p>
            </div>
          )}
        </div>

        {/* ── PANEL 2: X402 FLOW ── */}
        <div className="flex flex-col border-r p-8 gap-4"
          style={{ background: "#0D1117", borderColor: "#1C2333", width: "40%" }}>

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <Label>X402 Payment Flow</Label>
              <p className="text-2xl font-bold" style={{ color: "#2F80ED" }}>
                {elapsed > 0 ? `${elapsed.toLocaleString()}ms` : "0ms"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {running && (
                <span className="w-2 h-2 rounded-full"
                  style={{ background: "#10B981", boxShadow: "0 0 6px #10B981",
                    animation: "pulse-glow 1s ease-in-out infinite" }} />
              )}
              <span className="text-xs font-mono uppercase tracking-widest"
                style={{ color: "#10B981" }}>
                SwarmPay Router
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col flex-1 overflow-auto" style={{ gap: 8 }}>
            {STEPS.map(({ label, swarmpay }, i) => {
              const step = i + 1;
              const done        = completedSteps.has(step);
              const isActive    = activeStep === step;
              const isRejected  = rejectedStep === step;
              const afterRej    = rejectedStep != null && step > rejectedStep;

              // slide-in stagger on mount
              const slideStyle = mounted
                ? { animation: `slideIn 0.35s ease both`, animationDelay: `${i * 50}ms` }
                : { opacity: 0 };

              // row background
              let rowBg = "transparent";
              if (isActive) rowBg = "rgba(59,130,246,0.06)";
              else if (done && swarmpay) rowBg = "rgba(16,185,129,0.06)";
              else if (isRejected) rowBg = "rgba(239,68,68,0.06)";

              // left border accent
              let borderLeft = "2px solid #1C2333";
              if (isActive) borderLeft = "2px solid #3B82F6";
              else if (done && swarmpay) borderLeft = "2px solid #10B981";
              else if (done && !swarmpay) borderLeft = "2px solid #6B7280";
              else if (isRejected) borderLeft = "2px solid #EF4444";

              // text color
              let textColor = "#8B949E";
              if (isActive) textColor = "#E6EDF3";
              else if (done && swarmpay) textColor = "#6EE7B7";
              else if (done && !swarmpay) textColor = "#E6EDF3";
              else if (isRejected) textColor = "#F87171";

              const displayLabel = isRejected ? "Merchant rejected — low trust score" : label;

              return (
                <div key={step}
                  className={isActive ? "step-active" : ""}
                  style={{
                    ...slideStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    borderRadius: 6,
                    background: rowBg,
                    borderLeft,
                    opacity: afterRej ? 0.2 : 1,
                    transition: "background 0.3s, border-left 0.3s, opacity 0.3s",
                  }}>

                  {/* Icon */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {isRejected ? <Cross />
                      : isActive ? <Spinner />
                      : done ? <Check color={swarmpay ? "#10B981" : "#E6EDF3"} />
                      : <span className="text-xs" style={{ color: "#4B5563" }}>{step}</span>}
                  </div>

                  {/* Label */}
                  <span className="text-xs flex-1 transition-colors duration-300"
                    style={{ color: textColor }}>
                    {displayLabel}
                  </span>

                  {/* Right side: ms + swarmpay badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {done && swarmpay && (
                      <span className="text-xs font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ background: "#065F46", color: "#6EE7B7", fontSize: 9 }}>
                        SwarmPay
                      </span>
                    )}
                    <span className="text-xs" style={{
                      color: isRejected ? "#F87171" : "#4B5563",
                      opacity: (done || isRejected) && stepMs[step] != null ? 1 : 0,
                      minWidth: 48, textAlign: "right",
                    }}>
                      {stepMs[step] != null ? `${stepMs[step]}ms` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Basescan */}
          {showBasescan && (
            <a href="https://basescan.org/address/0xb194262C09f89F726172d5E29a4bb18f11403a52"
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono transition-colors"
              style={{ color: "#10B981" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6EE7B7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#10B981")}>
              ↗ Verify on Basescan
            </a>
          )}

          {/* Agent selector */}
          <div>
            <Label>Run As Agent</Label>
            <div className="flex gap-2">
              <button onClick={() => { if (!running) { setSelectedAgent("good"); setStatus("IDLE"); resetState(); setElapsed(0); } }}
                className="flex-1 py-2 text-xs uppercase tracking-widest rounded border transition-all duration-150"
                style={{
                  borderColor: selectedAgent === "good" ? "#2F80ED" : "#1C2333",
                  background: selectedAgent === "good" ? "#1E3A5F" : "transparent",
                  color: selectedAgent === "good" ? "#60A5FA" : "#8B949E",
                  cursor: running ? "not-allowed" : "pointer",
                }}>
                {trunc(AGENT_ADDRESS)}
              </button>
              <button onClick={() => { if (!running) { setSelectedAgent("bad"); setStatus("IDLE"); resetState(); setElapsed(0); } }}
                className="flex-1 py-2 text-xs uppercase tracking-widest rounded border transition-all duration-150"
                style={{
                  borderColor: selectedAgent === "bad" ? "#E74C3C" : "#1C2333",
                  background: selectedAgent === "bad" ? "#3B1010" : "transparent",
                  color: selectedAgent === "bad" ? "#F87171" : "#8B949E",
                  cursor: running ? "not-allowed" : "pointer",
                }}>
                {trunc(BAD_AGENT_ADDRESS)}
              </button>
            </div>
          </div>

          <button onClick={runDemo} disabled={running}
            className="w-full py-4 text-sm uppercase font-bold tracking-widest rounded transition-all duration-200"
            style={{
              background: running ? "#1C2333" : isBad ? "#7F1D1D" : "#2F80ED",
              color: running ? "#8B949E" : "#fff",
              cursor: running ? "not-allowed" : "pointer",
              border: "none",
            }}>
            {running ? "RUNNING..." : "RUN DEMO"}
          </button>
        </div>

        {/* ── PANEL 3: MERCHANT ── */}
        <div className="flex flex-col p-8 gap-8"
          style={{ background: "#0D1117", width: "38%" }}>

          <div>
            <Label>API Merchant</Label>
            <p className="text-xs" style={{ color: "#2F80ED" }}>{trunc(MERCHANT_ADDRESS)}</p>
          </div>

          <div>
            <Label>USDC Received</Label>
            <UsdcCounter value={usdcReceived} />
          </div>

          <div>
            <Label>Agent Score at Payment</Label>
            <p className="font-bold leading-none" style={{
              fontSize: 40,
              color: isBad ? "#E74C3C" : "#E6EDF3",
            }}>
              {isBad ? 0 : (scoreAtPayment ?? "—")}
            </p>
            <p className="text-xs mt-1" style={{ color: "#8B949E" }}>
              {trunc(isBad ? BAD_AGENT_ADDRESS : AGENT_ADDRESS)}
            </p>
          </div>

          <div>
            <Label>Serve This Agent?</Label>
            {isBad ? (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#8B949E" }}>
                  {trunc(BAD_AGENT_ADDRESS)}
                </span>
                <span className="text-sm font-bold px-3 py-0.5 rounded border"
                  style={{ color: "#E74C3C", borderColor: "#E74C3C" }}>
                  ❌ NO
                </span>
              </div>
            ) : status !== "DONE" ? (
              <span style={{ color: "#8B949E" }}>—</span>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#8B949E" }}>
                  {trunc(AGENT_ADDRESS)}
                </span>
                {(scoreAtPayment ?? 0) > 400 ? (
                  <span className="text-sm font-bold px-3 py-0.5 rounded border"
                    style={{ color: "#27AE60", borderColor: "#27AE60" }}>
                    ✅ YES
                  </span>
                ) : (
                  <span className="text-sm font-bold px-3 py-0.5 rounded border"
                    style={{ color: "#E74C3C", borderColor: "#E74C3C" }}>
                    ❌ NO
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DemoDashboardPage() {
  return (
    <Suspense>
      <DemoDashboard />
    </Suspense>
  );
}
