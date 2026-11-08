"use client";
import { useEffect } from "react";

/**
 * L'ouverture, comme au cinéma : l'écran est noir, un trait de lumière orange s'allume au centre,
 * puis les deux bandes noires s'ouvrent sur le studio. Une seule fois par visite ;
 * jamais sans JavaScript, jamais en mouvement réduit (voir le CSS), et sans bloquer les clics.
 */
export function CinemaIntro() {
  useEffect(() => {
    try {
      sessionStorage.setItem("ocd-intro", "1");
    } catch {
      /* stockage indisponible : l'ouverture rejouera, sans gravité */
    }
  }, []);
  return (
    <div aria-hidden className="cine-intro">
      <span className="cine-bar cine-top" />
      <span className="cine-bar cine-bottom" />
      <span className="cine-beam" />
    </div>
  );
}
