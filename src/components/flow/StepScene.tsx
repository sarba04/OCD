/* eslint-disable @next/next/no-img-element */
"use client";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BRAND, PACKS, SCHEDULE } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { addDays, formatDay, freeSlotCount } from "@/lib/schedule";
import type { Mode } from "@/lib/types";
import { haptic } from "@/components/ui/kit";
import { Countdown, Timecode, VuMeter } from "@/components/broadcast/Timecode";
import { DayTrack, GuideHours } from "@/components/broadcast/ProgramGuide";
import { Reveal } from "@/components/motion/Reveal";
import type { Availability } from "./BookingApp";
import { LiveDemo } from "./LiveDemo";
import { Ticker } from "@/components/motion/Ticker";
import { SellAnything } from "./SellAnything";

const MIN_PRICE = Math.min(...PACKS.map((p) => p.price));

const CAMS: { mode: Mode; n: string; src: string; srcSet: string; w: number; h: number; pos: string; alt: string; umd: string; title: string; text: string }[] = [
  {
    mode: "studio",
    n: "CAM 1",
    src: "/media/live-seller-720.webp",
    srcSet: "/media/live-seller-480.webp 480w, /media/live-seller-720.webp 720w",
    w: 720,
    h: 1280,
    pos: "object-[50%_28%]",
    alt: "Une vendeuse présente une robe en wax en direct, au studio OCD Live",
    umd: "Studio · Lomé",
    title: "Au studio, à Lomé",
    text: "Tu viens avec tes produits. Lumière, caméra, régie : tout est prêt.",
  },
  {
    mode: "remote",
    n: "CAM 2",
    src: "/media/animatrice-760.webp",
    srcSet: "/media/animatrice-760.webp 760w, /media/animatrice-1400.webp 1400w",
    w: 1400,
    h: 933,
    pos: "object-[40%_40%]",
    alt: "Une animatrice OCD, casque sur la tête, dirige un live avec un vendeur à distance",
    umd: "Duplex · Afrique & monde",
    title: "À distance",
    text: "Depuis ta boutique, où que tu sois. Une animatrice OCD te prend en duplex.",
  },
];

