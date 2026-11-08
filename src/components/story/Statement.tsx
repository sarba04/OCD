"use client";
import { BRAND } from "@/lib/config";
import { useScrollProgress } from "./useScrollProgress";

const TEXT = `Le marketing avant la vente. Un créneau, une régie, et toute l'audience de ${BRAND.liveAccount} devant ton business. Pendant 1h30, ton numéro reste à l'écran.`;

/** Une phrase qui s'écrit au fil du défilement : chaque mot passe du gris à l'encre. */
export function Statement() {
  const { ref } = useScrollProgress<HTMLElement>();
  const words = TEXT.split(" ");
  return (
    <section ref={ref} aria-label="Le principe" className="bg-paper">
      <p className="display mx-auto max-w-5xl px-5 py-28 text-[clamp(32px,6.4vw,76px)] leading-[1.02] sm:px-8 sm:py-40">
        <span className="sr-only">{TEXT}</span>
        <span aria-hidden>
          {words.map((w, i) => (
            <span key={i} className="word" style={{ ["--i" as string]: i, ["--n" as string]: words.length }}>
              {w}{" "}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}
