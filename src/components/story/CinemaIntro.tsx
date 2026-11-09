/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect } from "react";

/**
 * Le chargement : comme quand on lance un live, un compte à rebours 3, 2, 1… puis le point rouge
 * « EN DIRECT » et le logo, et l'écran s'ouvre depuis ce point. Une fois par visite ; jamais en mouvement réduit.
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
      <div className="cd-stage">
        <span className="cd-n cd-3">3</span>
        <span className="cd-n cd-2">2</span>
        <span className="cd-n cd-1">1</span>
        <span className="cd-live">
          <img src="/brand/ocd-logo.svg" alt="" width={951} height={368} className="h-[44px] w-auto" />
          <span className="cd-pill">
            <span className="cd-dot" /> EN DIRECT
          </span>
        </span>
      </div>
    </div>
  );
}
