/* eslint-disable @next/next/no-img-element */
import { Reveal } from "@/components/motion/Reveal";

/** « Tout se vend en live » : les produits des vendeurs, au milieu de l'accueil. */
export function SellAnything() {
  return (
    <section aria-labelledby="tout-titre" className="relative bg-paper">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-24">
        <div data-r style={{ ["--i" as string]: 0 }} className="chamfer-lg overflow-hidden bg-paper-2">
          <img
            src="/media/products-760.webp"
            srcSet="/media/products-760.webp 760w, /media/products-1400.webp 1400w"
            sizes="(min-width: 1024px) 620px, 100vw"
            width={1400}
            height={933}
            loading="lazy"
            decoding="async"
            alt="Pagnes wax, perruques, jus de bissap et de gingembre, téléphones, beurre de karité, savon noir et paniers tressés"
            className="block h-auto w-full"
          />
        </div>
        <div>
          <h2 data-r style={{ ["--i" as string]: 1 }} id="tout-titre" className="display text-[40px] sm:text-[56px]">
            Tout se vend en live.
          </h2>
          <p data-r style={{ ["--i" as string]: 2 }} className="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
            Pagnes, perruques, jus naturels, téléphones, karité, artisanat… Si ça se montre, ça se vend. Et pendant tout ton live, ton numéro et ton
            adresse restent à l&apos;écran.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
