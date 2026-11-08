/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useId, useRef } from "react";
import { AFRICA_PATH, AFRICA_VIEWBOX } from "@/lib/geo/africa";
import { cn } from "@/lib/cn";

/**
 * Le mur du studio OCD Live, recréé en code : une plaque en forme d'Afrique,
 * décollée du mur et rétroéclairée, avec l'enseigne OCD en lettres orange en relief
 * et « Live » en noir. Au chargement, les LED s'allument une fois en vacillant.
 *
 * - `intensity` fait monter la lumière quand on survole un choix.
 * - `tilt` (ordinateur seulement) : la plaque s'incline légèrement vers la souris,
 *   pendant que la lumière reste sur le mur, comme un vrai objet monté à distance du mur.
 * - `onAir` : le voyant « EN DIRECT » du plateau s'allume juste après les LED.
 */
export function StudioWall({
  className,
  intensity = 1,
  animate = true,
  tilt = false,
  onAir = false,
}: {
  className?: string;
  intensity?: number;
  animate?: boolean;
  tilt?: boolean;
  onAir?: boolean;
}) {
  const { width: W, height: H } = AFRICA_VIEWBOX;
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tilt) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = root.current;
        const p = plate.current;
        if (!el || !p) return;
        const r = el.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
        const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9)));
        p.style.transform = `perspective(1400px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg) translate3d(${(x * 4).toFixed(1)}px, ${(y * 3).toFixed(1)}px, 0)`;
      });
    };
    const onLeave = () => {
      if (plate.current) plate.current.style.transform = "";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [tilt]);

  const box = "absolute -inset-[6%] h-[112%] w-[112%] overflow-visible";
  const vb = `-60 -60 ${W + 120} ${H + 120}`;

  return (
    <div ref={root} className={cn("@container relative select-none", className)} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden>
      {/* ── Le mur : la lumière et l'ombre ne bougent pas ── */}
      <svg viewBox={vb} className={box}>
        <defs>
          <filter id={id("wide")} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="58" />
          </filter>
          <filter id={id("mid")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="17" />
          </filter>
          <filter id={id("rim")} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id={id("cast")} x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <g
          className={animate ? "studio-lights" : undefined}
          style={{ opacity: Math.min(1, 0.75 + 0.25 * intensity), transition: "opacity 600ms var(--ease-out)" }}
        >
          <path
            d={AFRICA_PATH}
            fill="#FF8A1F"
            filter={`url(#${id("wide")})`}
            style={{
              opacity: 0.5 + 0.22 * intensity,
              transform: `scale(${1 + 0.035 * intensity})`,
              transformOrigin: "50% 50%",
              transformBox: "fill-box",
              transition: "transform 700ms var(--ease-out), opacity 700ms var(--ease-out)",
            }}
          />
          <path d={AFRICA_PATH} fill="#FFA43A" filter={`url(#${id("mid")})`} />
          <path d={AFRICA_PATH} fill="#FFE2A6" filter={`url(#${id("rim")})`} />
        </g>
        <path d={AFRICA_PATH} fill="#3B2410" opacity={0.16} filter={`url(#${id("cast")})`} transform="translate(8 14)" />
      </svg>

      {/* ── La plaque et l'enseigne : l'objet monté sur le mur ── */}
      <div ref={plate} className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform" style={{ transformStyle: "preserve-3d" }}>
        <svg viewBox={vb} className={box}>
          <defs>
            {/* éclairée en haut à gauche, un peu plus mate en bas à droite */}
            <linearGradient id={id("plate")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.55" stopColor="#FBF9F6" />
              <stop offset="1" stopColor="#EFEAE3" />
            </linearGradient>
            <linearGradient id={id("edge")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="1" stopColor="#C9B9A4" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d={AFRICA_PATH} fill={`url(#${id("edge")})`} transform="translate(3 5)" />
          <path d={AFRICA_PATH} fill={`url(#${id("plate")})`} />
        </svg>

        <div className="absolute top-[30%] left-[22%] w-[58%]">
          <img src="/brand/ocd-logo.svg" alt="" width={951} height={368} className="sign-3d block h-auto w-full" draggable={false} />
          <span className="sign-live display absolute top-[100%] right-[-2%] mt-[1%] text-[10cqw] leading-none tracking-[-0.045em] text-ink">
            Live
          </span>
        </div>
      </div>

      {/* ── Le voyant du plateau ── */}
      {onAir && (
        <div className="on-air absolute top-[3%] right-[-4%] hidden items-center gap-[0.9cqw] rounded-[0.8cqw] bg-[#1b1512] px-[1.8cqw] py-[1.1cqw] shadow-[0_0.8cqw_1.6cqw_rgb(40_20_5/0.35)] lg:flex">
          <span className="on-air-dot size-[1.5cqw] rounded-full" />
          <span className="text-[2.1cqw] leading-none font-extrabold tracking-[0.12em]">EN DIRECT</span>
        </div>
      )}
    </div>
  );
}
