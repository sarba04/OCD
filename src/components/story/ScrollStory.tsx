/* eslint-disable @next/next/no-img-element */
"use client";
import { Heart, Users } from "lucide-react";
import { BRAND } from "@/lib/config";
import { LowerThird, type PreviewData } from "@/components/flow/LivePreview";
import { cn } from "@/lib/cn";
import { useScrollProgress } from "./useScrollProgress";

const AFI: PreviewData = {
  name: "Afi Wax Couture",
  pitch: "Robes et ensembles en wax cousus main, du 36 au 52",
  phone: "+228 90 •• •• 41",
  address: "Bè-Kpota, Lomé",
  delivers: true,
  priceHint: "dès 8 000 F",
  photo: null,
};

const CHAPTERS = [
  { t: "Tu entres en scène.", d: "Au studio à Lomé, ou depuis ta boutique avec une animatrice OCD. La lumière est prête, la caméra aussi." },
  { t: "Ton nom s'affiche.", d: "La régie pose ton bandeau à l'écran : ton produit, ton prix, ton WhatsApp, ton adresse." },
  { t: "Le public réagit.", d: `Toute l'audience de ${BRAND.liveAccount} te regarde. Les questions tombent, l'animatrice répond avec toi.` },
  { t: "Les clients t'écrivent.", d: "Ton numéro reste à l'écran pendant 1h30. Même ceux qui arrivent en retard repartent avec ton contact." },
];

const COMMENTS: [string, string][] = [
  ["kafui.tg", "elle existe en bleu ?"],
  ["mamie_237", "vous livrez à Kara ?"],
  ["sena_b", "je prends la rouge 🔥"],
];

