/* eslint-disable @next/next/no-img-element */
"use client";
import { useScrollProgress } from "@/components/story/useScrollProgress";

/** « Tout se vend en live » : la photo des produits s'ouvre jusqu'aux bords de l'écran au défilement. */
export function SellAnything() {
  const { ref } = useScrollProgress<HTMLElement>();
  return (
    <section ref={ref} aria-labelledby="tout-titre" className="bg-paper pb-20 sm:pb-28">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <h2 id="tout-titre" className="display text-[clamp(44px,9vw,104px)]">
          Tout se vend en live.
        </h2>
        <p className="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          Pagnes, perruques, jus naturels, téléphones, karité, artisanat. Si ça se montre, ça se vend.
        </p>
      </div>
      <div className="mt-12 overflow-hidden sm:mt-16">
        <div className="zoom-frame relative mx-auto aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src="/media/products-1400.webp"
            srcSet="/media/products-760.webp 760w, /media/products-1400.webp 1400w"
            sizes="100vw"
            width={1400}
            height={933}
            loading="lazy"
            decoding="async"
            alt="Pagnes wax, perruques, jus de bissap et de gingembre, téléphones, beurre de karité, savon noir et paniers tressés"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
