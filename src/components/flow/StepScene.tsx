"use client";
import { ArrowRight, Clapperboard } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { PACKS } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { LIVE_PASS } from "@/lib/lives";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import { CinemaIntro } from "@/components/story/CinemaIntro";
import { Directory } from "@/components/home/Directory";
import { untilLabel, useLives } from "@/components/home/useLives";

const MIN_PRICE = Math.min(...PACKS.map((p) => p.price));
type Door = "watch" | "sell";

/**
 * L'accueil : deux portes. « Je regarde » : les vendeurs en live, par pays et par rayon.
 * « Je vends » : trois façons de passer en live avec OCD. Peu de texte, de grandes actions.
 */
export function StepScene({ selected, onPick }: { avail: Availability | null; selected: Mode | null; onPick: (m: Mode) => void }) {
  const { data, error, reload } = useLives();
  const [door, setDoor] = useState<Door>("watch");

  // la porte choisie est gardée si on recharge ou si on revient en arrière
  useEffect(() => {
    try {
      const d = sessionStorage.getItem("ocd-door") as Door | null;
      if (d === "sell" || location.hash === "#vendre") setDoor("sell");
    } catch {}
  }, []);
  const open = (d: Door) => {
    haptic();
    setDoor(d);
    try {
      sessionStorage.setItem("ocd-door", d);
    } catch {}
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <CinemaIntro />

      <header role="banner" className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
        <Logo size={26} className="[view-transition-name:ocd-logo]" />
        <a href="/shorts" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14.5px] font-bold text-paper">
          <Clapperboard className="size-4" aria-hidden /> Shorts
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-8 sm:pt-10">
        {/* l'état de l'antenne : la première info, toujours visible */}
        <p className="fade-up flex flex-wrap items-center gap-2 text-[14.5px] font-semibold" style={{ ["--d" as string]: 60 }} aria-live="polite">
          {data?.session ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-live px-3.5 py-2 text-white">
              <span className="size-2 rounded-full bg-white motion-safe:animate-pulse" aria-hidden />
              En direct · {data.lives.length} vendeur{data.lives.length > 1 ? "s" : ""} · jusqu&apos;à {data.session.end.replace(":00", "h")}
            </span>
          ) : data ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-2 ring-1 ring-line">
              <span className="size-2 rounded-full bg-ink-3" aria-hidden />
              Prochaine session {data.next.start.replace(":00", "h")}–{data.next.end.replace(":00", "h")}, {untilLabel(data.next.at, new Date(data.now).getTime())}
            </span>
          ) : (
            <span className="h-9 w-64 animate-pulse rounded-full bg-paper-2" />
          )}
          {data?.demo && <span className="text-[12.5px] font-medium text-ink-3">démo</span>}
        </p>

        <h1 className="display mt-5 text-[clamp(40px,11vw,96px)]">
          <span className="reveal-line">
            <span style={{ ["--d" as string]: 140 }}>Le marché,</span>
          </span>
          <span className="reveal-line">
            <span style={{ ["--d" as string]: 240 }}>en live.</span>
          </span>
        </h1>

        {/* les deux portes */}
        <div role="tablist" aria-label="Que veux-tu faire ?" className="fade-up mt-7 grid grid-cols-2 gap-1.5 rounded-full bg-paper-2 p-1.5 sm:max-w-[560px]" style={{ ["--d" as string]: 380 }}>
          {(
            [
              ["watch", "👀", "Je regarde"],
              ["sell", "📣", "Je vends"],
            ] as const
          ).map(([k, icon, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={door === k}
              aria-controls={`porte-${k}`}
              onClick={() => open(k)}
              className={cn(
                "inline-flex h-14 items-center justify-center gap-2 rounded-full text-[17px] font-bold transition-[background-color,color,box-shadow] duration-200 sm:h-16 sm:text-[19px]",
                door === k ? "bg-ink text-paper shadow-[0_10px_24px_-12px_rgb(22_18_14/0.6)]" : "text-ink-2 hover:text-ink",
              )}
            >
              <span aria-hidden className="text-[22px]">
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>

        <section id="porte-watch" role="tabpanel" aria-label="Les vendeurs en live" hidden={door !== "watch"} className="mt-8">
          <Directory data={data} error={error} onRetry={reload} onSell={() => open("sell")} />
        </section>

        <section id="porte-sell" role="tabpanel" aria-label="Passer en live avec OCD" hidden={door !== "sell"} className="mt-8">
          <div className="cascade-auto grid gap-3 lg:grid-cols-3">
            <SellTile
              href="/en-live"
              icon="📲"
              color="#ffd9d6"
              title="Je suis en live"
              text="Envoie ton lien. On te montre à toute l'Afrique."
              price={`${fcfa(LIVE_PASS.price)} / mois`}
            />
            <SellTile
              id="choix-studio"
              icon="🎬"
              color="#ffe2c4"
              title="Live au studio"
              text="À Lomé, avec la régie et la lumière."
              price={`dès ${fcfa(MIN_PRICE)}`}
              selected={selected === "studio"}
              onClick={() => onPick("studio")}
            />
            <SellTile
              icon="🏠"
              color="#dff1e5"
              title="Live depuis chez toi"
              text="Une animatrice OCD te prend en duplex."
              price={`dès ${fcfa(MIN_PRICE)}`}
              selected={selected === "remote"}
              onClick={() => onPick("remote")}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[14px] text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="inline-flex items-center gap-3">
            <Logo size={18} />
            <span>Les opportunités, c&apos;est dehors.</span>
          </span>
          <nav aria-label="Liens secondaires" className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="/shorts" className="font-semibold text-ink">
              Shorts OCD
            </a>
            <a href="/animatrice" className="font-semibold text-ink">
              Deviens animatrice
            </a>
            <a href="/regie" className="hover:text-ink">
              Régie
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SellTile({
  id,
  href,
  icon,
  color,
  title,
  text,
  price,
  selected,
  onClick,
}: {
  id?: string;
  href?: string;
  icon: string;
  color: string;
  title: string;
  text: string;
  price: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="grid size-16 shrink-0 place-items-center rounded-2xl text-[34px] lg:size-20 lg:text-[42px]" style={{ background: color }} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1 lg:mt-6">
        <span className="block text-[20px] leading-tight font-bold tracking-[-0.015em] lg:text-[24px]">{title}</span>
        <span className="mt-1 block text-[14.5px] leading-snug text-ink-2">{text}</span>
        <span className="tabular mt-2 block text-[14px] font-bold text-orange-ink">{price}</span>
      </span>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform duration-200 group-hover:translate-x-0.5 lg:mt-6 lg:self-end" aria-hidden>
        <ArrowRight className="size-5" strokeWidth={2.4} />
      </span>
    </>
  );
  const cls = cn(
    "group flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left ring-1 transition-[box-shadow,transform] duration-200 active:scale-[0.99] sm:p-5 lg:h-full lg:flex-col lg:items-start lg:p-7",
    selected ? "ring-2 ring-orange" : "ring-line hover:ring-ink/30 hover:shadow-[0_18px_36px_-22px_rgb(22_18_14/0.4)]",
  );
  return (
    <div>
      {href ? (
        <a href={href} className={cls}>
          {body}
        </a>
      ) : (
        <button
          id={id}
          type="button"
          className={cls}
          onClick={(e) => {
            haptic();
            e.currentTarget.style.setProperty("view-transition-name", "dock");
            onClick?.();
          }}
        >
          {body}
        </button>
      )}
    </div>
  );
}
