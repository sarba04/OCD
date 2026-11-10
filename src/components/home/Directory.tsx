"use client";
import { ArrowUpRight, Globe, MoonStar, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { getCountry } from "@/lib/countries";
import { LIVE_CATEGORIES, getCategory, type PublicLive } from "@/lib/lives";
import { initials } from "@/lib/format";
import { Flag } from "@/components/ui/Flag";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import { untilLabel, type LivesState } from "./useLives";

/** L'annuaire : un pays, un rayon, et les vendeurs en live. Peu de mots, de grandes cibles. */
export function Directory({ data, error, onRetry, onSell }: { data: LivesState | null; error: boolean; onRetry: () => void; onSell: () => void }) {
  const [country, setCountry] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const lives = useMemo(() => data?.lives ?? [], [data]);

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    lives.forEach((l) => m.set(l.country, (m.get(l.country) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [lives]);
  const inCountry = country ? lives.filter((l) => l.country === country) : lives;
  const cats = LIVE_CATEGORIES.map((c) => ({ ...c, n: inCountry.filter((l) => l.category === c.id).length })).filter((c) => c.n > 0);
  const shown = cat ? inCountry.filter((l) => l.category === cat) : inCountry;

  if (error && !data)
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-danger-soft px-4 py-3 text-[15px]">
        Connexion perdue.
        <button onClick={onRetry} className="inline-flex h-11 items-center gap-1.5 font-semibold text-danger">
          <RotateCcw className="size-4" aria-hidden /> Réessayer
        </button>
      </div>
    );

  return (
    <div>
      {/* 1. le pays */}
      <div role="group" aria-label="Pays" className="chip-row -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-8 sm:px-8">
        <Chip on={!country} onClick={() => (setCountry(null), setCat(null))}>
          <Globe className="size-5" strokeWidth={1.8} aria-hidden /> Tous <Count n={lives.length} on={!country} />
        </Chip>
        {countries.map(([code, n]) => (
          <Chip key={code} on={country === code} onClick={() => (setCountry(code), setCat(null))}>
            <Flag code={code} /> {getCountry(code)?.name ?? code} <Count n={n} on={country === code} />
          </Chip>
        ))}
        {!data && Array.from({ length: 4 }, (_, i) => <span key={i} className="h-12 w-32 shrink-0 animate-pulse rounded-full bg-paper-2" />)}
      </div>

      {/* 2. le rayon */}
      {cats.length > 1 && (
        <div role="group" aria-label="Ce qu'on vend" className="chip-row -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-8 sm:px-8">
          {cats.map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  haptic();
                  setCat(on ? null : c.id);
                }}
                className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={cn("grid size-16 place-items-center rounded-full text-white transition-transform duration-200 group-active:scale-95", on ? "ring-4 ring-ink ring-offset-2 ring-offset-paper" : "")}
                  style={{ background: c.color }}
                  aria-hidden
                >
                  <CategoryIcon id={c.id} className="size-7" />
                </span>
                <span className={cn("text-center text-[12.5px] leading-tight", on ? "font-bold text-ink" : "font-medium text-ink-2")}>
                  {c.label} <span className="text-ink-3">{c.n}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. les vendeurs en live */}
      {data && shown.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-paper-2 px-6 py-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-card text-ink-2 ring-1 ring-line" aria-hidden>
            <MoonStar className="size-7" strokeWidth={1.8} />
          </span>
          <p className="mt-2 text-[19px] font-bold">{data.session ? "Personne en live ici pour l'instant." : "Pas de session en ce moment."}</p>
          {!data.testMode && (
            <p className="mt-1 text-[15px] text-ink-2">
              Prochaine session à {data.next.start.replace(":00", "h")}, {untilLabel(data.next.at, new Date(data.now).getTime())}.
            </p>
          )}
          <button onClick={onSell} className="mt-5 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-bold text-paper">
            Je vends : je m&apos;inscris
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data
            ? shown.map((l, i) => <LiveCard key={l.id} l={l} i={i} />)
            : Array.from({ length: 6 }, (_, i) => <li key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-paper-2" />)}
        </ul>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        haptic();
        onClick();
      }}
      className={cn(
        "inline-flex h-12 shrink-0 items-center gap-2 rounded-full pr-3 pl-4 text-[15px] font-semibold whitespace-nowrap transition-colors",
        on ? "bg-ink text-paper" : "bg-card text-ink ring-1 ring-line hover:ring-ink/30",
      )}
    >
      {children}
    </button>
  );
}

const Count = ({ n, on }: { n: number; on: boolean }) => (
  <span className={cn("tabular grid h-7 min-w-7 place-items-center rounded-full px-2 text-[13px] font-bold", on ? "bg-live text-white" : "bg-paper-2 text-ink-2")}>{n}</span>
);

/**
 * Une carte = un vendeur en live : une couverture typographique (ses initiales sur la couleur de son rayon,
 * avec une trame fine), comme une pochette. Toute la carte ouvre le live sur TikTok.
 */
function LiveCard({ l, i }: { l: PublicLive; i: number }) {
  const c = getCategory(l.category);
  const country = getCountry(l.country);
  return (
    <li className="cascade" style={{ ["--i" as string]: Math.min(i, 12) }}>
      <a
        href={l.url}
        target="_blank"
        rel="noopener"
        className="cover group relative flex aspect-[4/5] flex-col overflow-hidden rounded-[22px] text-white transition-transform duration-200 active:scale-[0.98]"
        style={{ ["--c" as string]: c.color }}
        aria-label={`${l.name}, ${c.label}, ${country?.name ?? ""} : regarder son live sur TikTok`}
      >
        <span className="relative z-10 flex items-center justify-between p-3 sm:p-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em]">
            <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden /> LIVE
          </span>
          <Flag code={l.country} className="w-7" />
        </span>
        {l.hasPhoto ? (
          <>
            {/* la photo du produit remplit la carte ; un voile en haut garde le badge LIVE lisible */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/lives/${l.id}/photo`}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
            <span className="flex-1" />
          </>
        ) : (
          <span className="relative flex flex-1 items-end px-3.5 pb-2 sm:px-4" aria-hidden>
            <span className="display text-[64px] leading-[0.85] tracking-[-0.06em] text-white/95 transition-transform duration-300 group-hover:-translate-y-1 sm:text-[80px]">
              {initials(l.name)}
            </span>
          </span>
        )}
        <span className="relative z-10 m-2 rounded-2xl bg-white px-3 py-2.5 text-ink shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)]">
          <span className="block truncate text-[15px] leading-tight font-bold">{l.name}</span>
          <span className="mt-1 flex items-center justify-between gap-2 text-[12.5px] text-ink-2">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CategoryIcon id={c.id} className="size-3.5 shrink-0" strokeWidth={2.2} />
              <span className="truncate">{c.label}</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </span>
        </span>
      </a>
    </li>
  );
}
