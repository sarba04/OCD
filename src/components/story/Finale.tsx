"use client";
import { StudioWall } from "@/components/brand/StudioWall";
import { Reveal } from "@/components/motion/Reveal";

/** Le dernier écran : le mur se rallume, une seule action. */
export function Finale() {
  return (
    <section aria-labelledby="finale-titre" className="wall relative overflow-hidden">
      <Reveal className="mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
        <div data-r style={{ ["--i" as string]: 0 }} className="w-[min(70vw,340px)]">
          <StudioWall animate={false} />
        </div>
        <h2 data-r style={{ ["--i" as string]: 1 }} id="finale-titre" className="display mt-10 text-[clamp(44px,9vw,96px)]">
          Ton live t&apos;attend.
        </h2>
        <p data-r style={{ ["--i" as string]: 2 }} className="mt-5 max-w-[38ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          Décembre ouvre le 1er. Les meilleures heures partent en premier.
        </p>
        <a
          data-r
          style={{ ["--i" as string]: 3 }}
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            setTimeout(() => document.getElementById("choix-studio")?.focus({ preventScroll: true }), 600);
          }}
          className="btn-sheen group relative mt-10 inline-flex h-14 items-center overflow-hidden px-8 text-[17px] font-bold text-ink"
        >
          <span aria-hidden className="chamfer-sm absolute inset-0 bg-orange transition-colors group-hover:bg-[#ff7714]" />
          <span className="relative">Réserver mon live</span>
        </a>
      </Reveal>
    </section>
  );
}