export function StepScene({
  avail,
  selected,
  preset,
  onPick,
  onPreset,
}: {
  avail: Availability | null;
  selected: Mode | null;
  preset: { day: string; time: string } | null;
  onPick: (m: Mode) => void;
  onPreset: (day: string, time: string) => void;
}) {
  const [hover, setHover] = useState<Mode | null>(null);
  const [flash, setFlash] = useState(0);
  const free = useMemo(() => (avail ? freeSlotCount(avail.busy, new Date(avail.now)) : null), [avail]);

  const take = (m: Mode) => {
    haptic(14);
    setFlash((f) => f + 1);
    onPick(m);
  };

  return (
    <div className="relative overflow-x-clip">
      {flash > 0 && <div key={flash} className="cut-flash" aria-hidden />}

      {/* ───── La régie ───── */}
      <section className="deck relative">
        <header role="banner" className="relative z-20 border-b border-deck-line">
          <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:h-16 sm:px-8">
            <Logo size={22} onDark className="[view-transition-name:ocd-logo]" />
            <span className="mono-label hidden text-night-ink-2 md:inline">Canal 01 · {BRAND.liveAccount}</span>
            <span className="ml-auto flex items-center gap-2.5">
              <span className="mono-label hidden text-night-ink-2 sm:inline">TC</span>
              <Timecode className="mono text-[13px] font-semibold text-night-ink sm:text-[15px]" />
              <VuMeter className="hidden sm:inline-flex" />
            </span>
            <a href="#conducteur" className="mono-label hidden h-11 items-center border-l border-deck-line pl-4 text-night-ink hover:text-night-orange lg:inline-flex">
              Comment ça marche
            </a>
          </div>
        </header>

        <main className="relative mx-auto max-w-[1320px] px-4 pt-7 pb-10 sm:px-8 sm:pt-12 lg:pb-16">
          <p className="fade-up mono-label flex flex-wrap items-center gap-x-3 gap-y-2 text-night-ink-2" style={{ ["--d" as string]: 80 }}>
            <span className="inline-flex items-center gap-2 bg-tally px-2 py-1 text-white">
              <span className="tally tally-on [--t:#fff] !shadow-none" /> Rec
            </span>
            <span>Première diffusion le 1er décembre</span>
            <Countdown className="text-night-orange" />
          </p>

          <div className="mt-4 grid gap-5 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end lg:gap-10">
            <h1 className="tv text-[clamp(58px,16vw,96px)] leading-[0.98] text-night-ink sm:text-[clamp(90px,10vw,150px)]">
              <span className="block">
                <span className="wipe-in" style={{ ["--d" as string]: 120 }}>
                  Ton business
                </span>
              </span>
              <span className="block text-orange">
                <span className="wipe-in" style={{ ["--d" as string]: 300 }}>
                  à l&apos;antenne.
                </span>
              </span>
            </h1>
            <div className="lg:pb-3">
              <p className="fade-up max-w-[52ch] text-[15.5px] leading-relaxed text-night-ink-2 sm:text-[18px]" style={{ ["--d" as string]: 650 }}>
                OCD Live, c&apos;est une chaîne. Tu réserves ta case, la régie te met à l&apos;antenne sur {BRAND.liveAccount}
                <span className="hidden sm:inline">, et ton numéro reste à l&apos;écran pendant 1h30</span>. <span className="text-night-ink">Le marketing avant la vente.</span>
              </p>
              <dl className="fade-up mono mt-4 grid sm:mt-5 grid-cols-3 border border-deck-line text-night-ink" style={{ ["--d" as string]: 760 }}>
                <Stat k="Durée" v="1h30" />
                <Stat k="Dès" v={fcfa(MIN_PRICE).replace(" FCFA", " F")} />
                <Stat k="Cases libres" v={free === null ? "···" : String(free)} />
              </dl>
            </div>
          </div>

          {/* ───── Le sélecteur de sources ───── */}
          <div className="mt-8 flex items-end justify-between gap-4 border-b border-deck-line pb-3 sm:mt-12">
            <h2 className="tv text-[30px] text-night-ink sm:text-[40px]">Où veux-tu faire ton live&nbsp;?</h2>
            <span className="mono-label hidden pb-1 text-night-ink-2 sm:inline">Choisis ta caméra</span>
          </div>
          {preset && (
            <p role="status" className="mono mt-3 inline-flex items-center gap-2 bg-orange px-3 py-1.5 text-[13px] font-semibold text-ink">
              Case retenue : {formatDay(preset.day, "short")} à {preset.time}. Choisis ta caméra.
            </p>
          )}
          <div className="hero-cards mt-4 grid grid-cols-2 gap-2.5 sm:gap-5">
            {CAMS.map((c) => (
              <Cam
                key={c.mode}
                cam={c}
                id={c.mode === "studio" ? "choix-studio" : undefined}
                tally={selected === c.mode ? "pgm" : hover === c.mode ? "pvw" : undefined}
                onHover={(h) => setHover(h ? c.mode : null)}
                onTake={() => take(c.mode)}
              />
            ))}
          </div>
        </main>
      </section>

      <Ticker />
      <Guide avail={avail} preset={preset} onPreset={onPreset} />
      <SellAnything />
      <LiveDemo />
      <Footer />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-r border-deck-line px-3 py-2 last:border-r-0 sm:px-4 sm:py-2.5">
      <dt className="mono-label text-[9.5px] text-night-ink-2">{k}</dt>
      <dd className="mt-1.5 text-[15px] font-bold tabular-nums sm:text-[20px]">{v}</dd>
    </div>
  );
}

