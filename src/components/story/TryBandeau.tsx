/* eslint-disable @next/next/no-img-element */
"use client";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { LowerThird } from "@/components/flow/LivePreview";
import { inputClass } from "@/components/ui/kit";

/**
 * « Essaie ton bandeau » : le visiteur tape le nom de sa boutique et le voit tout de suite à l'écran du live.
 * Le bouton garde ces infos pour la réservation et remonte au choix du lieu.
 */
export function TryBandeau({ onKeep }: { onKeep: (name: string, pitch: string) => void }) {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const shown = {
    name: name || "Afi Wax Couture",
    pitch: pitch || "Robes et ensembles en wax cousus main",
    phone: "+228 90 •• •• ••",
    address: "Ton quartier, ta ville",
    delivers: true,
    priceHint: "",
    photo: null,
  };
  return (
    <section aria-labelledby="essai-titre" className="bg-paper-2">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-20">
        <div>
          <h2 id="essai-titre" className="display text-[clamp(40px,7vw,80px)]">
            Essaie ton bandeau.
          </h2>
          <p className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
            C&apos;est ce que tout le public verra pendant 1h30. Tape le nom de ta boutique : il passe à l&apos;écran.
          </p>
          <div className="mt-8 grid max-w-[460px] gap-3">
            <label className="edge chamfer-sm block [--edge:var(--color-line-2)] [--surface:var(--color-card)] focus-within:[--edge-w:2px] focus-within:[--edge:var(--color-orange)]">
              <span className="sr-only">Nom de ta boutique</span>
              <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Nom de ta boutique" className={inputClass} />
            </label>
            <label className="edge chamfer-sm block [--edge:var(--color-line-2)] [--surface:var(--color-card)] focus-within:[--edge-w:2px] focus-within:[--edge:var(--color-orange)]">
              <span className="sr-only">Ce que tu vends</span>
              <input value={pitch} maxLength={90} onChange={(e) => setPitch(e.target.value)} placeholder="Ce que tu vends, en une phrase" className={inputClass} />
            </label>
            <button
              type="button"
              onClick={() => onKeep(name.trim(), pitch.trim())}
              className="btn-sheen group relative mt-2 inline-flex h-14 items-center justify-center gap-2 overflow-hidden px-6 text-[17px] font-bold text-ink"
            >
              <span aria-hidden className="chamfer-sm absolute inset-0 bg-orange transition-colors group-hover:bg-[#ff7714]" />
              <span className="relative">{name.trim() ? "Réserver avec ce bandeau" : "Réserver mon live"}</span>
              <ArrowUp className="relative size-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </div>

        {/* l'écran du live, en direct pendant que tu tapes */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="chamfer-lg relative aspect-[4/5] overflow-hidden bg-ink shadow-[0_40px_80px_-40px_rgb(22_18_14/0.6)]">
            <img
              src="/media/studio-night-640.webp"
              srcSet="/media/studio-night-640.webp 640w, /media/studio-night-1200.webp 1200w"
              sizes="420px"
              width={1200}
              height={1313}
              loading="lazy"
              alt="Le studio OCD Live, prêt pour ton live"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-[4px] bg-live px-2 py-1 text-[11px] font-extrabold tracking-wide text-white">
              <span className="size-1.5 rounded-full bg-white" aria-hidden /> LIVE
            </span>
            <div className="absolute inset-x-4 bottom-5" aria-live="polite">
              <LowerThird key={shown.name.length > 0 ? "on" : "off"} d={shown} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
