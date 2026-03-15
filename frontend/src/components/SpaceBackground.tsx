"use client";
import { useEffect, useState } from "react";
import { useSpaceTheme } from "@/context/ThemeContext";

// Deterministic pseudo-random based on seed — no hydration mismatch
function rnd(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── Twinkle stars ──────────────────────────────────────────────────────────────
function StarLayer() {
  const stars = Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: rnd(i) * 100,
    y: rnd(i + 100) * 100,
    size: rnd(i + 200) * 1.6 + 0.4,
    delay: rnd(i + 300) * 8,
    duration: rnd(i + 400) * 5 + 3,
    opacity: rnd(i + 500) * 0.6 + 0.2,
  }));

  return (
    <>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            opacity: 0,
            willChange: "opacity",
          }}
        />
      ))}
    </>
  );
}

// ── Shooting stars ─────────────────────────────────────────────────────────────
function ShootingStars() {
  // 8 shooting stars, each fires at a different interval
  const stars = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: rnd(i + 600) * 55,         // start within top 55% of screen
    left: rnd(i + 700) * 60,        // start within left 60% of screen
    width: rnd(i + 800) * 80 + 80,  // 80–160px trail
    delay: rnd(i + 900) * 20,       // 0–20s initial delay
    period: rnd(i + 1000) * 12 + 10, // 10–22s between shots
  }));

  return (
    <>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.width}px`,
            height: "1.5px",
            background: "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 60%, transparent 100%)",
            borderRadius: "999px",
            transform: "rotate(315deg)",
            animation: `shooting-star ${s.period}s ${s.delay}s linear infinite`,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </>
  );
}

// ── Nebula drift ───────────────────────────────────────────────────────────────
function NebulaLayer() {
  const blobs = [
    { id: 0, color: "139,92,246",  x: 8,  y: 35, w: 55, h: 50, delay: 0,  dur: 18 },
    { id: 1, color: "6,182,212",   x: 82, y: 8,  w: 50, h: 45, delay: 4,  dur: 22 },
    { id: 2, color: "52,211,153",  x: 50, y: 75, w: 45, h: 40, delay: 8,  dur: 26 },
    { id: 3, color: "251,146,60",  x: 25, y: 60, w: 35, h: 30, delay: 12, dur: 20 },
  ];
  return (
    <>
      {blobs.map(b => (
        <div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.w}vw`,
            height: `${b.h}vh`,
            background: `radial-gradient(ellipse, rgba(${b.color},0.18) 0%, transparent 70%)`,
            filter: "blur(40px)",
            animation: `nebula-drift ${b.dur}s ${b.delay}s ease-in-out infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </>
  );
}

// ── Floating particles ─────────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    x: rnd(i + 1100) * 100,
    size: rnd(i + 1200) * 1.5 + 0.5,
    delay: rnd(i + 1300) * 20,
    duration: rnd(i + 1400) * 15 + 12,
    drift: (rnd(i + 1500) - 0.5) * 60, // horizontal drift in px
  }));

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-300/60"
          style={{
            left: `${p.x}%`,
            bottom: "-4px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particle-float ${p.duration}s ${p.delay}s ease-in-out infinite`,
            "--drift": `${p.drift}px`,
            opacity: 0,
            willChange: "transform, opacity",
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function SpaceBackground() {
  const { theme } = useSpaceTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || theme === "off") return null;

  const showStars   = theme === "full" || theme === "stars";
  const showShoots  = theme === "full" || theme === "stars";
  const showNebula  = theme === "full" || theme === "nebula";
  const showParts   = theme === "full";

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      {showNebula  && <NebulaLayer />}
      {showStars   && <StarLayer />}
      {showShoots  && <ShootingStars />}
      {showParts   && <Particles />}
    </div>
  );
}
