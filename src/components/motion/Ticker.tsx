import { CATEGORIES } from "@/lib/config";

/** Bandeau défilant façon chaîne d'info : tout se vend en live. */
export function Ticker() {
  const items = CATEGORIES.filter((c) => c !== "Autre");
  const row = (
    <>
      {items.map((c) => (
        <span key={c} className="inline-flex items-center gap-6 pr-6">
          <span>{c}</span>
          <span aria-hidden className="inline-block size-[7px] rotate-45 bg-orange" />
        </span>
      ))}
    </>
  );
  return (
    <div className="relative flex h-12 items-stretch overflow-hidden border-y border-black bg-ink text-paper sm:h-14" role="region" aria-label="Ce qui se vend en live : toutes les catégories">
      <span className="relative z-10 inline-flex shrink-0 items-center gap-2 bg-live px-4 text-[13px] font-extrabold tracking-[0.1em] text-white sm:px-5 sm:text-[14px]">
        <span className="size-2 rounded-full bg-white motion-safe:animate-pulse" aria-hidden />
        EN DIRECT
      </span>
      <span className="relative z-10 hidden shrink-0 items-center bg-orange px-4 text-[14px] font-bold text-ink sm:inline-flex">Tout se vend en live</span>
      <div className="ticker-mask relative flex min-w-0 flex-1 items-center">
        <div className="ticker-track flex w-max items-center text-[15px] font-semibold whitespace-nowrap sm:text-[17px]" aria-hidden>
          <div className="flex items-center pl-6">{row}</div>
          <div className="flex items-center pl-6">{row}</div>
        </div>
        <span className="sr-only">{items.join(", ")}</span>
      </div>
    </div>
  );
}
