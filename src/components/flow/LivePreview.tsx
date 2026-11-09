/* eslint-disable @next/next/no-img-element */
import { Heart, MapPin, MessageCircle, Truck, Users } from "lucide-react";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/cn";

export interface PreviewData {
  name: string;
  pitch: string;
  phone: string;
  address: string;
  delivers: boolean;
  priceHint: string;
  photo: string | null;
}

/** Le bandeau tel que la régie l'affichera à l'écran pendant le live. */
export function LowerThird({ d, className }: { d: PreviewData; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="chamfer-sm bg-orange px-3 pt-2 pb-2.5 text-ink">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] leading-tight font-extrabold tracking-[-0.01em]">{d.name || "Le nom de ta boutique"}</p>
          {d.priceHint && <p className="tabular shrink-0 text-[11px] font-bold">{d.priceHint}</p>}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug font-medium text-ink/85">{d.pitch || "Ce que tu vas présenter, en une phrase."}</p>
      </div>
      <div className="-mt-px flex flex-wrap items-center gap-x-3 gap-y-1 bg-ink px-3 py-1.5 text-[11.5px] font-semibold text-paper">
        <span className="tabular inline-flex items-center gap-1">
          <MessageCircle className="size-3.5 text-orange" aria-hidden />
          {d.phone || "+228 •• •• •• ••"}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0 text-orange" aria-hidden />
          <span className="truncate">{d.address || "Ton quartier, ta ville"}</span>
        </span>
        {d.delivers && (
          <span className="inline-flex items-center gap-1">
            <Truck className="size-3.5 text-orange" aria-hidden /> Livraison
          </span>
        )}
      </div>
    </div>
  );
}

/** Le téléphone d'un spectateur : on voit son live comme ses clients le verront. */
export function PhonePreview({ d }: { d: PreviewData }) {
  return (
    <div className="relative mx-auto aspect-[9/17] w-full max-w-[300px] rounded-[34px] bg-ink p-2.5 shadow-[0_30px_60px_-30px_rgb(22_18_14/0.6)]">
      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#2a1d12]">
        {d.photo ? (
          <img src={d.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            {/* la lumière du studio, floutée comme une vraie image de live */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_30%,#f6e3c8_0%,#d9a46b_45%,#4a2c14_100%)]" />
            <img src="/brand/ocd-logo.svg" alt="" className="absolute top-[30%] left-1/2 w-[42%] -translate-x-1/2" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

        {/* barre du haut */}
        <div className="absolute inset-x-3 top-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-white">
            <img src="/brand/ocd-logo.svg" alt="" className="w-6" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] leading-tight font-semibold text-white">
            {BRAND.liveAccount}
            <span className="block text-[10px] font-normal text-white/75">avec {d.name || "toi"}</span>
          </span>
          <span className="rounded-[4px] bg-live px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">LIVE</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Users className="size-3" aria-hidden /> 1,2k
          </span>
        </div>

        {/* commentaires */}
        <div className="absolute right-12 bottom-[31%] left-3 grid gap-1.5 text-[10.5px] leading-snug text-white">
          <p><b className="font-semibold text-white/70">kafui.tg</b> c&apos;est combien ?</p>
          <p><b className="font-semibold text-white/70">mamie_237</b> vous livrez à Douala ?</p>
          <p><b className="font-semibold text-white/70">sena_b</b> je prends 2 🔥</p>
        </div>
        <Heart className="absolute right-3 bottom-[33%] size-6 fill-live text-live" aria-hidden />

        {/* le bandeau */}
        <div className="absolute inset-x-3 bottom-4">
          <LowerThird d={d} />
        </div>
      </div>
    </div>
  );
}
