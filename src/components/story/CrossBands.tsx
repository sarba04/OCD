import { CATEGORIES } from "@/lib/config";

const CITIES = ["Lomé", "Douala", "Abidjan", "Cotonou", "Ouagadougou", "Dakar", "Libreville", "N'Djamena", "Paris", "Bruxelles", "Montréal"];

function Band({ items, className, rev }: { items: readonly string[]; className: string; rev?: boolean }) {
  const row = items.map((c) => (
    <span key={c} className="inline-flex items-center gap-6 pr-6 sm:gap-8 sm:pr-8">
      <span>{c}</span>
      <svg viewBox="0 0 10 10" className="size-3 sm:size-4" aria-hidden>
        <path d="M5 0L6.2 3.8 10 5 6.2 6.2 5 10 3.8 6.2 0 5 3.8 3.8z" fill="currentColor" />
      </svg>
    </span>
  ));
  return (
    <div className={`absolute inset-x-[-5%] flex h-14 items-center overflow-hidden sm:h-[72px] ${className}`}>
      <div className={`cross-track flex w-max items-center whitespace-nowrap ${rev ? "rev" : ""}`}>
        <div className="flex items-center pl-6">{row}</div>
        <div className="flex items-center pl-6">{row}</div>
      </div>
    </div>
  );
}

/** Deux bandes qui se croisent : d'où on peut faire son live, et ce qui s'y vend. */
export function CrossBands() {
  return (
    <section aria-label="Depuis toute l'Afrique et la diaspora, on vend de tout en live" className="relative h-[150px] overflow-hidden bg-paper sm:h-[200px]">
      <p className="sr-only">
        Villes : {CITIES.join(", ")}. Catégories : {CATEGORIES.join(", ")}.
      </p>
      <div aria-hidden>
        <Band items={CATEGORIES.filter((c) => c !== "Autre")} rev className="top-[46px] rotate-[2.5deg] bg-ink text-[17px] font-semibold text-paper sm:top-[64px] sm:text-[20px]" />
        <Band items={CITIES} className="top-[46px] -rotate-[3deg] bg-orange text-[22px] font-extrabold tracking-[-0.02em] text-ink shadow-[0_18px_40px_-20px_rgb(241_105_3/0.8)] sm:top-[64px] sm:text-[30px]" />
      </div>
    </section>
  );
}
