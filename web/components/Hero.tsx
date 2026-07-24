"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";

interface Particle {
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  shape: number; // 0=triangle, 1=circle, 2=diamond
  alpha: number;
  phase: number;
  orbitSpeed: number;
  orbitRadius: number;
  layer: number; // 0=outline, 1=fill, 2=sparse
}

type Pt = [number, number];

const SHAPE_NAMES = ["agent", "handshake", "gauge", "shield"] as const;

// ── Point-cloud primitives ──
// Small helpers so every shape generator scatters particles the same way.

const jit = (s: number) => (Math.random() - 0.5) * s;

// Particles strung along a straight segment
function strokeLine(pts: Pt[], n: number, ax: number, ay: number, bx: number, by: number, spread: number) {
  for (let i = 0; i < n; i++) {
    const t = Math.random();
    pts.push([ax + (bx - ax) * t + jit(spread), ay + (by - ay) * t + jit(spread)]);
  }
}

// Particles along an arc (angles in radians, ry defaults to rx for a circle)
function strokeArc(
  pts: Pt[], n: number, cx: number, cy: number,
  rx: number, a0: number, a1: number, spread: number, ry = rx,
) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * rx + jit(spread), cy + Math.sin(a) * ry + jit(spread)]);
  }
}

// Particles along a rounded-rectangle outline
function strokeRoundRect(
  pts: Pt[], n: number, x: number, y: number, w: number, h: number, r: number, spread: number,
) {
  const straight = 2 * (w - 2 * r) + 2 * (h - 2 * r);
  const curved = 2 * Math.PI * r;
  const total = straight + curved;
  for (let i = 0; i < n; i++) {
    let d = Math.random() * total;
    // top edge
    if (d < w - 2 * r) { pts.push([x + r + d + jit(spread), y + jit(spread)]); continue; }
    d -= w - 2 * r;
    // top-right corner
    if (d < Math.PI * r * 0.5) {
      const a = -Math.PI / 2 + d / r;
      pts.push([x + w - r + Math.cos(a) * r + jit(spread), y + r + Math.sin(a) * r + jit(spread)]);
      continue;
    }
    d -= Math.PI * r * 0.5;
    // right edge
    if (d < h - 2 * r) { pts.push([x + w + jit(spread), y + r + d + jit(spread)]); continue; }
    d -= h - 2 * r;
    // bottom-right corner
    if (d < Math.PI * r * 0.5) {
      const a = d / r;
      pts.push([x + w - r + Math.cos(a) * r + jit(spread), y + h - r + Math.sin(a) * r + jit(spread)]);
      continue;
    }
    d -= Math.PI * r * 0.5;
    // bottom edge
    if (d < w - 2 * r) { pts.push([x + w - r - d + jit(spread), y + h + jit(spread)]); continue; }
    d -= w - 2 * r;
    // bottom-left corner
    if (d < Math.PI * r * 0.5) {
      const a = Math.PI / 2 + d / r;
      pts.push([x + r + Math.cos(a) * r + jit(spread), y + h - r + Math.sin(a) * r + jit(spread)]);
      continue;
    }
    d -= Math.PI * r * 0.5;
    // left edge
    if (d < h - 2 * r) { pts.push([x + jit(spread), y + h - r - d + jit(spread)]); continue; }
    d -= h - 2 * r;
    // top-left corner
    const a = Math.PI + d / r;
    pts.push([x + r + Math.cos(a) * r + jit(spread), y + r + Math.sin(a) * r + jit(spread)]);
  }
}

// Solid disc of particles
function fillDisc(pts: Pt[], n: number, cx: number, cy: number, r: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
}

// ── Shape generators ──
// Each returns exactly `count` points so particles can morph 1:1 between shapes.

