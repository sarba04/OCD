"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Avancement du défilement d'une section, de 0 à 1, écrit dans la variable CSS --p
 * (aucun rendu React à chaque image). `sticky` : la section est plus haute que l'écran et
 * son contenu reste collé ; sinon : de l'entrée de la section en bas de l'écran à son milieu.
 * `steps` renvoie aussi l'étape courante (rendu seulement quand elle change).
 */
export function useScrollProgress<T extends HTMLElement>({ sticky = false, steps = 0 }: { sticky?: boolean; steps?: number } = {}) {
  const ref = useRef<T>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = -1;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = sticky ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh * 0.55 + r.height * 0.55);
      const c = Math.min(1, Math.max(0, p));
      el.style.setProperty("--p", c.toFixed(4));
      if (steps) {
        const s = Math.min(steps - 1, Math.floor(c * steps));
        if (s !== last) setStep((last = s));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sticky, steps]);
  return { ref, step };
}
