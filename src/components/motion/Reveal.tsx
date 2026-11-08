"use client";
import { useEffect, useRef } from "react";

/**
 * Apparition au défilement : le bloc (et ses enfants marqués data-r) entre en scène
 * quand il arrive à l'écran. Sans JavaScript ou en mouvement réduit, tout est visible d'emblée.
 */
export function Reveal({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.inview = "";
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} data-reveal="" className={className}>
      {children}
    </Tag>
  );
}