function Cam({
  cam: c,
  id,
  tally,
  onHover,
  onTake,
}: {
  cam: (typeof CAMS)[number];
  id?: string;
  tally?: "pvw" | "pgm";
  onHover: (h: boolean) => void;
  onTake: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      data-tally={tally}
      onClick={(e) => {
        e.currentTarget.style.setProperty("view-transition-name", "dock");
        onTake();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className="cam group flex h-full w-full flex-col bg-deck-2 p-1.5 text-left ring-1 ring-deck-line transition-transform duration-200 active:scale-[0.99] sm:p-2.5"
    >
      <span className="flex items-center gap-2 px-1 pb-1.5 sm:pb-2">
        <span className="tally" aria-hidden />
        <span className="mono-label text-[10px] text-night-ink sm:text-[11px]">{c.n}</span>
        <span className="mono-label ml-auto hidden text-night-ink-2 sm:inline">{tally === "pgm" ? "PGM" : tally === "pvw" ? "PVW" : "Prêt"}</span>
      </span>
      <span className="monitor block aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
        <img
          src={c.src}
          srcSet={c.srcSet}
          sizes="(min-width: 640px) 50vw, 100vw"
          width={c.w}
          height={c.h}
          alt={c.alt}
          decoding="async"
          fetchPriority={c.mode === "studio" ? "high" : undefined}
          className={`absolute inset-0 h-full w-full object-cover ${c.pos}`}
        />
        <span aria-hidden className="scanlines absolute inset-0" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        {/* repères de cadrage */}
        <span aria-hidden className="absolute top-2 left-2 size-3 sm:top-3 sm:left-3 sm:size-4 border-t-2 border-l-2 border-white/60" />
        <span aria-hidden className="absolute top-2 right-2 size-3 sm:top-3 sm:right-3 sm:size-4 border-t-2 border-r-2 border-white/60" />
        <span aria-hidden className="absolute bottom-2 left-2 size-3 sm:bottom-3 sm:left-3 sm:size-4 border-b-2 border-l-2 border-white/60" />
        <span aria-hidden className="absolute right-2 bottom-2 size-3 sm:right-3 sm:bottom-3 sm:size-4 border-r-2 border-b-2 border-white/60" />
        <span className="mono-label absolute bottom-4 left-1/2 hidden -translate-x-1/2 bg-black/75 px-2.5 py-1.5 whitespace-nowrap text-white sm:block">{c.umd}</span>
      </span>
      <span className="flex flex-1 flex-col gap-3 px-1 pt-3 pb-1 sm:flex-row sm:items-end sm:gap-4 sm:pt-4 sm:pb-2">
        <span className="min-w-0 flex-1">
          <span className="tv block text-[26px] text-night-ink sm:text-[42px]">{c.title}</span>
          <span className="mt-1.5 block text-[13px] leading-snug text-night-ink-2 sm:mt-2 sm:text-[15.5px]">{c.text}</span>
        </span>
        <span className="mono mt-auto inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-orange px-4 sm:mt-0 sm:h-12 text-[13px] font-bold tracking-[0.12em] text-ink transition-colors group-hover:bg-[#ff7a1a]">
          TAKE <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.6} aria-hidden />
        </span>
      </span>
    </button>
  );
}

/** La grille de la semaine d'ouverture, comme dans un magazine télé. Les cases libres sont cliquables. */
function Guide({ avail, preset, onPreset }: { avail: Availability | null; preset: { day: string; time: string } | null; onPreset: (d: string, t: string) => void }) {
  const now = avail ? new Date(avail.now) : null;
  const today = now ? now.toISOString().slice(0, 10) : SCHEDULE.windowStart;
  const first = today > SCHEDULE.windowStart && today <= SCHEDULE.windowEnd ? today : SCHEDULE.windowStart;
  const days = Array.from({ length: 7 }, (_, i) => addDays(first, i)).filter((d) => d <= SCHEDULE.windowEnd);
  return (
    <section id="grille" aria-labelledby="grille-titre" className="bg-[#f3eee6] text-ink">
      <Reveal className="mx-auto max-w-[1320px] px-4 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-[3px] border-ink pb-4">
          <div>
            <p data-r style={{ ["--i" as string]: 0 }} className="mono-label text-orange-ink">
              Programme · semaine 1
            </p>
            <h2 data-r style={{ ["--i" as string]: 1 }} id="grille-titre" className="tv mt-3 text-[56px] sm:text-[96px]">
              La grille de décembre
            </h2>
          </div>
          <p data-r style={{ ["--i" as string]: 2 }} className="max-w-[40ch] pb-2 text-[15.5px] leading-relaxed text-ink-2">
            Chaque case, c&apos;est 1h30 d&apos;antenne. Les cases hachurées sont déjà prises. <strong className="text-ink">Touche une case libre</strong> pour la
            garder.
          </p>
        </div>

        <div className="-mx-4 mt-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[88px_1fr] gap-3 pt-5">
              <span />
              <GuideHours />
            </div>
            <div className="mt-1">
              {days.map((d, i) => (
                <div key={d} className="grid grid-cols-[88px_1fr] items-center gap-3 border-b border-ink/15 py-1.5">
                  <span className="leading-none">
                    <span className="mono-label block text-[10px] text-ink-3">{formatDay(d, "short").split(" ")[0]}</span>
                    <span className="tv mt-1 block text-[30px]">{d.slice(8, 10)}</span>
                  </span>
                  {avail && now ? (
                    <DayTrack day={d} busy={avail.busy} now={now} index={i} selectedTime={preset?.day === d ? preset.time : null} onPick={(t) => onPreset(d, t)} />
                  ) : (
                    <span className="h-12 animate-pulse bg-ink/5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mono-label mt-4 flex flex-wrap gap-x-6 gap-y-2 text-ink-3">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 border border-dashed border-ink/40" /> Libre
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="hatch inline-block h-3 w-6 bg-ink/[0.07]" /> À l&apos;antenne
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-6 bg-orange/20" /> Prime time
          </span>
        </p>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="deck border-t border-deck-line text-night-ink-2">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-10 text-[14px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="inline-flex items-center gap-3">
          <Logo tone="white" size={20} />
          <span className="mono-label">Lomé, Togo · fin d&apos;émission</span>
        </span>
        <nav aria-label="Liens secondaires" className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/animatrice" className="font-semibold text-night-ink underline decoration-night-orange decoration-2 underline-offset-4">
            Tu sais vendre ? Deviens animatrice
          </a>
          <a href="/regie" className="hover:text-night-ink">
            Régie
          </a>
        </nav>
      </div>
    </footer>
  );
}