// Agent head — rounded chassis, antenna, two glowing eyes. "An AI agent."
function agentShape(cx: number, cy: number, scale: number, count: number): Pt[] {
  const pts: Pt[] = [];
  const W = 132 * scale;
  const H = 116 * scale;
  const x = cx - W / 2;
  const y = cy - H / 2 + 10 * scale;
  const r = 34 * scale;
  const sp = 3.2 * scale;

  // Head chassis outline — drawn twice for a bright, readable silhouette
  strokeRoundRect(pts, Math.floor(count * 0.3), x, y, W, H, r, sp);
  strokeRoundRect(pts, Math.floor(count * 0.1), x + 4 * scale, y + 4 * scale, W - 8 * scale, H - 8 * scale, r - 3 * scale, sp);

  // Antenna — stalk rising from the top plus a bulb
  const stalkTop = y - 30 * scale;
  strokeLine(pts, Math.floor(count * 0.05), cx, y, cx, stalkTop, 2.4 * scale);
  fillDisc(pts, Math.floor(count * 0.06), cx, stalkTop - 7 * scale, 9 * scale);

  // Eyes — solid discs, the strongest "this is a face" cue
  const eyeY = cy + 2 * scale;
  const eyeDX = 30 * scale;
  fillDisc(pts, Math.floor(count * 0.09), cx - eyeDX, eyeY, 13 * scale);
  fillDisc(pts, Math.floor(count * 0.09), cx + eyeDX, eyeY, 13 * scale);

  // Mouth / speaker grille — three short bars
  for (let i = 0; i < 3; i++) {
    const my = cy + 34 * scale + i * 7 * scale;
    strokeLine(pts, Math.floor(count * 0.022), cx - 20 * scale, my, cx + 20 * scale, my, 1.8 * scale);
  }

  // Side ears / mounts
  strokeLine(pts, Math.floor(count * 0.03), x - 9 * scale, cy - 12 * scale, x - 9 * scale, cy + 12 * scale, 2.4 * scale);
  strokeLine(pts, Math.floor(count * 0.03), x + W + 9 * scale, cy - 12 * scale, x + W + 9 * scale, cy + 12 * scale, 2.4 * scale);

  // Faint interior fill so the head reads as a solid body
  while (pts.length < count) {
    const px = x + Math.random() * W;
    const py = y + Math.random() * H;
    const dx = Math.max(Math.abs(px - cx) - (W / 2 - r), 0);
    const dy = Math.max(Math.abs(py - (y + H / 2)) - (H / 2 - r), 0);
    if (dx * dx + dy * dy <= r * r) pts.push([px, py]);
  }

  return pts.slice(0, count);
}

