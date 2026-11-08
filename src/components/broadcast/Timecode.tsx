"use client";
import { useEffect, useRef } from "react";
import { SCHEDULE } from "@/lib/config";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Le timecode de la régie : l'heure de Lomé (= UTC) à 25 images/seconde, HH:MM:SS:FF.
 * Écrit directement dans le DOM (pas de rendu React à chaque image).
 */
export function Timecode({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = "";
    const tick = () => {
      const d = new Date();
      const ff = reduced ? "00" : pad(Math.floor(d.getUTCMilliseconds() / 40));
      const s = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}:${ff}`;
      if (s !== last && ref.current) ref.current.textContent = last = s;
      raf = reduced ? window.setTimeout(tick, 1000) : requestAnimationFrame(tick);
    };
    tick();
    return () => (reduced ? clearTimeout(raf) : cancelAnimationFrame(raf));
  }, []);
  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      --:--:--:--
    </span>
  );
}

/** Compte à rebours jusqu'à la première diffusion (1er décembre, premier créneau). */
export function Countdown({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const target = new Date(`${SCHEDULE.windowStart}T${SCHEDULE.startTimes[0]}:00Z`).getTime();
    const tick = () => {
      const ms = target - Date.now();
      if (!ref.current) return;
      if (ms <= 0) {
        ref.current.textContent = "À L'ANTENNE";
        return;
      }
      const s = Math.floor(ms / 1000);
      const j = Math.floor(s / 86400);
      ref.current.textContent = `J-${j} ${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      J-–– ––:––:––
    </span>
  );
}

/** Vu-mètre de la régie (décoratif). */
export function VuMeter({ bars = 6, className }: { bars?: number; className?: string }) {
  return (
    <span aria-hidden className={`vu inline-flex h-4 items-end gap-[2px] ${className ?? ""}`}>
      {Array.from({ length: bars }, (_, k) => (
        <span
          key={k}
          style={{ ["--k" as string]: k }}
          className="block h-full w-[3px] bg-[linear-gradient(to_top,#23d96b_0%,#23d96b_55%,#ffc53d_75%,#ff2d2d_100%)]"
        />
      ))}
    </span>
  );
}
