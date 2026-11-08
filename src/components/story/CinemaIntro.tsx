"use client";
import { useEffect } from "react";
import { LOGO_PATH, LOGO_VIEWBOX } from "@/lib/brand/logoPath";

/**
 * Le chargement : un écran orange OCD, le logo se dessine trait par trait puis se remplit,
 * « Live » apparaît, et l'écran se lève comme un rideau sur le studio.
 * Une seule fois par visite ; jamais sans JavaScript ni en mouvement réduit (voir le CSS).
 */
export function CinemaIntro() {
  useEffect(() => {
    try {
      sessionStorage.setItem("ocd-intro", "1");
    } catch {
      /* stockage indisponible : le chargement rejouera, sans gravité */
    }
  }, []);
  return (
    <div aria-hidden className="cine-intro">
      <div className="loader-panel">
        <div className="loader-mark">
          <svg viewBox={LOGO_VIEWBOX} className="block w-full overflow-visible">
            <path d={LOGO_PATH} pathLength={1} fillRule="evenodd" className="loader-path" />
          </svg>
          <span className="loader-live display">Live</span>
        </div>
        <p className="loader-sub">Studio de lives · Lomé</p>
      </div>
    </div>
  );
}
