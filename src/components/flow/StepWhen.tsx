"use client";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Moon, RotateCcw, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { COUNTRIES, getCountry, guessCountry } from "@/lib/countries";
import { SCHEDULE } from "@/lib/config";
import { addMinutes, daySlots, formatDay, formatTime, localDay, monthName, offsetFromStudio, windowDays, type SlotState } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import type { Draft } from "./state";

const WD = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** La lumière de Lomé à chaque heure : l'aube, le plein soleil, le coucher (prime time), la nuit. */
const LIGHT: Record<string, { bg: string; dark?: boolean; icon: React.ReactNode; mood: string }> = {
  "08:00": { bg: "linear-gradient(100deg,#fde7d3,#fbf1e4)", icon: <Sunrise className="size-5" />, mood: "Le matin" },
  "10:00": { bg: "linear-gradient(100deg,#fff1d0,#fff8ea)", icon: <Sun className="size-5" />, mood: "Le matin" },
  "12:00": { bg: "linear-gradient(100deg,#fff6dc,#fffbf2)", icon: <Sun className="size-5" />, mood: "Midi" },
  "14:00": { bg: "linear-gradient(100deg,#ffeab8,#fff4dc)", icon: <Sun className="size-5" />, mood: "L'après-midi" },
  "16:00": { bg: "linear-gradient(100deg,#ffd38f,#ffe7bf)", icon: <Sun className="size-5" />, mood: "L'après-midi" },
  "18:00": { bg: "linear-gradient(100deg,#ff9a4a,#ffc285)", icon: <Sunset className="size-5" />, mood: "Le coucher du soleil" },
  "20:00": { bg: "linear-gradient(100deg,#231a33,#3b2a4a)", dark: true, icon: <Moon className="size-5" />, mood: "La soirée" },
};