// Two agents shaking hands — agreement between agents.
// Bodies are clusters and arms are thick strokes; finger detail would not
// survive at this particle density, so the handshake reads as interlocking arms.
function handshakeShape(cx: number, cy: number, scale: number, count: number): Pt[] {
  const pts: Pt[] = [];
  const bodyDX = 62 * scale;
  const headR = 22 * scale;
  const headY = cy - 48 * scale;
  const shoulderY = cy - 6 * scale;
  const gripY = cy + 16 * scale;

  // Solid agent bodies — head disc plus a filled torso block on each side.
  // Filled masses (not outlines) are what make the two figures read.
  for (const sx of [-1, 1]) {
    const bx = cx + sx * bodyDX;

    // Head
    fillDisc(pts, Math.floor(count * 0.1), bx, headY, headR);

    // Antenna nub so each figure reads as an agent, not a person
    strokeLine(pts, Math.floor(count * 0.012), bx, headY - headR, bx, headY - headR - 15 * scale, 2 * scale);
    fillDisc(pts, Math.floor(count * 0.014), bx, headY - headR - 20 * scale, 6 * scale);

    // Torso — filled rounded mass under the head
    const tw = 44 * scale;
    const th = 56 * scale;
    const tx = bx - tw / 2;
    const ty = shoulderY;
    const n = Math.floor(count * 0.11);
    for (let i = 0; i < n; i++) {
      const px = tx + Math.random() * tw;
      const py = ty + Math.random() * th;
      // taper the outer shoulder so the silhouette isn't a plain rectangle
      const edge = (py - ty) / th;
      if (Math.abs(px - bx) < (tw / 2) * (1 - edge * 0.25)) pts.push([px, py]);
    }
  }

  // Arms — thick strokes from each shoulder into the clasp
  for (const sx of [-1, 1]) {
    const bx = cx + sx * bodyDX;
    strokeLine(
      pts, Math.floor(count * 0.075),
      bx - sx * 24 * scale, shoulderY + 8 * scale,
      cx - sx * 26 * scale, gripY - 8 * scale,
      5 * scale,
    );
    strokeLine(
      pts, Math.floor(count * 0.06),
      cx - sx * 26 * scale, gripY - 8 * scale,
      cx - sx * 3 * scale, gripY,
      5.5 * scale,
    );
  }

  // The clasp — brightest, densest mass, the focal point of the whole shape
  fillDisc(pts, Math.floor(count * 0.19), cx, gripY, 21 * scale);

  // Agreement spark above the clasp
  fillDisc(pts, Math.floor(count * 0.03), cx, gripY - 52 * scale, 8 * scale);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.15 + (i / 5) * 0.7);
    strokeLine(
      pts, Math.floor(count * 0.006),
      cx + Math.cos(a) * 14 * scale, gripY - 52 * scale + Math.sin(a) * 14 * scale,
      cx + Math.cos(a) * 24 * scale, gripY - 52 * scale + Math.sin(a) * 24 * scale,
      1.6 * scale,
    );
  }

  // Remainder thickens the clasp and arms rather than scattering into an aura
  while (pts.length < count) {
    if (Math.random() < 0.55) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 26 * scale;
      pts.push([cx + Math.cos(a) * rr, gripY + Math.sin(a) * rr]);
    } else {
      const sx = Math.random() < 0.5 ? -1 : 1;
      const bx = cx + sx * bodyDX;
      const t = Math.random();
      pts.push([
        bx - sx * 24 * scale + (cx - sx * 3 * scale - (bx - sx * 24 * scale)) * t + jit(7 * scale),
        shoulderY + 8 * scale + (gripY - shoulderY - 8 * scale) * t + jit(7 * scale),
      ]);
    }
  }

  return pts.slice(0, count);
}

// Trust score gauge — arc meter with a needle. The score SwarmPay returns.
function gaugeShape(cx: number, cy: number, scale: number, count: number): Pt[] {
  const pts: Pt[] = [];
  const R = 96 * scale;
  const sp = 3 * scale;
  const gy = cy + 26 * scale; // pivot sits low so the arc fills the frame
  const a0 = Math.PI * 1.06;  // sweep from lower-left
  const a1 = Math.PI * 1.94;  // to lower-right

  // Meter arc — three concentric passes for a thick, bright band
  strokeArc(pts, Math.floor(count * 0.17), cx, gy, R, a0, a1, sp);
  strokeArc(pts, Math.floor(count * 0.13), cx, gy, R - 9 * scale, a0, a1, sp);
  strokeArc(pts, Math.floor(count * 0.1), cx, gy, R - 18 * scale, a0, a1, sp);

  // Tick marks radiating outward along the arc
  const ticks = 11;
  for (let i = 0; i < ticks; i++) {
    const a = a0 + ((a1 - a0) * i) / (ticks - 1);
    const major = i % 5 === 0;
    const inner = R + 4 * scale;
    const outer = R + (major ? 20 : 12) * scale;
    strokeLine(
      pts, Math.floor(count * (major ? 0.017 : 0.011)),
      cx + Math.cos(a) * inner, gy + Math.sin(a) * inner,
      cx + Math.cos(a) * outer, gy + Math.sin(a) * outer,
      2 * scale,
    );
  }

  // Needle pointing high — a good score
  const na = Math.PI * 1.72;
  strokeLine(pts, Math.floor(count * 0.1), cx, gy, cx + Math.cos(na) * (R - 14 * scale), gy + Math.sin(na) * (R - 14 * scale), 3.4 * scale);

  // Hub at the pivot
  fillDisc(pts, Math.floor(count * 0.07), cx, gy, 13 * scale);

  // Score readout bar under the arc — suggests a number without drawing digits
  strokeLine(pts, Math.floor(count * 0.04), cx - 34 * scale, gy + 34 * scale, cx + 34 * scale, gy + 34 * scale, 2.6 * scale);

  // Faint fill inside the dial
  while (pts.length < count) {
    const a = a0 + Math.random() * (a1 - a0);
    const rr = Math.sqrt(Math.random()) * (R - 22 * scale);
    pts.push([cx + Math.cos(a) * rr, gy + Math.sin(a) * rr]);
  }

  return pts.slice(0, count);
}

