"use client";
import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { StudioWall } from "@/components/brand/StudioWall";
import { BRAND, PACKS } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { freeSlotCount } from "@/lib/schedule";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import { LiveDemo } from "./LiveDemo";
import { Ticker } from "@/components/motion/Ticker";
import { SellAnything } from "./SellAnything";

const MIN_PRICE = Math.min(...PACKS.map((p) => p.price));

export function StepScene({ avail, selected, onPick }: { avail: Availability | null; selected: Mode | null; onPick: (m: Mode) => void }) {
  const [hover, setHover] = useState<Mode | null>(null);
  const free = useMemo(() => (avail ? freeSlotCount(avail.busy, new Date(avail.now)) : null), [avail]);
  const wallRef = useRef<HTMLElement>(null);

  /* Ordinateur : la lumière du studio suit la souris sur le mur, comme un projecteur qu'on oriente. */
  useEffect(() => {
    const el = wallRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--lx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        el.style.setProperty("--ly", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      });
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div className="relative overflow-x-clip">
      {/* ───── Le plateau : on entre dans le studio ───── */}
      <section ref={wallRef} className="wall spot relative">
        <header role="banner" className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
          <Logo size={26} className="[view-transition-name:ocd-logo]" />
          <a href="#comment" className="inline-flex h-11 items-center text-[14px] font-semibold text-ink-2 underline decoration-ink/20 underline-offset-[6px] hover:decoration-orange">
            Comment ça marche
          </a>
        </header>

        <main className="relative z-10 mx-auto grid max-w-6xl px-5 pb-10 sm:px-8 lg:min-h-[calc(min(100dvh,940px)-92px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-6 lg:pb-14">
          {/* Le mur rétroéclairé, avec l'enseigne */}
          <div className="relative mx-auto mt-1 flex h-[clamp(150px,30vh,300px)] justify-center sm:h-[340px] lg:order-2 lg:mt-0 lg:h-auto lg:w-full lg:max-w-[620px]">
            <StudioWall tilt onAir intensity={hover || selected ? 1.7 : 1} className="h-full lg:h-auto lg:w-full" />
          </div>

          {/* Le message et les deux choix */}
          <div className="relative z-10 pt-4 sm:pt-8 lg:order-1 lg:py-10">
            <p style={{ ["--d" as string]: 120 }} className="fade-up inline-flex items-center gap-2.5 rounded-full bg-white/70 py-1.5 pr-3.5 pl-3 text-[14px] font-semibold text-ink shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-black/5 backdrop-blur-sm">
              <span className="live-dot" aria-hidden />
              Ouverture des lives le 1er décembre
            </p>
            <h1 className="display mt-3.5 text-[clamp(36px,10.5vw,54px)] sm:text-[68px] lg:mr-[-14%] lg:text-[clamp(56px,5.3vw,78px)]">
              <span className="reveal-line">
                <span style={{ ["--d" as string]: 220 }}>Passe en live.</span>
              </span>
              <span className="reveal-line">
                <span style={{ ["--d" as string]: 330 }} className="whitespace-nowrap">
                  Place ton produit.
                </span>
              </span>
            </h1>
            <p style={{ ["--d" as string]: 480 }} className="fade-up mt-4 max-w-[38ch] text-[16px] leading-relaxed text-ink-2 sm:mt-6 sm:text-[18px] [@media(max-height:700px)_and_(max-width:639px)]:hidden">
              Le marketing avant la vente&nbsp;: un créneau, une régie, et toute l&apos;audience de {BRAND.liveAccount} devant ton business.
            </p>

            <h2 style={{ ["--d" as string]: 560 }} className="fade-up mt-6 text-[17px] font-bold tracking-[-0.01em] sm:mt-9 sm:text-[19px]">Où veux-tu faire ton live&nbsp;?</h2>
            <div className="hero-cards mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-1">
              <SceneCard
                id="choix-studio"
                photo={{ src: "/media/live-seller-480.webp", pos: "50% 22%", alt: "" }}
                title="Au studio, à Lomé"
                text="Tu viens avec tes produits, la régie fait le reste."
                selected={selected === "studio"}
                onHover={(h) => setHover(h ? "studio" : null)}
                onClick={() => {
                  haptic();
                  onPick("studio");
                }}
              />
              <SceneCard
                photo={{ src: "/media/animatrice-760.webp", pos: "34% 30%", alt: "" }}
                title="À distance"
                text="Depuis ta boutique, avec une animatrice OCD en direct."
                selected={selected === "remote"}
                onHover={(h) => setHover(h ? "remote" : null)}
                onClick={() => {
                  haptic();
                  onPick("remote");
                }}
              />
            </div>

            <p style={{ ["--d" as string]: 860 }} className="fade-up mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
              <span className="tabular inline-flex min-w-[17ch] items-center gap-2">
                <span className="size-2 rounded-full bg-ok" aria-hidden />
                {free === null ? <span className="inline-block h-3.5 w-28 animate-pulse rounded bg-black/10" /> : <>{free} créneaux libres en décembre</>}
              </span>
              <span>Lives de 1h30 dès {fcfa(MIN_PRICE)}</span>
            </p>
          </div>
        </main>
      </section>

      <Ticker />
      <SellAnything />
      <LiveDemo />
      <Footer />
    </div>
  );
}

function SceneCard({
  id,
  photo,
  title,
  text,
  selected,
  onClick,
  onHover,
}: {
  id?: string;
  photo: { src: string; pos: string; alt: string };
  title: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
}) {
  return (
    <div className={cn("transition-[filter] duration-300", selected ? "glow" : "drop-shadow-[0_10px_18px_rgb(60_35_10/0.08)]")}>
      <button
        id={id}
        type="button"
        onClick={(e) => {
          // la carte choisie se transforme en « talon de billet » en bas de l'écran
          e.currentTarget.style.setProperty("view-transition-name", "dock");
          onClick();
        }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        className={cn(
          "edge chamfer group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-transform duration-200 ease-out active:scale-[0.985] sm:p-5",
          selected ? "[--edge-w:2px] [--edge:var(--color-orange)] [--surface:#fff7f0]" : "[--edge:rgb(0_0_0/0.07)] [--surface:var(--color-card)] hover:[--edge:var(--color-ink)]",
        )}
      >
        {/* une fenêtre sur la scène : la photo s'éclaire au survol */}
        <span className="chamfer-sm relative size-[68px] shrink-0 overflow-hidden bg-paper-2 sm:size-[76px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            width={152}
            height={152}
            decoding="async"
            style={{ objectPosition: photo.pos }}
            className="h-full w-full scale-[1.02] object-cover saturate-[0.9] transition-[transform,filter] duration-500 ease-out group-hover:scale-110 group-hover:saturate-[1.1]"
          />
          <span aria-hidden className={cn("absolute inset-0 ring-2 ring-orange ring-inset transition-opacity duration-200", selected ? "opacity-100" : "opacity-0")} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[19px] leading-tight font-bold tracking-[-0.01em] text-ink sm:text-[20px]">{title}</span>
          <span className="mt-1 block text-[14.5px] leading-snug text-ink-2">{text}</span>
        </span>
        <ChevronRight className="size-6 shrink-0 text-ink-3 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-ink" strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-night-line bg-night text-night-ink-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 text-[14px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="inline-flex items-center gap-3">
          <Logo tone="white" size={20} />
          <span>Lomé, Togo</span>
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