export function StepWhen({
  draft,
  setDraft,
  avail,
  availError,
  onRetry,
}: {
  draft: Draft;
  setDraft: (p: Partial<Draft>) => void;
  avail: Availability | null;
  availError: boolean;
  onRetry: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => windowDays(), []);
  const now = useMemo(() => (avail ? new Date(avail.now) : null), [avail]);
  const byDay = useMemo(
    () => (avail && now ? Object.fromEntries(days.map((d) => [d, daySlots(d, avail.busy, now)])) : null),
    [avail, now, days],
  );
  const country = draft.mode === "remote" ? getCountry(draft.country) : getCountry("TG");

  // À distance : on devine le pays depuis le fuseau du téléphone (modifiable).
  useEffect(() => {
    if (draft.mode === "remote" && !draft.country) {
      const g = guessCountry();
      if (g) setDraft({ country: g.code, displayDial: draft.displayLocal ? draft.displayDial : g.dial, contactDial: draft.contactLocal ? draft.contactDial : g.dial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.mode]);

  // Si le créneau choisi n'est plus libre (rafraîchissement), on le désélectionne.
  useEffect(() => {
    if (!byDay || !draft.day || !draft.time) return;
    const s = byDay[draft.day]?.find((x) => x.time === draft.time);
    if (s && !s.free) setDraft({ time: null, packId: null });
  }, [byDay, draft.day, draft.time, setDraft]);

  // Le jour choisi (ou le premier jour libre) est amené au centre de la bande.
  useEffect(() => {
    if (!byDay) return;
    const target = draft.day ?? days.find((d) => byDay[d]?.some((s) => s.free));
    const el = target ? strip.current?.querySelector<HTMLElement>(`[data-day="${target}"]`) : null;
    if (el && strip.current) strip.current.scrollLeft = el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!byDay]);

  const offset = draft.day && country ? offsetFromStudio(country.tz, `${draft.day}T12:00:00Z`) : 0;
  const nudge = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div>
      {draft.mode === "remote" && (
        <div className="mb-8 max-w-[520px]">
          <label htmlFor="country" className="text-[15px] font-semibold">
            Tu seras où pendant ton live&nbsp;?
          </label>
          <div className="edge chamfer-sm relative mt-2 [--edge:var(--color-line-2)] focus-within:[--edge-w:2px] focus-within:[--edge:var(--color-orange)]">
            <select
              id="country"
              value={draft.country ?? ""}
              onChange={(e) => {
                const c = getCountry(e.target.value);
                setDraft({
                  country: e.target.value,
                  ...(c && !draft.displayLocal ? { displayDial: c.dial } : {}),
                  ...(c && !draft.contactLocal ? { contactDial: c.dial } : {}),
                });
              }}
              className="block h-14 w-full appearance-none bg-transparent pr-12 pl-4 text-[16px] font-semibold outline-none"
            >
              <option value="" disabled>
                Choisis ton pays
              </option>
              <optgroup label="Afrique">
                {COUNTRIES.filter((c) => c.tz.startsWith("Africa")).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Diaspora">
                {COUNTRIES.filter((c) => !c.tz.startsWith("Africa")).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
          </div>
          <p className="mt-2 text-[13.5px] text-ink-3">
            {country && country.tz !== "Africa/Lome" ? `On t'affiche les heures de ${country.city} et celles du studio à Lomé.` : "Les heures affichées sont celles de Lomé (GMT)."}
          </p>
        </div>
      )}

      {/* ───── La bande des jours ───── */}
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[20px] font-bold tracking-[-0.015em] capitalize sm:text-[22px]">
          {monthName(days[0])} {days[0].slice(0, 4)}
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={() => nudge(-1)} aria-label="Jours précédents" className="grid size-10 place-items-center rounded-full ring-1 ring-line-2 transition-colors hover:bg-card hover:ring-ink">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" onClick={() => nudge(1)} aria-label="Jours suivants" className="grid size-10 place-items-center rounded-full ring-1 ring-line-2 transition-colors hover:bg-card hover:ring-ink">
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {availError && !avail ? (
        <div className="mt-6 flex items-center justify-between gap-4 border-l-4 border-danger bg-danger-soft px-4 py-3 text-[14.5px] text-ink">
          Impossible de charger le planning. Vérifie ta connexion.
          <button onClick={onRetry} className="inline-flex h-10 items-center gap-1.5 font-semibold text-danger">
            <RotateCcw className="size-4" /> Réessayer
          </button>
        </div>
      ) : null}

      <div
        ref={strip}
        role="group"
        aria-label={`Jours de ${monthName(days[0])}`}
        className="day-strip -mx-4 mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 pt-1 pb-4 sm:-mx-8 sm:px-8"
      >
        {days.map((d, di) => {
          const slots = byDay?.[d];
          const freeN = slots?.filter((s) => s.free).length ?? 0;
          const full = !!slots && freeN === 0;
          const sel = draft.day === d;
          const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
          return (
            <button
              key={d}
              data-day={d}
              type="button"
              aria-pressed={sel}
              disabled={!slots || full}
              aria-label={`${formatDay(d)} : ${slots ? (full ? "complet" : `${freeN} créneau${freeN > 1 ? "x" : ""} libre${freeN > 1 ? "s" : ""}`) : "chargement"}`}
              onClick={() => {
                haptic();
                setDraft({ day: d, time: draft.day === d ? draft.time : null, packId: draft.day === d ? draft.packId : null });
                requestAnimationFrame(() => {
                  const el = slotsRef.current;
                  if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) window.scrollBy({ top: el.getBoundingClientRect().top - 120, behavior: "smooth" });
                });
              }}
              style={{ ["--i" as string]: di }}
              className={cn(
                "cascade relative flex w-[64px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl pt-2.5 pb-3 transition-[background-color,transform,box-shadow] duration-200 sm:w-[72px]",
                sel
                  ? "bg-ink text-paper shadow-[0_14px_28px_-14px_rgb(22_18_14/0.7)]"
                  : full
                    ? "text-ink-3/50"
                    : "bg-card text-ink ring-1 ring-line hover:-translate-y-0.5 hover:ring-ink/30",
                (wd === 0 || wd === 6) && !sel && !full && "bg-orange-soft/60",
                !slots && "animate-pulse",
              )}
            >
              <span className={cn("text-[12.5px] font-semibold", sel ? "text-paper/70" : "text-ink-3")}>{WD[wd]}</span>
              <span className={cn("tabular text-[24px] leading-none font-bold tracking-[-0.03em]", full && "line-through decoration-1")}>{Number(d.slice(8, 10))}</span>
              {/* la jauge : la part de la journée encore libre */}
              <span className={cn("mt-1 h-1 w-8 overflow-hidden rounded-full", sel ? "bg-paper/20" : "bg-line")} aria-hidden>
                <span className={cn("block h-full rounded-full", sel ? "bg-orange" : freeN <= 2 ? "bg-live" : "bg-ok")} style={{ width: `${slots ? (freeN / slots.length) * 100 : 0}%` }} />
              </span>
            </button>
          );
        })}
      </div>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-5 rounded-full bg-ok" aria-hidden /> beaucoup de place
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-2 rounded-full bg-live" aria-hidden /> presque complet
        </span>
      </p>

      {/* ───── La journée, heure par heure, dans la lumière de Lomé ───── */}
      <div ref={slotsRef} className="mt-10 scroll-mt-24">
        {draft.day && byDay ? (
          <div key={draft.day} className="animate-rise mx-auto max-w-3xl">
            <h2 className="display text-[30px] first-letter:uppercase sm:text-[40px]">{formatDay(draft.day)}</h2>
            <p className="mt-1.5 text-[14.5px] text-ink-3">Lives de 1h30. Le soir, quand le soleil se couche, c&apos;est l&apos;heure où on regarde le plus.</p>
            <ul className="mt-6 grid gap-2">
              {byDay[draft.day].map((s, si) => (
                <li key={s.time} className="cascade" style={{ ["--i" as string]: si * 2 }}>
                  <DaylightSlot
                    s={s}
                    selected={draft.time === s.time}
                    tz={country && offset !== 0 ? country.tz : null}
                    onPick={() => {
                      haptic();
                      setDraft({ time: s.time, packId: null });
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl place-items-center rounded-3xl border-2 border-dashed border-line-2 px-6 py-14 text-center">
            <p className="text-[18px] font-semibold">Choisis un jour</p>
            <p className="mt-1 text-[14.5px] text-ink-3">Ta journée s&apos;affiche ici, heure par heure.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DaylightSlot({ s, selected, tz, onPick }: { s: SlotState; selected: boolean; tz: string | null; onPick: () => void }) {
  const L = LIGHT[s.time] ?? LIGHT["12:00"];
  const end = addMinutes(s.start, SCHEDULE.baseMinutes);
  const off = !s.free;
  const dayShift = tz && localDay(s.start, tz) !== s.start.slice(0, 10);
  const dark = L.dark;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={off}
      onClick={onPick}
      style={{ background: L.bg }}
      className={cn(
        "group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-4 py-4 text-left transition-[transform,box-shadow] duration-200 sm:gap-5 sm:px-6",
        dark ? "text-white" : "text-ink",
        selected ? "scale-[1.015] shadow-[0_0_0_3px_var(--color-ink),0_18px_36px_-18px_rgb(22_18_14/0.6)]" : !off && "hover:scale-[1.008] hover:shadow-[0_0_0_2px_rgb(22_18_14/0.25)]",
        off && "cursor-not-allowed",
      )}
    >
      {off && <span aria-hidden className={cn("hatch absolute inset-0", dark ? "bg-black/40 [--hatch:rgb(255_255_255/0.12)]" : "bg-white/55 [--hatch:rgb(22_18_14/0.1)]")} />}
      <span className={cn("relative grid size-10 shrink-0 place-items-center rounded-full", dark ? "bg-white/10 text-[#ffd59a]" : "bg-white/60 text-orange-ink", off && "opacity-50")} aria-hidden>
        {L.icon}
      </span>
      <span className={cn("relative min-w-0 flex-1", off && "opacity-50")}>
        <span className="tabular flex items-baseline gap-2 text-[24px] leading-none font-bold tracking-[-0.02em] sm:text-[28px]">
          {tz ? formatTime(s.start, tz) : s.time}
          <span className={cn("text-[14px] font-semibold", dark ? "text-white/65" : "text-ink-3")}>
            → {tz ? formatTime(end, tz) : formatTime(end)}
            {dayShift ? " (+1 j)" : ""}
          </span>
        </span>
        <span className={cn("mt-1 block text-[13.5px]", dark ? "text-white/70" : "text-ink-2")}>
          {tz ? `${s.time} à Lomé · ` : ""}
          {L.mood}
        </span>
      </span>
      <span className="relative shrink-0 text-right">
        {selected ? (
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold", dark ? "bg-white text-ink" : "bg-ink text-paper")}>
            <Check className="size-4" strokeWidth={3} aria-hidden /> Ton créneau
          </span>
        ) : off ? (
          <span className={cn("text-[13px] font-semibold", dark ? "text-white/70" : "text-ink-3")}>{s.reason === "taken" ? "Réservé" : s.reason === "lead" ? "Trop tard" : "Fermé"}</span>
        ) : s.prime ? (
          <span className={cn("rounded-full px-3 py-1.5 text-[13px] font-bold", dark ? "bg-[#ffd59a] text-ink" : "bg-ink text-paper")}>Prime time</span>
        ) : (
          <span className="text-[13px] font-semibold opacity-70">Libre</span>
        )}
      </span>
    </button>
  );
}
