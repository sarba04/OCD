/* eslint-disable @next/next/no-img-element */
"use client";
import { Check, CircleAlert, Megaphone, Repeat, Video } from "lucide-react";
import { useMemo } from "react";
import { BRAND, PACKS, type Pack } from "@/lib/config";
import { eur, fcfa } from "@/lib/format";
import { checkPack, formatDay, formatTime, type PackCheck } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { Tag, haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import { countryOf, type Draft } from "./state";

/** Ce qui s'ajoute au temps d'antenne, pack par pack. */
const EXTRAS: Record<string, { icon: React.ReactNode; label: string }[]> = {
  vitrine: [{ icon: <Video className="size-3.5" />, label: "teaser vidéo" }],
  spotlight: [
    { icon: <Video className="size-3.5" />, label: `vidéo chez ${BRAND.founder}` },
    { icon: <Megaphone className="size-3.5" />, label: "annonce" },
  ],
  mois: [{ icon: <Megaphone className="size-3.5" />, label: `annonce ${BRAND.founder}` }],
};
const MAX_MIN = Math.max(...PACKS.map((p) => p.sessions * p.minutes));

export function StepPack({
  draft,
  setDraft,
  avail,
  onEditWhen,
}: {
  draft: Draft;
  setDraft: (p: Partial<Draft>) => void;
  avail: Availability | null;
  onEditWhen: () => void;
}) {
  const country = countryOf(draft);
  const checks = useMemo(() => {
    if (!avail || !draft.day || !draft.time) return null;
    const now = new Date(avail.now);
    return Object.fromEntries(PACKS.map((p) => [p.id, checkPack(p, draft.day!, draft.time!, avail.busy, now)]));
  }, [avail, draft.day, draft.time]);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15.5px] text-ink-2">
        <span>
          Ton live commence le <strong className="font-semibold text-ink">{draft.day && formatDay(draft.day)}</strong> à{" "}
          <strong className="tabular font-semibold text-ink">{draft.time}</strong>
          {country && country.tz !== "Africa/Lome" && draft.day && draft.time ? (
            <span className="text-ink-3"> ({formatTime(`${draft.day}T${draft.time}:00Z`, country.tz)} chez toi)</span>
          ) : null}
        </span>
        <button onClick={onEditWhen} className="inline-flex h-9 items-center font-semibold text-orange-ink underline decoration-2 underline-offset-4">
          Modifier
        </button>
      </p>
      <p className="mt-1 text-[14px] text-ink-3">Chaque barre montre ton temps à l&apos;antenne. Prix de lancement, valables tout décembre.</p>

      <ul className="mt-7 grid gap-3">
        {PACKS.map((p, pi) => (
          <li key={p.id} className="cascade" style={{ ["--i" as string]: pi * 3 }}>
            <PackRow
              pack={p}
              check={checks?.[p.id]}
              selected={draft.packId === p.id}
              euro={!!country?.euro}
              onPick={() => {
                haptic();
                setDraft({ packId: p.id });
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PackRow({ pack, check, selected, euro, onPick }: { pack: Pack; check?: PackCheck; selected: boolean; euro: boolean; onPick: () => void }) {
  const ok = check?.ok ?? false;
  const totalMin = pack.sessions * pack.minutes;
  const hours = totalMin / 60;
  const perHour = Math.round(pack.price / hours / 50) * 50;
  const dark = !!pack.premium;
  const sub = dark ? "text-night-ink-2" : "text-ink-3";
  const extras = EXTRAS[pack.id] ?? [];
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!check || !ok}
      aria-pressed={selected}
      aria-expanded={selected}
      className={cn(
        "group relative block w-full overflow-hidden rounded-3xl p-5 text-left transition-[box-shadow,transform,background-color] duration-300 sm:p-6",
        dark ? "bg-ink text-night-ink" : "bg-card text-ink",
        selected
          ? "shadow-[0_0_0_3px_var(--color-orange),0_24px_48px_-24px_rgb(241_105_3/0.55)]"
          : ok
            ? "shadow-[0_0_0_1px_var(--color-line)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-line-2),0_16px_32px_-20px_rgb(22_18_14/0.35)]"
            : "shadow-[0_0_0_1px_var(--color-line)]",
        !ok && check && "cursor-not-allowed",
      )}
    >
      {dark && <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_15%_0%,rgb(241_105_3/0.3),transparent_70%)]" />}
      <span className={cn("relative block", !ok && check && "opacity-55")}>
        {/* en-tête : nom, accroche, prix */}
        <span className="flex items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[22px] leading-none font-extrabold tracking-[-0.02em] sm:text-[24px]">{pack.name}</span>
              {pack.badge && <Tag tone="orange">{pack.badge}</Tag>}
            </span>
            <span className={cn("mt-1.5 block text-[14.5px] leading-snug", dark ? "text-night-ink-2" : "text-ink-2")}>{pack.tagline}</span>
          </span>
          <span className="shrink-0 text-right">
            {pack.regular && <span className={cn("tabular block text-[13px] line-through decoration-orange decoration-2", sub)}>{fcfa(pack.regular)}</span>}
            <span className="tabular block text-[22px] leading-tight font-extrabold tracking-[-0.02em] sm:text-[24px]">{fcfa(pack.price)}</span>
            {euro && <span className={cn("tabular block text-[12.5px]", sub)}>{eur(pack.price)}</span>}
            {pack.showHourly && <span className={cn("tabular mt-0.5 block text-[12.5px]", sub)}>≈ {fcfa(perHour)} / h</span>}
          </span>
        </span>

        {/* la barre du temps d'antenne, à l'échelle */}
        <span className="mt-5 flex items-center gap-3">
          <span className="flex h-3.5 flex-1 gap-1" aria-hidden>
            <span className="flex h-full gap-1" style={{ width: `${(totalMin / MAX_MIN) * 100}%` }}>
              {Array.from({ length: pack.sessions }, (_, i) => (
                <span key={i} className="air-seg h-full flex-1 rounded-full bg-orange" style={{ ["--i" as string]: i }} />
              ))}
            </span>
            <span className={cn("h-full flex-1 rounded-full", dark ? "bg-white/8" : "bg-paper-2")} />
          </span>
          <span className="tabular w-[96px] shrink-0 text-right text-[13.5px] font-semibold">
            {pack.sessions > 1 ? `${pack.sessions} × ${pack.minutes / 60 === 1.5 ? "1h30" : `${pack.minutes / 60} h`}` : `${String(hours).replace(".5", "h30").replace(/^(\d+)$/, "$1 h")}`}
          </span>
        </span>
        {extras.length > 0 && (
          <span className="mt-2.5 flex flex-wrap gap-1.5">
            {extras.map((x) => (
              <span key={x.label} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold", dark ? "bg-white/10 text-night-ink" : "bg-ink text-paper")}>
                <span aria-hidden>{x.icon}</span>+ {x.label}
              </span>
            ))}
          </span>
        )}

        {check && !ok && (
          <span className={cn("mt-4 flex items-start gap-2 text-[13.5px] font-medium", dark ? "text-night-ink" : "text-ink")}>
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-orange-ink" aria-hidden />
            {check.reason}
          </span>
        )}

        {/* le détail s'ouvre quand on choisit */}
        <span className={cn("grid transition-[grid-template-rows,opacity] duration-400 ease-[var(--ease-out)]", selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <span className="min-h-0 overflow-hidden">
            <span className={cn("mt-5 grid gap-5 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto]", dark ? "border-night-line" : "border-line")}>
              <span className="grid content-start gap-2">
                {pack.includes.map((i) => (
                  <span key={i} className={cn("flex items-start gap-2 text-[14.5px] leading-snug", dark ? "text-night-ink-2" : "text-ink-2")}>
                    <Check className={cn("mt-0.5 size-4 shrink-0", dark ? "text-night-orange" : "text-orange-ink")} strokeWidth={3} aria-hidden />
                    {i}
                  </span>
                ))}
                {check && ok && check.sessions.length > 1 && (
                  <span className="mt-2 block">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                      <Repeat className="size-4 text-orange" aria-hidden /> Tes {check.sessions.length} lives
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {check.sessions.map((s) => (
                        <span key={s.start} className={cn("tabular rounded-full px-2.5 py-1 text-[12.5px] font-semibold", dark ? "bg-white/10" : "bg-orange-soft")}>
                          {formatDay(s.start.slice(0, 10), "short")}, {formatTime(s.start)}
                        </span>
                      ))}
                    </span>
                  </span>
                )}
              </span>
              {pack.image && (
                <img
                  src={`/media/${pack.image.src}-480.webp`}
                  width={800}
                  height={450}
                  loading="lazy"
                  alt={pack.image.alt}
                  className="aspect-[16/10] w-full rounded-2xl object-cover sm:w-[220px]"
                />
              )}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
