"use client";
import { ChevronRight, Globe, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { AfricaMap, LOME_POS } from "@/components/brand/AfricaMap";
import { Logo } from "@/components/brand/Logo";
import { BRAND, PACKS } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { freeSlotCount } from "@/lib/schedule";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";

const MIN_PRICE = Math.min(...PACKS.map((p) => p.price));

export function StepScene({ avail, selected, onPick }: { avail: Availability | null; selected: Mode | null; onPick: (m: Mode) => void }) {
  const [hover, setHover] = useState<Mode | null>(null);
  const free = useMemo(() => (avail ? freeSlotCount(avail.busy, new Date(avail.now)) : null), [avail]);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {/* ───── En-tête ───── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Logo size={26} />
        <a href="#comment" className="inline-flex h-11 items-center text-[14px] font-semibold text-ink-2 underline decoration-line-2 underline-offset-[6px] hover:decoration-orange">
          Comment ça marche
        </a>
      </header>

      <main className="relative mx-auto grid max-w-6xl px-5 sm:px-8 lg:min-h-[calc(100dvh-96px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        {/* ───── Le mur du studio : carte d'Afrique rétroéclairée ───── */}
        <div
          className={cn(
            // mobile : le mur est en fond, Lomé tombe à droite de la petite ligne « Lancement »
            "pointer-events-none absolute top-[calc(44px-52.5vw)] left-[44vw] w-[112vw]",
            "sm:top-10 sm:left-[56vw] sm:w-[44vw]",
            "lg:pointer-events-auto lg:relative lg:top-auto lg:left-auto lg:order-2 lg:w-full",
          )}
        >
          <AfricaMap focus={hover ?? selected} labels className="hidden lg:block" />
          <AfricaMap quiet className="lg:hidden" />
          <span
            className="absolute translate-x-4 -translate-y-1/2 text-[12px] font-bold tracking-wide text-ink lg:hidden"
            style={{ left: `${LOME_POS.left}%`, top: `${LOME_POS.top}%` }}
          >
            Lomé
          </span>
          {/* Étiquette « en direct » posée sur Lomé (grand écran) */}
          <div
            className="absolute hidden translate-x-[-88%] translate-y-[26px] lg:block"
            style={{ left: `${LOME_POS.left}%`, top: `${LOME_POS.top}%` }}
          >
            <div className="chamfer-sm flex items-center gap-2.5 bg-ink py-2 pr-3.5 pl-3 text-paper shadow-xl">
              <span className="live-dot" />
              <span className="text-[13px] leading-tight font-semibold">
                Studio OCD, Lomé
                <span className="block text-[11.5px] font-normal text-paper/70">en direct sur {BRAND.liveAccount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ───── Le message + les deux choix ───── */}
        <div className="relative z-10 pt-8 pb-8 sm:pt-16 lg:order-1 lg:py-12">
          <p className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-ink-2">
            <span className="live-dot" aria-hidden />
            Ouverture des lives le 1er décembre
          </p>
          <h1 className="display mt-4 text-[clamp(37px,10.4vw,52px)] sm:text-[64px] lg:text-[clamp(52px,4.3vw,64px)]">
            Passe en live.
            <br />
            <span className="whitespace-nowrap">Place ton produit.</span>
          </h1>
          <p className="mt-5 max-w-[36ch] text-[16px] leading-relaxed text-ink-2 sm:mt-6 sm:text-[18px]">
            Le marketing avant la vente&nbsp;: un créneau, une régie, et toute l&apos;audience de {BRAND.liveAccount} devant ton business.
          </p>

          <h2 className="mt-7 text-[17px] font-bold tracking-[-0.01em] sm:mt-10 sm:text-[19px]">Où veux-tu faire ton live&nbsp;?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
            <SceneCard
              icon={<MapPin className="size-6" strokeWidth={2.2} />}
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
              icon={<Globe className="size-6" strokeWidth={2.2} />}
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

          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-3">
            <span className="tabular inline-flex min-w-[17ch] items-center gap-2">
              <span className="size-2 rounded-full bg-ok" aria-hidden />
              {free === null ? <span className="inline-block h-3.5 w-28 animate-pulse rounded bg-line" /> : <>{free} créneaux libres en décembre</>}
            </span>
            <span aria-hidden className="text-line-2">/</span>
            <span>Lives de 1h30 dès {fcfa(MIN_PRICE)}</span>
          </p>
        </div>
      </main>

      <HowItWorks />
      <Footer />
    </div>
  );
}

function SceneCard({
  icon,
  title,
  text,
  selected,
  onClick,
  onHover,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
}) {
  return (
    <div className={cn("transition-[filter] duration-300", selected && "glow")}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        className={cn(
          "edge chamfer group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-transform duration-200 ease-out active:scale-[0.985] sm:p-5",
          selected ? "[--edge-w:2px] [--edge:var(--color-orange)] [--surface:#fff7f0]" : "[--edge:var(--color-line)] [--surface:var(--color-card)] hover:[--edge:var(--color-ink)]",
        )}
      >
        <span className="chamfer-sm grid size-12 shrink-0 place-items-center sm:size-14 bg-orange-soft text-orange-ink transition-colors duration-200 group-hover:bg-orange group-hover:text-ink">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[19px] leading-tight font-bold tracking-[-0.01em] text-ink sm:text-[20px]">{title}</span>
          </span>
          <span className="mt-1 block text-[14.5px] leading-snug text-ink-2">{text}</span>
        </span>
        <ChevronRight className="size-6 shrink-0 text-ink-3 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-ink" strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Choisis ta scène", d: "Au studio à Lomé, ou à distance depuis ta boutique." },
    { n: "02", t: "Ton jour, ton heure, ton pack", d: "Tout décembre est ouvert. Les créneaux pris disparaissent en direct." },
    { n: "03", t: "Tu passes en live", d: `La régie met ton produit, ton numéro et ton adresse à l'écran sur ${BRAND.liveAccount}.` },
  ];
  return (
    <section id="comment" aria-labelledby="comment-titre" className="relative z-10 border-t border-line bg-paper-2/60">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 id="comment-titre" className="display max-w-[18ch] text-[32px] sm:text-[44px]">2 minutes pour réserver. 1h30 pour te faire connaître.</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((s) => (
            <li key={s.n} className="border-t-2 border-ink pt-4">
              <span className="display tabular text-[15px] text-orange-ink">{s.n}</span>
              <h3 className="mt-2 text-[20px] font-bold tracking-[-0.01em]">{s.t}</h3>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-2">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="group relative inline-flex h-14 items-center gap-2.5 px-6 text-[17px] font-bold text-ink"
          >
            <span aria-hidden className="chamfer-sm absolute inset-0 bg-orange transition-colors group-hover:bg-[#ff7714]" />
            <span className="relative">Réserver mon live</span>
          </a>
          <p className="text-[14px] text-ink-3">Paiement par Flooz, Mixx by Yas ou au studio.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[14px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>OCD Live, Lomé (Togo)</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/animatrice" className="font-semibold text-ink underline decoration-orange decoration-2 underline-offset-4">
            Tu sais vendre ? Deviens animatrice
          </a>
          <a href="/regie" className="hover:text-ink">
            Régie
          </a>
        </nav>
      </div>
    </footer>
  );
}