// Trust shield — the credit-bureau/verification mark
function shieldShape(cx: number, cy: number, scale: number, count: number): Pt[] {
  const pts: Pt[] = [];
  const W = 72 * scale;
  const top = cy - 78 * scale;
  const shoulder = cy - 30 * scale;
  const tip = cy + 92 * scale;

  // Shield outline: flat top, straight sides, curved taper to a point
  const outline = (t: number): Pt => {
    // t in [0,1) travels clockwise around the silhouette
    if (t < 0.16) {
      // top edge, left → right
      return [cx - W + (t / 0.16) * W * 2, top];
    } else if (t < 0.36) {
      // right side down to shoulder
      const lt = (t - 0.16) / 0.2;
      return [cx + W, top + lt * (shoulder - top)];
    } else if (t < 0.5) {
      // right taper to tip
      const lt = (t - 0.36) / 0.14;
      return [cx + W * (1 - lt * lt * 0.98), shoulder + lt * (tip - shoulder)];
    } else if (t < 0.64) {
      // left taper from tip
      const lt = (t - 0.5) / 0.14;
      return [cx - W * (lt * lt * 0.98 + 0.02), tip - lt * (tip - shoulder)];
    } else if (t < 0.84) {
      // left side up to top
      const lt = (t - 0.64) / 0.2;
      return [cx - W, shoulder - lt * (shoulder - top)];
    }
    // wrap along top edge again for density
    const lt = (t - 0.84) / 0.16;
    return [cx - W + lt * W * 2, top];
  };

  const outlineCount = Math.floor(count * 0.42);
  for (let i = 0; i < outlineCount; i++) {
    const [x, y] = outline(i / outlineCount);
    pts.push([x + (Math.random() - 0.5) * 4 * scale, y + (Math.random() - 0.5) * 4 * scale]);
  }

  // Checkmark inside
  const checkCount = Math.floor(count * 0.16);
  for (let i = 0; i < checkCount; i++) {
    const t = i / checkCount;
    let x: number, y: number;
    if (t < 0.4) {
      const lt = t / 0.4;
      x = cx - 38 * scale + lt * 30 * scale;
      y = cy - 6 * scale + lt * 32 * scale;
    } else {
      const lt = (t - 0.4) / 0.6;
      x = cx - 8 * scale + lt * 52 * scale;
      y = cy + 26 * scale - lt * 62 * scale;
    }
    pts.push([x + (Math.random() - 0.5) * 4 * scale, y + (Math.random() - 0.5) * 4 * scale]);
  }

  // Interior fill, rejection-sampled inside the silhouette
  let guard = 0;
  while (pts.length < count && guard < count * 40) {
    guard++;
    const y = top + Math.random() * (tip - top);
    let halfW: number;
    if (y <= shoulder) {
      halfW = W;
    } else {
      const lt = (y - shoulder) / (tip - shoulder);
      halfW = W * (1 - lt * lt * 0.98);
    }
    const x = cx + (Math.random() * 2 - 1) * halfW;
    pts.push([x, y]);
  }
  while (pts.length < count) pts.push([cx, cy]);

  return pts.slice(0, count);
}

