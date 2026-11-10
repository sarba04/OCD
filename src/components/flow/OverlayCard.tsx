/* eslint-disable @next/next/no-img-element */
import { MapPin, MessageCircle, Truck } from "lucide-react";
import { initials } from "@/lib/format";

/**
 * L'incrustation pendant le live : une carte flottante (et non une bande), dans le style de la Carte OCD.
 * Le produit, le nom, et le WhatsApp en très grand ; l'adresse et la livraison alternent en dessous.
 */
export function OverlayCard({
  d,
}: {
  d: { name: string; pitch: string; phone: string; address: string; delivers: boolean; priceHint: string; photo: string | null };
}) {
  return (
    <div className="flex w-full items-stretch gap-3 rounded-[28px] bg-white p-2.5 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]">
      {d.photo ? (
        <img src={d.photo} alt="" className="aspect-square w-[34%] shrink-0 rounded-[20px] object-cover" />
      ) : (
        <span className="card-cover display grid aspect-square w-[34%] shrink-0 place-items-center rounded-[20px] text-[3.4em] tracking-[-0.06em] text-white">
          {initials(d.name)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
        <div>
          <div className="flex items-center gap-2">
            <img src="/brand/ocd-logo.svg" alt="" className="h-[0.8em] w-auto" />
            {d.priceHint && <span className="tabular ml-auto rounded-full bg-orange px-2.5 py-0.5 text-[0.62em] font-bold">{d.priceHint}</span>}
          </div>
          <p className="mt-1.5 truncate text-[1.15em] leading-tight font-extrabold tracking-[-0.02em]">{d.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[0.68em] leading-snug text-ink-2">{d.pitch}</p>
        </div>
        <div>
          <p className="tabular inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[0.95em] font-extrabold text-white">
            <MessageCircle className="size-[0.95em] text-orange" aria-hidden /> {d.phone}
          </p>
          <div className="overlay-swap relative mt-1.5 h-[1.2em] overflow-hidden text-[0.66em] font-semibold text-ink-2">
            <span className="absolute inset-0 flex items-center gap-1.5 truncate">
              <MapPin className="size-[1.1em] shrink-0 text-orange-ink" aria-hidden /> {d.address}
            </span>
            <span className="absolute inset-0 flex items-center gap-1.5">
              <Truck className="size-[1.1em] shrink-0 text-ok" aria-hidden /> {d.delivers ? "Livraison possible" : "Retrait sur place"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
