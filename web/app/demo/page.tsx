"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

type Status = "IDLE" | "PAYING" | "DONE" | "REJECTED" | "BLOCKED";
type AgentKey = "good" | "bad";

function trunc(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function tierBadge(tier: string | null): { label: string; bg: string; color: string } {
  if (!tier || tier === "Unrated")
    return { label: "Unrated", bg: "rgba(255,255,255,0.06)", color: "#9a9a9a" };
  if (tier === "AAA") return { label: "AAA", bg: "rgba(21,132,110,0.18)", color: "#3ecbaa" };
  if (tier === "AA")  return { label: "AA",  bg: "rgba(21,132,110,0.12)", color: "#5fd6b8" };
  return { label: tier, bg: "rgba(128,82,255,0.16)", color: "#a68bff" };
}

function Label({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <p className="text-xs uppercase tracking-widest font-mono mb-3"
      style={{ color: red ? "#e05a4e" : "#9a9a9a" }}>
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
    <p className="font-bold leading-none transition-colors duration-300 font-display"
      style={{ fontSize: 48, color: flash ? "#3ecbaa" : "#15846e" }}>
      {value.toFixed(3)}
      <span className="text-sm font-normal ml-2" style={{ color: "#9a9a9a" }}>USDC</span>
    </p>
  );
}

// Spinner SVG
function Spinner() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <circle cx="6" cy="6" r="5" stroke="#8052ff" strokeWidth="2"
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
  const [failedStep, setFailedStep]         = useState<number | null>(null);
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
    setFailedStep(null);
    setStepMs({});
    setScoreAtPayment(null);
    setShowBasescan(false);
  }

  async function runDemoPresentation() {
    const isBadFlow = selectedAgent === "bad";
    setRunning(true);
    setStatus("PAYING");
    resetState();
    startTimer();

    // Bad agent: run steps 1–3, then fail at step 4
    if (isBadFlow) {
      let cumulative = 0;
      for (let i = 0; i < 4; i++) {
        const step = i + 1;
        setActiveStep(step);
        await new Promise<void>((r) => setTimeout(r, STEP_DELAYS[i]));
        cumulative += STEP_DELAYS[i];
        if (step === 4) {
          // Step 4 fails
          setFailedStep(4);
          setStepMs((prev) => ({ ...prev, [4]: cumulative }));
        } else {
          setCompletedSteps((prev) => new Set(Array.from(prev).concat(step)));
          setStepMs((prev) => ({ ...prev, [step]: cumulative }));
        }
      }
      setActiveStep(null);
      stopTimer();
      setElapsed(cumulative);
      setStatus("BLOCKED");
      setRunning(false);
      return;
    }

    // Good agent: all 11 steps
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
  const accentColor  = isBad ? "#e05a4e" : "#8052ff";

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
          0%, 100% { box-shadow: 0 0 0 0 rgba(128,82,255,0); }
          50%       { box-shadow: 0 0 8px 2px rgba(128,82,255,0.25); }
        }
        .step-active {
          animation: pulse-glow 1.8s ease-in-out infinite;
        }
      `}</style>

      <main className="min-h-screen bg-void">
        <Navbar />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-28 pb-8">
          <p className="font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-4">LIVE DEMO</p>
          <h1 className="font-display font-light text-[clamp(32px,4vw,44px)] leading-[1.1] tracking-[-0.04em] text-bone mb-4">
            Watch x402 Trust Gating in Real Time
          </h1>
          <p className="font-display font-normal text-[16px] leading-[1.5] tracking-[0.025em] text-ash max-w-2xl">
            A real payment flow through the SwarmPay router. Pick a good or bad agent and run the demo to see the score check, payment, and settlement happen live.
          </p>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-28">
          <div
            className="relative flex flex-col lg:flex-row overflow-hidden font-mono rounded-[24px] border border-white/[0.08]"
            style={{ background: "#050505", color: "#e6e6e6" }}
          >

            {/* ── PANEL 1: AGENT ── */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r p-6 sm:p-8 gap-8 transition-all duration-300 lg:w-[26%]"
              style={{ borderColor: "rgba(255,255,255,0.08)", borderLeftWidth: 0, borderLeftColor: accentColor }}>

              <div>
                <Label red={isBad}>{isBad ? "Unverified Agent" : "AI Agent"}</Label>
                <p className="text-xs" style={{ color: accentColor }}>
                  {trunc(isBad ? BAD_AGENT_ADDRESS : AGENT_ADDRESS)}
                </p>
              </div>

              <div>
                <Label>Reputation Score</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold leading-none font-display" style={{ fontSize: 56, color: "#ffffff" }}>
                    <AnimatedScore value={displayScore} />
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                {isBad && (
                  <p className="text-xs mt-2" style={{ color: "#e05a4e" }}>
                    Last attempt: signature replay detected
                  </p>
                )}
              </div>

              <div>
                <Label>Status</Label>
                <span className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border uppercase tracking-widest ${
                  status === "PAYING"      ? "border-plum-voltage/50 text-plum-voltage"
                  : status === "DONE"     ? "border-lichen/50 text-lichen"
                  : status === "REJECTED" ? "border-[#e05a4e]/50 text-[#e05a4e]"
                  : status === "BLOCKED"  ? "border-[#e05a4e]/50 text-[#e05a4e]"
                  : "border-white/[0.12] text-smoke"
                }`}>
                  {status === "PAYING" && <span className="w-1.5 h-1.5 rounded-full bg-plum-voltage animate-pulse" />}
                  {status}
                </span>
              </div>

              {isBad && (
                <div>
                  <Label>Payment Attempts</Label>
                  <p className="text-sm font-bold" style={{ color: "#e05a4e" }}>3 failed attempts</p>
                </div>
              )}
            </div>

            {/* ── PANEL 2: X402 FLOW ── */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r p-6 sm:p-8 gap-4 lg:w-[42%]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>

              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>X402 Payment Flow</Label>
                  <p className="text-2xl font-bold font-display" style={{ color: "#a68bff" }}>
                    {elapsed > 0 ? `${elapsed.toLocaleString()}ms` : "0ms"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {running && (
                    <span className="w-2 h-2 rounded-full"
                      style={{ background: "#15846e", boxShadow: "0 0 6px #15846e",
                        animation: "pulse-glow 1s ease-in-out infinite" }} />
                  )}
                  <span className="text-xs font-mono uppercase tracking-widest"
                    style={{ color: "#3ecbaa" }}>
                    SwarmPay Router
                  </span>
                </div>
              </div>

              {/* Steps */}
              <div className="flex flex-col flex-1 overflow-auto" style={{ gap: 8 }}>
                {STEPS.map(({ label, swarmpay }, i) => {
                  const step        = i + 1;
                  const done        = completedSteps.has(step);
                  const isActive    = activeStep === step;
                  const isRejected  = rejectedStep === step;
                  const isFailed    = failedStep === step;
                  const afterRej    = rejectedStep != null && step > rejectedStep;
                  const afterFail   = failedStep != null && step > failedStep;
                  const dimmed      = afterRej || afterFail;

                  const slideStyle = mounted
                    ? { animation: `slideIn 0.35s ease both`, animationDelay: `${i * 50}ms` }
                    : { opacity: 0 };

                  let rowBg = "transparent";
                  if (isFailed) rowBg = "rgba(224,90,78,0.08)";
                  else if (isActive) rowBg = "rgba(128,82,255,0.07)";
                  else if (done && swarmpay) rowBg = "rgba(21,132,110,0.08)";
                  else if (isRejected) rowBg = "rgba(224,90,78,0.06)";

                  let borderLeft = "2px solid rgba(255,255,255,0.08)";
                  if (isFailed) borderLeft = "2px solid #e05a4e";
                  else if (isActive) borderLeft = "2px solid #8052ff";
                  else if (done && swarmpay) borderLeft = "2px solid #15846e";
                  else if (done && !swarmpay) borderLeft = "2px solid #6B7280";
                  else if (isRejected) borderLeft = "2px solid #e05a4e";

                  let textColor = "#9a9a9a";
                  if (isFailed) textColor = "#f0918a";
                  else if (isActive) textColor = "#ffffff";
                  else if (done && swarmpay) textColor = "#3ecbaa";
                  else if (done && !swarmpay) textColor = "#ffffff";
                  else if (isRejected) textColor = "#f0918a";

                  const displayLabel = isFailed
                    ? "Score check: 0 < 400 threshold ✗"
                    : isRejected
                    ? "Merchant rejected — low trust score"
                    : label;

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
                        opacity: dimmed ? 0.2 : 1,
                        transition: "background 0.3s, border-left 0.3s, opacity 0.3s",
                      }}>

                      {/* Icon */}
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {(isRejected || isFailed) ? <Cross />
                          : isActive ? <Spinner />
                          : done ? <Check color={swarmpay ? "#15846e" : "#ffffff"} />
                          : <span className="text-xs" style={{ color: "#5a5a5a" }}>{step}</span>}
                      </div>

                      {/* Label */}
                      <span className="text-xs flex-1 transition-colors duration-300"
                        style={{ color: textColor }}>
                        {displayLabel}
                      </span>

                      {/* Right side: ms + swarmpay badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(done || isFailed) && swarmpay && (
                          <span className="text-xs font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: isFailed ? "rgba(224,90,78,0.15)" : "rgba(21,132,110,0.18)", color: isFailed ? "#f0918a" : "#3ecbaa", fontSize: 9 }}>
                            SwarmPay
                          </span>
                        )}
                        <span className="text-xs" style={{
                          color: (isRejected || isFailed) ? "#f0918a" : "#5a5a5a",
                          opacity: (done || isRejected || isFailed) && stepMs[step] != null ? 1 : 0,
                          minWidth: 48, textAlign: "right",
                        }}>
                          {stepMs[step] != null ? `${stepMs[step]}ms` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Blocked banner */}
              {status === "BLOCKED" && (
                <div className="text-xs font-mono px-3 py-2 rounded-md"
                  style={{ background: "rgba(224,90,78,0.1)", border: "1px solid rgba(224,90,78,0.3)", color: "#f0918a" }}>
                  Payment rejected — agent below trust threshold
                </div>
              )}

              {/* Basescan */}
              {showBasescan && (
                <a href="https://basescan.org/address/0xb194262C09f89F726172d5E29a4bb18f11403a52"
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono transition-colors"
                  style={{ color: "#3ecbaa" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#6ee0c4")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#3ecbaa")}>
                  ↗ Verify on Basescan
                </a>
              )}

              {/* Agent selector */}
              <div>
                <Label>Run As Agent</Label>
                <div className="flex gap-2">
                  <button onClick={() => { if (!running) { setSelectedAgent("good"); setStatus("IDLE"); resetState(); setElapsed(0); } }}
                    className="flex-1 py-2 text-xs uppercase tracking-widest rounded-md border transition-all duration-150"
                    style={{
                      borderColor: selectedAgent === "good" ? "#8052ff" : "rgba(255,255,255,0.08)",
                      background: selectedAgent === "good" ? "rgba(128,82,255,0.14)" : "transparent",
                      color: selectedAgent === "good" ? "#a68bff" : "#9a9a9a",
                      cursor: running ? "not-allowed" : "pointer",
                    }}>
                    {trunc(AGENT_ADDRESS)}
                  </button>
                  <button onClick={() => { if (!running) { setSelectedAgent("bad"); setStatus("IDLE"); resetState(); setElapsed(0); } }}
                    className="flex-1 py-2 text-xs uppercase tracking-widest rounded-md border transition-all duration-150"
                    style={{
                      borderColor: selectedAgent === "bad" ? "#e05a4e" : "rgba(255,255,255,0.08)",
                      background: selectedAgent === "bad" ? "rgba(224,90,78,0.14)" : "transparent",
                      color: selectedAgent === "bad" ? "#f0918a" : "#9a9a9a",
                      cursor: running ? "not-allowed" : "pointer",
                    }}>
                    {trunc(BAD_AGENT_ADDRESS)}
                  </button>
                </div>
              </div>

              <button onClick={runDemo} disabled={running}
                className="w-full py-4 text-sm uppercase font-bold tracking-widest rounded-[24px] transition-all duration-200"
                style={{
                  background: running ? "rgba(255,255,255,0.06)" : isBad ? "#8f2f27" : "#8052ff",
                  color: running ? "#9a9a9a" : "#fff",
                  cursor: running ? "not-allowed" : "pointer",
                  border: "none",
                }}>
                {running ? "RUNNING..." : "RUN DEMO"}
              </button>
            </div>

            {/* ── PANEL 3: MERCHANT ── */}
            <div className="flex flex-col p-6 sm:p-8 gap-8 lg:w-[32%]">

              <div>
                <Label>API Merchant</Label>
                <p className="text-xs" style={{ color: "#a68bff" }}>{trunc(MERCHANT_ADDRESS)}</p>
              </div>

              <div>
                <Label>USDC Received</Label>
                <UsdcCounter value={usdcReceived} />
              </div>

              <div>
                <Label>Agent Score at Payment</Label>
                <p className="font-bold leading-none font-display" style={{
                  fontSize: 40,
                  color: isBad ? "#e05a4e" : "#ffffff",
                }}>
                  {isBad ? 0 : (scoreAtPayment ?? "—")}
                </p>
                <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>
                  {trunc(isBad ? BAD_AGENT_ADDRESS : AGENT_ADDRESS)}
                </p>
              </div>

              <div>
                <Label>Serve This Agent?</Label>
                {isBad ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#9a9a9a" }}>
                      {trunc(BAD_AGENT_ADDRESS)}
                    </span>
                    <span className="text-sm font-bold px-3 py-0.5 rounded-md border"
                      style={{ color: "#e05a4e", borderColor: "#e05a4e" }}>
                      ❌ NO
                    </span>
                  </div>
                ) : status !== "DONE" ? (
                  <span style={{ color: "#9a9a9a" }}>—</span>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#9a9a9a" }}>
                      {trunc(AGENT_ADDRESS)}
                    </span>
                    {(scoreAtPayment ?? 0) > 400 ? (
                      <span className="text-sm font-bold px-3 py-0.5 rounded-md border"
                        style={{ color: "#3ecbaa", borderColor: "#3ecbaa" }}>
                        ✅ YES
                      </span>
                    ) : (
                      <span className="text-sm font-bold px-3 py-0.5 rounded-md border"
                        style={{ color: "#e05a4e", borderColor: "#e05a4e" }}>
                        ❌ NO
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
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
