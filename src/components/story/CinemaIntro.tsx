/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect } from "react";
import { AFRICA_PATH, AFRICA_VIEWBOX } from "@/lib/geo/africa";

/**
 * Le chargement : le studio est dans le noir. La bande LED fait le tour de la plaque Afrique,
 * le mur s'éclaire, l'enseigne OCD s'allume en vacillant, puis on entre dans le studio
 * (l'écran s'ouvre sur le vrai mur de l'accueil). Une fois par visite ; jamais en mouvement réduit.
 */
export function CinemaIntro() {
  useEffect(() => {
    try {
      sessionStorage.setItem("ocd-intro", "1");
    } catch {
      /* stockage indisponible : le chargement rejouera, sans gravité */
    }
  }, []);
  const { width: W, height: H } = AFRICA_VIEWBOX;
  return (
    <div aria-hidden className="cine-intro">
      <div className="studio-dark">
        <div className="studio-plate" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`-40 -40 ${W + 80} ${H + 80}`} className="absolute -inset-[5%] h-[110%] w-[110%] overflow-visible">
            <defs>
              <filter id="led-bloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="40" />
              </filter>
            </defs>
            <path d={AFRICA_PATH} fill="#ff8a1f" filter="url(#led-bloom)" className="led-bloom" />
            <path d={AFRICA_PATH} fill="#f4efe8" className="led-plate" />
            <path d={AFRICA_PATH} pathLength={1} fill="none" className="led-strip" />
          </svg>
          <div className="led-sign absolute top-[30%] left-[22%] w-[58%]">
            <img src="/brand/ocd-logo.svg" alt="" width={951} height={368} className="block h-auto w-full" />
            <span className="display absolute top-full right-[-2%] mt-[1%] text-[min(9vw,44px)] leading-none tracking-[-0.045em] text-ink">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