/** L'histoire d'un live, racontée au défilement : le téléphone reste au centre, l'écran avance chapitre par chapitre. */
export function ScrollStory() {
  const { ref, step } = useScrollProgress<HTMLElement>({ sticky: true, steps: CHAPTERS.length });
  const viewers = ["412", "1,2k", "2,8k", "3,4k"][step];
  return (
    <section ref={ref} aria-labelledby="story-titre" className="story relative bg-night text-night-ink" style={{ height: `${CHAPTERS.length * 90 + 40}vh` }}>
      <h2 id="story-titre" className="sr-only">
        Comment se passe ton live
      </h2>
      <div className="grain-anim sticky top-0 flex h-dvh items-center overflow-hidden">
        <span aria-hidden className="letterbox top-0" />
        <span aria-hidden className="letterbox bottom-0" />
        {/* la lumière du plateau */}
        <div aria-hidden className="absolute top-1/2 left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(241_105_3/0.28),transparent)] lg:left-[68%]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* le texte du chapitre */}
          <div className="relative order-2 min-h-[180px] lg:order-1 lg:min-h-[320px]">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.t}
                aria-hidden={i !== step}
                className={cn(
                  "absolute inset-x-0 top-0 transition-[opacity,transform,filter] duration-700 ease-[var(--ease-out)]",
                  i === step ? "opacity-100 blur-0" : i < step ? "-translate-y-6 opacity-0 blur-sm" : "translate-y-6 opacity-0 blur-sm",
                )}
              >
                <p className="tabular hidden text-[15px] font-semibold text-night-orange sm:block">
                  {i + 1} / {CHAPTERS.length}
                </p>
                <h3 className="display text-[clamp(34px,9vw,60px)] sm:mt-3 lg:text-[72px]">{c.t}</h3>
                <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed sm:mt-4 text-night-ink-2 sm:text-[19px]">{c.d}</p>
              </div>
            ))}
          </div>

          {/* le téléphone */}
          {/* sur mobile, le téléphone garde ses proportions et est réduit d'un bloc (rien ne se tasse) */}
          <div className="story-phone relative order-1 mx-auto h-[411px] w-[200px] sm:h-auto sm:w-[280px] lg:order-2 lg:w-[320px] [@media(max-height:700px)_and_(max-width:639px)]:h-[360px] [@media(max-height:700px)_and_(max-width:639px)]:w-[175px]">
            <div className="absolute top-0 left-0 w-[280px] origin-top-left scale-[0.7143] sm:relative sm:w-full sm:scale-100 [@media(max-height:700px)_and_(max-width:639px)]:scale-[0.625]">
            <div className="relative aspect-[9/18.5] rounded-[42px] bg-[#050403] p-2.5 shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1.5px_rgb(255_255_255/0.1)]">
              <div className="relative h-full w-full overflow-hidden rounded-[33px] bg-[#e9e4dd]">
                <img
                  src="/media/live-seller-480.webp"
                  srcSet="/media/live-seller-480.webp 480w, /media/live-seller-720.webp 720w"
                  sizes="320px"
                  width={720}
                  height={1280}
                  loading="lazy"
                  decoding="async"
                  alt="Une vendeuse présente une robe en wax en direct depuis le studio OCD Live"
                  className="story-cam absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-45% to-black/70" />

                <div className="absolute inset-x-3 top-3 flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-white">
                    <img src="/brand/ocd-logo.svg" alt="" className="w-6" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] leading-tight font-semibold text-white">
                    {BRAND.liveAccount}
                    <span className="block truncate text-[10px] font-normal text-white/75">avec {AFI.name}</span>
                  </span>
                  <span className="rounded-[4px] bg-live px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">LIVE</span>
                  <span className="tabular inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Users className="size-3" aria-hidden /> <span key={viewers} className="tick-in">{viewers}</span>
                  </span>
                </div>

                {/* 4 : le message WhatsApp qui arrive */}
                <div
                  className={cn(
                    "absolute inset-x-2.5 top-14 rounded-2xl bg-white/95 p-2.5 text-ink shadow-[0_12px_30px_-10px_rgb(0_0_0/0.6)] backdrop-blur transition-[opacity,transform] duration-500 ease-[var(--ease-spring)]",
                    step >= 3 ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0",
                  )}
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-3">
                    <span className="grid size-4 place-items-center rounded-[5px] bg-[#25d366] text-[9px] text-white">✓</span> WhatsApp · maintenant
                  </p>
                  <p className="mt-1 text-[12px] leading-snug">
                    <b>Kafui</b> : Bonjour, je vous ai vue en live ! La robe rouge en 42, vous livrez à Bè ?
                  </p>
                </div>

                {/* 3 : commentaires et cœurs */}
                <div className={cn("absolute right-12 bottom-[34%] left-3 grid gap-1.5 text-[10.5px] leading-snug text-white transition-opacity duration-500", step >= 2 ? "opacity-100" : "opacity-0")}>
                  {COMMENTS.map(([u, t], k) => (
                    <p
                      key={u}
                      className={cn("w-fit max-w-full rounded-full bg-black/35 px-2 py-0.5 transition-[opacity,transform] duration-500", step >= 2 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
                      style={{ transitionDelay: step >= 2 ? `${k * 160}ms` : "0ms" }}
                    >
                      <b className="font-semibold text-white/70">{u}</b> {t}
                    </p>
                  ))}
                </div>
                {step >= 2 && (
                  <div className="absolute right-3 bottom-[31%] h-40 w-8 motion-reduce:hidden" aria-hidden>
                    {[0, 1, 2, 3, 4].map((k) => (
                      <Heart
                        key={k}
                        className="absolute bottom-0 left-1 size-5 fill-live text-live"
                        style={{ animation: `float-up 2.6s var(--ease-out) ${k * 0.5}s infinite`, ["--dx" as string]: `${(k % 2 ? -1 : 1) * (6 + k * 3)}px` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}

                {/* 2 : le bandeau */}
                <div
                  className={cn(
                    "absolute inset-x-3 bottom-5 transition-[opacity,transform] duration-700 ease-[var(--ease-out)]",
                    step >= 1 ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0",
                    step >= 3 && "lt-glow",
                  )}
                >
                  <LowerThird d={AFI} />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* avancement */}
        <div aria-hidden className="absolute inset-x-5 bottom-6 mx-auto h-[3px] max-w-6xl overflow-hidden rounded-full bg-white/10 sm:inset-x-8">
          <div className="h-full origin-left bg-orange" style={{ transform: "scaleX(var(--p, 0))" }} />
        </div>
      </div>
    </section>
  );
}