function buildShape(name: string, cx: number, cy: number, scale: number, count: number): Pt[] {
  switch (name) {
    case "handshake": return handshakeShape(cx, cy, scale, count);
    case "gauge":     return gaugeShape(cx, cy, scale, count);
    case "shield":    return shieldShape(cx, cy, scale, count);
    default:          return agentShape(cx, cy, scale, count);
  }
}

const SHAPE_PARTICLES = 3400;
const AMBIENT_PARTICLES = 50;

function ParticleConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const shapeIdxRef = useRef(0);

  // Morph every shaped particle to the next silhouette with a randomized stagger
  const morphTo = useCallback((name: string) => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const cx = w * 0.68;
    const cy = h * 0.46;
    const scale = Math.min(w, h) * 0.0038;

    const shaped = particlesRef.current.filter((p) => p.layer !== 2);
    const targets = buildShape(name, cx, cy, scale, shaped.length);

    tlRef.current?.kill();
    const tl = gsap.timeline();
    tl.to(shaped, {
      baseX: (i: number) => targets[i][0],
      baseY: (i: number) => targets[i][1],
      duration: 2.1,
      ease: "power2.inOut",
      stagger: { amount: 0.7, from: "random" },
    });
    tlRef.current = tl;
  }, []);

  const buildParticles = useCallback(() => {
    const w = sizeRef.current.w;
    const h = sizeRef.current.h;
    if (!w || !h) return;

    const cx = w * 0.68;
    const cy = h * 0.46;
    const scale = Math.min(w, h) * 0.0038;

    const colors = ["#8052ff", "#9b75ff", "#a68bff", "#ffb829", "#e5a520", "#15846e", "#1a9e82", "#ffffff", "#bdbdbd", "#8052ff", "#8052ff", "#7040ee"];

    const makeParticle = (x: number, y: number, layer: number, sizeMultiplier = 1): Particle => ({
      baseX: x,
      baseY: y,
      size: (1.2 + Math.random() * 3) * sizeMultiplier,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.floor(Math.random() * 3),
      alpha: layer === 0 ? 0.7 + Math.random() * 0.3 : layer === 1 ? 0.4 + Math.random() * 0.45 : 0.1 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.15 + Math.random() * 0.5,
      orbitRadius: layer === 0 ? 1 + Math.random() * 3 : 2 + Math.random() * 5,
      layer,
    });

    const particles: Particle[] = [];

    // Shaped particles — these are the ones GSAP morphs between silhouettes.
    // Mixed layer 0/1 so the crowd keeps the original depth/alpha variation.
    const start = buildShape(SHAPE_NAMES[shapeIdxRef.current], cx, cy, scale, SHAPE_PARTICLES);
    for (let i = 0; i < SHAPE_PARTICLES; i++) {
      const layer = i % 3 === 0 ? 1 : 0;
      const sizeMul = layer === 0 ? 0.8 + Math.random() * 0.5 : 1;
      particles.push(makeParticle(start[i][0], start[i][1], layer, sizeMul));
    }

    // Sparse ambient particles across the whole canvas — never morph
    for (let i = 0; i < AMBIENT_PARTICLES; i++) {
      particles.push(makeParticle(Math.random() * w, Math.random() * h, 2, 1.5 + Math.random()));
    }

    particlesRef.current = particles;
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = sizeRef.current.w;
    const h = sizeRef.current.h;

    // Only resize the backing store when it actually changes — reallocating
    // every frame tanks framerate at 2000+ particles.
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const t = time * 0.001;

    // Slow global sway so the cloud never sits perfectly still between morphs
    const cx = w * 0.68;
    const cy = h * 0.46;
    const spin = Math.sin(t * 0.12) * 0.06;
    const cosS = Math.cos(spin);
    const sinS = Math.sin(spin);

    for (const p of particlesRef.current) {
      // Organic orbit motion
      const ox = Math.cos(t * p.orbitSpeed + p.phase) * p.orbitRadius;
      const oy = Math.sin(t * p.orbitSpeed * 0.8 + p.phase * 1.3) * p.orbitRadius;

      let x = p.baseX + ox;
      let y = p.baseY + oy;

      // Ambient layer stays put; shaped particles sway with the cloud
      if (p.layer !== 2) {
        const dx = x - cx;
        const dy = y - cy;
        x = cx + dx * cosS - dy * sinS;
        y = cy + dx * sinS + dy * cosS;
      }

      // Breathing alpha
      const breath = 0.82 + 0.18 * Math.sin(t * 0.8 + p.phase);
      ctx.globalAlpha = p.alpha * breath;
      ctx.fillStyle = p.color;

      const s = p.size;

      if (p.shape === 0) {
        // Triangle
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.6);
        ctx.lineTo(x - s * 0.5, y + s * 0.4);
        ctx.lineTo(x + s * 0.5, y + s * 0.4);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 1) {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.5);
        ctx.lineTo(x + s * 0.4, y);
        ctx.lineTo(x, y + s * 0.5);
        ctx.lineTo(x - s * 0.4, y);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    animRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      // Rebuild at the shape we're currently on so a resize doesn't snap us back to the brain
      tlRef.current?.kill();
      buildParticles();
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    resize();
    animRef.current = requestAnimationFrame(render);
    window.addEventListener("resize", onResize);

    // Auto-cycle: brain → network → coin → shield → loop
    let cycle: ReturnType<typeof setInterval> | null = null;
    if (!reduceMotion) {
      cycle = setInterval(() => {
        shapeIdxRef.current = (shapeIdxRef.current + 1) % SHAPE_NAMES.length;
        morphTo(SHAPE_NAMES[shapeIdxRef.current]);
      }, 4200);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (cycle) clearInterval(cycle);
      tlRef.current?.kill();
    };
  }, [buildParticles, render, morphTo]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <ParticleConstellation />
      </div>

      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left: Text block */}
          <div>
            <h1
              className={`font-display font-light leading-[0.82] tracking-[-0.04em] text-bone mb-8 transition-all duration-1000 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <span className="block text-[clamp(52px,9vw,113px)]">
                Trust
              </span>
              <span className="block text-[clamp(52px,9vw,113px)]">
                Infrastructure
              </span>
              <span className="block text-[clamp(52px,9vw,113px)]">
                for Agents.
              </span>
            </h1>

            <p
              className={`font-display font-semibold text-xs uppercase tracking-[0.05em] text-plum-voltage mb-6 transition-all duration-700 delay-300 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              The Credit Bureau for the Agent Economy.
            </p>

            <p
              className={`font-display font-normal text-[15px] sm:text-[18px] leading-[1.5] tracking-[0.025em] text-bone/90 max-w-[460px] mb-10 transition-all duration-700 delay-[400ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              SwarmPay indexes on-chain behavioral signals into a unified trust score — so
              merchants, marketplaces, and lenders can price agent risk in real time.
            </p>

            <div
              className={`transition-all duration-700 delay-500 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <a
                href="/#waitlist"
                className="inline-block bg-plum-voltage hover:bg-plum-voltage/85 text-bone font-display font-semibold text-xs uppercase tracking-[0.05em] px-6 py-3.5 rounded-[24px] transition-colors duration-200"
              >
                Request Access
              </a>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>

        {/* Trust row */}
        <div
          className={`mt-8 transition-all duration-700 delay-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {[
              { label: "ERC-8004", sublabel: "On-chain Standard" },
              { label: "Base Mainnet", sublabel: "Production Network" },
              { label: "x402 Protocol", sublabel: "Payment Integration" },
              { label: "< 200ms", sublabel: "API Latency" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-6 sm:gap-10">
                {i > 0 && (
                  <div className="hidden sm:block w-px h-8 bg-white/[0.08]" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-bone font-display font-semibold text-sm tracking-[0.021em]">
                    {item.label}
                  </span>
                  <span className="text-smoke text-[10px] font-mono uppercase tracking-wider">
                    {item.sublabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
