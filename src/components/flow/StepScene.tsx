/* eslint-disable @next/next/no-img-element */
"use client";
import { ArrowUp, ArrowUpRight, Check, ChevronDown, Clapperboard, Globe, Megaphone, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { PACKS } from "@/lib/config";
import { getCountry } from "@/lib/countries";
import { fcfa } from "@/lib/format";
import { LIVE_CATEGORIES, LIVE_PASS, getCategory, type PublicLive } from "@/lib/lives";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import { Flag } from "@/components/ui/Flag";
import { CategoryArt } from "@/components/ui/CategoryArt";
import type { Availability } from "./BookingApp";
import { CinemaIntro } from "@/components/story/CinemaIntro";
import { untilLabel, useLives, type LivesState } from "@/components/home/useLives";

const MIN_PRICE = Math.min(...PACKS.map((p) => p.price));

/**
 * L'accueil d'OCD Live est un fil : un vendeur en live par écran, on glisse au suivant.
 * Le pays et le rayon se choisissent d'un geste ; « Vendre » ouvre les trois façons de passer en live.
 * Sur ordinateur : un panneau wax à gauche, le fil à droite.
 */
export function StepScene({ selected, onPick }: { avail: Availability | null; selected: Mode | null; onPick: (m: Mode) => void }) {
  const { data, error, reload } = useLives();
  const [country, setCountry] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "country" | "sell">(null);
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.hash === "#vendre") setSheet("sell");
  }, []);

  const all = useMemo(() => data?.lives ?? [], [data]);
  const countries = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((l) => m.set(l.country, (m.get(l.country) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);
  const inCountry = country ? all.filter((l) => l.country === country) : all;
  const cats = LIVE_CATEGORIES.map((c) => ({ ...c, n: inCountry.filter((l) => l.category === c.id).length })).filter((c) => c.n > 0);
  const shown = cat ? inCountry.filter((l) => l.category === cat) : inCountry;

  const toTop = () => feed.current?.scrollTo({ top: 0 });
  const pickCountry = (c: string | null) => {
    haptic();
    setCountry(c);
    setCat(null);
    setSheet(null);
    toTop();
  };
  const pickCat = (c: string | null) => {
    haptic();
    setCat(c);
    toTop();
  };
  const next = () => feed.current?.scrollBy({ top: feed.current.clientHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

  const countryLabel = country ? getCountry(country)?.name ?? country : "Toute l'Afrique";

  const Filters = ({ panel }: { panel?: boolean }) => (
    <div role="group" aria-label="Ce qu'on cherche" className={cn("chip-row flex gap-2 overflow-x-auto", panel ? "flex-wrap overflow-visible" : "px-4 pb-1")}>
      <button
        type="button"
        aria-pressed={!cat}
        onClick={() => pickCat(null)}
        className={cn("inline-flex h-11 shrink-0 items-center rounded-full px-4 text-[14px] font-semibold", !cat ? (panel ? "bg-coal text-white" : "bg-white text-ink") : panel ? "bg-black/10 text-ink" : "bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md")}
      >
        Tout
      </button>
      {cats.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={cat === c.id}
          onClick={() => pickCat(cat === c.id ? null : c.id)}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full pr-4 pl-1.5 text-[14px] font-semibold",
            cat === c.id ? (panel ? "bg-coal text-white" : "bg-white text-ink") : panel ? "bg-black/10 text-ink" : "bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md",
          )}
        >
          <CategoryArt id={c.id} small className="size-8 drop-shadow-none" />
          {c.label}
          <span className="tabular text-[12px] opacity-70">{c.n}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative h-dvh overflow-hidden bg-coal text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <CinemaIntro />

      {/* ───── Ordinateur : le panneau wax ───── */}
      <aside className="wax hidden h-dvh flex-col overflow-y-auto p-10 text-ink lg:flex xl:p-14">
        <div className="flex items-center justify-between">
          <Logo size={26} tone="ink" className="[view-transition-name:ocd-logo]" />
          <a href="/shorts" className="inline-flex h-11 items-center gap-2 rounded-full bg-coal px-4 text-[14px] font-semibold text-white hover:bg-black">
            <Clapperboard className="size-4" aria-hidden /> Shorts
          </a>
        </div>
        <Status data={data} className="mt-12" />
        <h1 className="display mt-5 text-[clamp(52px,5.4vw,92px)] leading-[0.9]">
          Le marché,
          <br />
          en direct.
        </h1>
        <p className="mt-5 max-w-[34ch] text-[18px] leading-relaxed text-ink/80">Les vendeurs d&apos;Afrique en live, pays par pays. Choisis, regarde, achète.</p>

        <p className="mt-10 text-[13px] font-semibold tracking-wide text-ink/70 uppercase">Pays</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CountryChip on={!country} onClick={() => pickCountry(null)} label="Toute l'Afrique" n={all.length} />
          {countries.map(([code, n]) => (
            <CountryChip key={code} code={code} on={country === code} onClick={() => pickCountry(code)} label={getCountry(code)?.name ?? code} n={n} />
          ))}
        </div>
        {cats.length > 1 && (
          <>
            <p className="mt-8 text-[13px] font-semibold tracking-wide text-ink/70 uppercase">Rayon</p>
            <div className="mt-3">
              <Filters panel />
            </div>
          </>
        )}
        <div className="mt-auto pt-12">
          <SellOptions selected={selected} onPick={onPick} compact />
          <FooterLinks className="mt-8" dark />
        </div>
      </aside>

      {/* ───── Le fil ───── */}
      <div className="relative h-dvh">
        {/* barre du haut (mobile) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/55 to-transparent pb-6 lg:hidden">
          <div className="pointer-events-auto flex items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
            <Logo size={20} tone="white" />
            <button
              type="button"
              onClick={() => setSheet("country")}
              className="ml-auto inline-flex h-11 min-w-0 items-center gap-2 rounded-full bg-white/14 pr-3 pl-2.5 text-[14px] font-semibold ring-1 ring-white/25 backdrop-blur-md"
            >
              {country ? <Flag code={country} className="w-6" /> : <Globe className="size-5" aria-hidden />}
              <span className="max-w-[9rem] truncate">{countryLabel}</span>
              <ChevronDown className="size-4 shrink-0" aria-hidden />
            </button>
            <button type="button" onClick={() => setSheet("sell")} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[14px] font-bold text-ink">
              <Megaphone className="size-4" aria-hidden /> Vendre
            </button>
          </div>
          {cats.length > 1 && (
            <div className="pointer-events-auto mt-3">
              <Filters />
            </div>
          )}
        </div>

        <div ref={feed} className="feed h-dvh snap-y snap-mandatory overflow-y-auto" aria-label="Les vendeurs en live" role="region" aria-busy={!data}>
          {/* 1. l'ouverture */}
          <section aria-labelledby="ouverture" className="wax relative flex h-dvh snap-start flex-col justify-end px-6 pt-36 pb-10 text-ink lg:hidden">
            <Status data={data} />
            <h1 id="ouverture" className="display mt-4 text-[clamp(48px,14vw,76px)] leading-[0.9]">
              Le marché,
              <br />
              en direct.
            </h1>
            <p className="mt-4 max-w-[30ch] text-[17px] leading-relaxed text-ink/85">Les vendeurs d&apos;Afrique en live. Glisse pour les voir.</p>
            <div className="mt-8 grid grid-cols-2 gap-2.5">
              <button type="button" onClick={next} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-coal text-[16px] font-bold text-white">
                <ArrowUp className="size-5" aria-hidden /> Regarder
              </button>
              <button type="button" onClick={() => setSheet("sell")} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold text-ink">
                Je vends
              </button>
            </div>
            <FooterLinks className="mt-8" dark />
          </section>

          {error && !data && (
            <section className="grid h-dvh snap-start place-items-center px-8 text-center">
              <div>
                <p className="text-[20px] font-bold">Connexion perdue.</p>
                <button onClick={reload} className="mt-5 inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-ink">
                  Réessayer
                </button>
              </div>
            </section>
          )}

          {!data && !error && <section className="h-dvh snap-start animate-pulse bg-white/5" aria-hidden />}

          {/* 2. les vendeurs en live */}
          {shown.map((l, i) => (
            <LiveSlide key={l.id} l={l} i={i} total={shown.length} />
          ))}

          {/* 3. la fin du fil */}
          {data && (
            <section className="wax flex h-dvh snap-start flex-col items-center justify-center px-8 text-center [--wax-bg:var(--color-coal)]">
              <p className="display text-[clamp(34px,9vw,52px)] leading-[0.95]">{shown.length ? "Tu as tout vu." : data.session ? "Personne en live ici." : "Pas de session en ce moment."}</p>
              <p className="mt-4 max-w-[30ch] text-[16px] text-white/75">
                {shown.length
                  ? "Reviens tout à l'heure : de nouveaux vendeurs passent en live toute la journée."
                  : data.testMode
                    ? "Change de pays ou de rayon, ou reviens un peu plus tard."
                    : `Prochaine session à ${data.next.start.replace(":00", "h")}, ${untilLabel(data.next.at, new Date(data.now).getTime())}.`}
              </p>
              <div className="mt-8 grid w-full max-w-[340px] gap-2.5">
                <a href="/en-live" className="inline-flex h-14 items-center justify-center rounded-full bg-brand text-[16px] font-bold text-ink">
                  Je suis en live : je m&apos;affiche
                </a>
                {(country || cat) && (
                  <button type="button" onClick={() => (setCountry(null), setCat(null), toTop())} className="h-12 text-[15px] font-semibold text-white/85 underline underline-offset-4">
                    Voir toute l&apos;Afrique
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ───── Feuilles ───── */}
      {sheet && (
        <Sheet title={sheet === "country" ? "Quel pays ?" : "Passer en live avec OCD"} onClose={() => setSheet(null)}>
          {sheet === "country" ? (
            <ul className="grid gap-1.5">
              <li>
                <CountryRow on={!country} onClick={() => pickCountry(null)} label="Toute l'Afrique" n={all.length} />
              </li>
              {countries.map(([code, n]) => (
                <li key={code}>
                  <CountryRow code={code} on={country === code} onClick={() => pickCountry(code)} label={getCountry(code)?.name ?? code} n={n} />
                </li>
              ))}
            </ul>
          ) : (
            <SellOptions selected={selected} onPick={onPick} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function Status({ data, className }: { data: LivesState | null; className?: string }) {
  if (!data) return <span className={cn("block h-9 w-56 animate-pulse rounded-full bg-black/10", className)} />;
  return (
    <p className={cn("inline-flex w-fit items-center gap-2.5 rounded-full bg-coal py-2 pr-4 pl-3.5 text-[14px] font-bold text-white", className)} aria-live="polite">
      <span className="sun-dot" aria-hidden />
      {data.session ? `${data.lives.length} vendeur${data.lives.length > 1 ? "s" : ""} en live` : `Prochaine session ${data.next.start.replace(":00", "h")}`}
      {data.demo && <span className="font-medium opacity-70">· démo</span>}
    </p>
  );
}

/** Un vendeur en live, plein écran : son produit, son nom en très large, un seul bouton. */
function LiveSlide({ l, i, total }: { l: PublicLive; i: number; total: number }) {
  const c = getCategory(l.category);
  const country = getCountry(l.country);
  return (
    <article aria-label={`${l.name}, ${c.label}, ${country?.name ?? ""}`} className="relative flex h-dvh snap-start flex-col justify-end overflow-hidden">
      {l.hasPhoto ? (
        <img src={`/api/lives/${l.id}/photo`} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="wax absolute inset-0 grid place-items-center pb-44" style={{ ["--wax-bg" as string]: `color-mix(in srgb, ${c.color} 80%, #111111)` }} aria-hidden>
          <CategoryArt id={c.id} className="w-[min(78%,420px)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 via-45% to-black/30" aria-hidden />

      <span className="tabular absolute top-[max(76px,calc(env(safe-area-inset-top)+64px))] right-4 rounded-full bg-black/40 px-3 py-1 text-[12.5px] font-semibold backdrop-blur-md lg:top-6">
        {i + 1} / {total}
      </span>

      <div className="relative px-5 pb-[max(28px,env(safe-area-inset-bottom))] sm:px-7">
        <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
          <span className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-3 text-ink">
            <span className="sun-dot" aria-hidden /> EN LIVE
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 py-1.5 pr-3 pl-2 backdrop-blur-md">
            <Flag code={l.country} className="w-5" /> {country?.name}
          </span>
          <span className="rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">{c.label}</span>
        </p>
        <h2 className="display mt-4 text-[clamp(34px,10vw,56px)] leading-[0.92] [text-wrap:balance]">{l.name}</h2>
        <a
          href={l.url}
          target="_blank"
          rel="noopener"
          className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-[16px] font-bold text-ink active:scale-[0.99] sm:w-auto sm:px-8"
        >
          Voir son live sur TikTok <ArrowUpRight className="size-5" aria-hidden />
        </a>
      </div>
    </article>
  );
}

function SellOptions({ selected, onPick, compact }: { selected: Mode | null; onPick: (m: Mode) => void; compact?: boolean }) {
  const opts = [
    { key: "golive", href: "/en-live", photo: "/media/live-seller-480.webp", pos: "50% 22%", title: "Je suis en live", text: "Envoie ton lien, on t'affiche.", price: `${fcfa(LIVE_PASS.price)} / mois` },
    { key: "studio", mode: "studio" as Mode, id: "choix-studio", photo: "/media/products-760.webp", pos: "50% 50%", title: "Live au studio", text: "À Lomé, avec la régie.", price: `dès ${fcfa(MIN_PRICE)}` },
    { key: "remote", mode: "remote" as Mode, photo: "/media/animatrice-760.webp", pos: "30% 30%", title: "Live depuis chez toi", text: "Une animatrice OCD en duplex.", price: `dès ${fcfa(MIN_PRICE)}` },
  ];
  return (
    <ul className={cn("grid gap-2.5", compact && "xl:grid-cols-3")}>
      {opts.map((o) => {
        const on = !!o.mode && selected === o.mode;
        const inner = (
          <>
            <img src={o.photo} alt="" width={160} height={160} loading="lazy" style={{ objectPosition: o.pos }} className={cn("shrink-0 rounded-2xl object-cover", compact ? "size-14 xl:aspect-[4/3] xl:h-auto xl:w-full" : "size-16")} />
            <span className="min-w-0 flex-1">
              <span className="block text-[16.5px] leading-tight font-bold">{o.title}</span>
              <span className="block text-[13.5px] text-current/70">{o.text}</span>
              <span className={cn("tabular mt-0.5 block text-[13px] font-bold", compact ? "text-ink" : "text-brand")}>{o.price}</span>
            </span>
            {on ? <Check className="size-5 shrink-0" aria-hidden /> : <ArrowUpRight className="size-5 shrink-0 opacity-70" aria-hidden />}
          </>
        );
        const cls = cn(
          "flex w-full items-center gap-3.5 rounded-3xl p-3 text-left transition-colors",
          compact ? "bg-white text-ink shadow-[0_10px_24px_-14px_rgb(0_0_0/0.45)] hover:bg-white/90 xl:flex-col xl:items-start" : "bg-white/8 ring-1 ring-white/15 hover:bg-white/14",
          on && "ring-2 ring-brand",
        );
        return (
          <li key={o.key}>
            {o.href ? (
              <a href={o.href} className={cls}>
                {inner}
              </a>
            ) : (
              <button
                id={o.id}
                type="button"
                className={cls}
                onClick={(e) => {
                  haptic();
                  e.currentTarget.style.setProperty("view-transition-name", "dock");
                  onPick(o.mode!);
                }}
              >
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CountryChip({ code, on, onClick, label, n }: { code?: string; on: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("inline-flex h-11 items-center gap-2 rounded-full pr-3 pl-2.5 text-[14px] font-semibold", on ? "bg-coal text-white" : "bg-black/10 text-ink hover:bg-black/15")}
    >
      {code ? <Flag code={code} className="w-6" /> : <Globe className="size-5" aria-hidden />}
      {label}
      <span className="tabular text-[12.5px] opacity-60">{n}</span>
    </button>
  );
}

function CountryRow({ code, on, onClick, label, n }: { code?: string; on: boolean; onClick: () => void; label: string; n: number }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("flex h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-[16px] font-semibold", on ? "bg-brand text-ink" : "bg-white/6 hover:bg-white/12")}
    >
      {code ? <Flag code={code} className="w-8" /> : <Globe className="size-6" aria-hidden />}
      <span className="flex-1">{label}</span>
      <span className={cn("tabular text-[14px]", on ? "opacity-90" : "opacity-70")}>
        {n} en live
      </span>
    </button>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button, a")?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fermer" onClick={onClose} className="animate-fade absolute inset-0 bg-black/60" />
      <div ref={ref} className="animate-sheet relative max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-coal p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-white ring-1 ring-white/10 lg:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="display text-[24px]">{title}</p>
          <button onClick={onClose} aria-label="Fermer" className="grid size-11 place-items-center rounded-full bg-white/10">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FooterLinks({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <nav aria-label="Liens secondaires" className={cn("flex flex-wrap gap-x-5 gap-y-2 text-[14px]", dark ? "text-ink/80" : "text-white/70", className)}>
      <a href="/shorts" className={cn("font-semibold underline decoration-2 underline-offset-4 lg:hidden", dark ? "text-ink decoration-ink" : "text-white decoration-brand")}>
        Shorts OCD
      </a>
      <a href="/animatrice" className="underline-offset-4 hover:underline">
        Deviens animatrice
      </a>
      <a href="/regie" className="underline-offset-4 hover:underline">
        Régie
      </a>
      <span>Les opportunités, c&apos;est dehors.</span>
    </nav>
  );
}
