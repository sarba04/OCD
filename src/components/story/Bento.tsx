/* eslint-disable @next/next/no-img-element */
import { AFRICA_PATH, AFRICA_VIEWBOX } from "@/lib/geo/africa";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/** Pourquoi OCD Live : quatre raisons, chacune avec son image, pas une liste à puces. */
export function Bento() {
  return (
    <section aria-labelledby="pourquoi-titre" className="bg-paper">
      <Reveal className="mx-auto max-w-6xl px-5 pt-10 pb-24 sm:px-8 sm:pb-32">
        <h2 data-r style={{ ["--i" as string]: 0 }} id="pourquoi-titre" className="display max-w-[16ch] text-[clamp(40px,7vw,80px)]">
          Tout est prévu pour que tu vendes.
        </h2>
        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          {/* 1h30 */}
          <Card i={1} className="bg-ink text-paper lg:row-span-2">
            <div className="flex flex-1 items-center justify-center py-6">
              <div className="relative size-[200px] sm:size-[240px]">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-orange)" strokeWidth="5" strokeLinecap="round" pathLength={1} className="ring-fill" />
                </svg>
                <span className="absolute inset-0 grid place-content-center text-center">
                  <span className="display tabular text-[64px] sm:text-[76px]">1h30</span>
                  <span className="mt-1 text-[14px] text-night-ink-2">à l&apos;antenne</span>
                </span>
              </div>
            </div>
            <Copy t="Ton numéro reste à l'écran." d="Du début à la fin du live. Même ceux qui arrivent en retard repartent avec ton contact." dark />
          </Card>

          {/* régie */}
          <Card i={2} className="bg-[#e7f5ec]">
            <div className="grid gap-2 py-2 text-[14px]">
              <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 shadow-sm">Mon live est à 18h, je viens à quelle heure ?</p>
              <p className="w-fit max-w-[85%] justify-self-end rounded-2xl rounded-br-md bg-[#25d366] px-3.5 py-2 font-medium text-ink shadow-sm">
                20 minutes avant. On t&apos;installe, tu n&apos;as qu&apos;à vendre.
              </p>
            </div>
            <Copy t="Une régie avec toi." d="L'équipe OCD te répond sur WhatsApp et dirige ton live de la première à la dernière minute." />
          </Card>

          {/* affiche */}
          <Card i={3} className="bg-orange-soft">
            <div className="flex items-end gap-3 py-2">
              <img src="/media/studio-night-640.webp" alt="" width={640} height={700} loading="lazy" className="chamfer-sm h-28 w-20 rotate-[-4deg] object-cover shadow-lg" />
              <img src="/media/live-seller-480.webp" alt="" width={480} height={853} loading="lazy" className="chamfer-sm h-32 w-[72px] rotate-[3deg] object-cover shadow-lg" />
            </div>
            <Copy t="Ton affiche est offerte." d="Elle est prête dès ta réservation. Mets-la en statut WhatsApp et sur TikTok pour faire venir tes clients." />
          </Card>

          {/* distance */}
          <Card i={4} className="bg-card sm:col-span-2 lg:col-span-2">
            <div className="relative mx-auto h-36 w-32 py-2">
              <svg viewBox={`0 0 ${AFRICA_VIEWBOX.width} ${AFRICA_VIEWBOX.height}`} className="h-full w-full">
                <path d={AFRICA_PATH} fill="var(--color-paper-2)" stroke="var(--color-line-2)" strokeWidth="3" />
              </svg>
              {[
                [26, 46],
                [32, 52],
                [18, 44],
                [40, 50],
                [12, 38],
              ].map(([x, y], k) => (
                <span key={k} className="absolute size-2.5 rounded-full bg-orange ring-4 ring-orange/20" style={{ left: `${x}%`, top: `${y}%` }} />
              ))}
            </div>
            <Copy t="Depuis toute l'Afrique." d="Pas à Lomé ? Fais ton live depuis ta boutique, une animatrice OCD te prend en duplex." />
          </Card>
        </div>
      </Reveal>
    </section>
  );
}

function Card({ children, className, i }: { children: React.ReactNode; className?: string; i: number }) {
  return (
    <div data-r style={{ ["--i" as string]: i }} className={cn("chamfer-lg flex flex-col gap-4 p-6 sm:p-7", className)}>
      {children}
    </div>
  );
}

function Copy({ t, d, dark }: { t: string; d: string; dark?: boolean }) {
  return (
    <div className="mt-auto">
      <h3 className="text-[21px] leading-tight font-bold tracking-[-0.015em]">{t}</h3>
      <p className={cn("mt-1.5 text-[15px] leading-relaxed", dark ? "text-night-ink-2" : "text-ink-2")}>{d}</p>
    </div>
  );
}
