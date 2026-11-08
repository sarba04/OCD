"use client";
import { ChevronDown, Flame, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { COUNTRIES, getCountry, guessCountry } from "@/lib/countries";
import { SCHEDULE } from "@/lib/config";
import { addMinutes, daySlots, formatDay, formatTime, localDay, offsetFromStudio, windowDays, monthName, type SlotState } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { ChoiceCard, Tag, haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import type { Draft } from "./state";

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const WEEK_FULL = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

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

  const offset = draft.day && country ? offsetFromStudio(country.tz, `${draft.day}T12:00:00Z`) : 0;
  const lead = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        {draft.mode === "remote" && (
          <div className="mb-7">
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
              {country && country.tz !== "Africa/Lome"
                ? `On t'affiche les heures de ${country.city} et celles du studio à Lomé.`
                : "Les heures affichées sont celles de Lomé (GMT)."}
            </p>
          </div>
        )}

        {/* ───── Calendrier ───── */}
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-[30px] capitalize sm:text-[36px]">
            {monthName(days[0])} <span className="font-semibold text-ink-3">{days[0].slice(0, 4)}</span>
          </h2>
          <Legend />
        </div>

        {availError && !avail ? (
          <div className="mt-6 flex items-center justify-between gap-4 border-l-4 border-danger bg-danger-soft px-4 py-3 text-[14.5px] text-ink">
            Impossible de charger le planning. Vérifie ta connexion.
            <button onClick={onRetry} className="inline-flex h-10 items-center gap-1.5 font-semibold text-danger">
              <RotateCcw className="size-4" /> Réessayer
            </button>
          </div>
        ) : null}

        <div role="grid" aria-label={`Calendrier de ${monthName(days[0])}`} className="mt-5">
          <div role="row" className="grid grid-cols-7 gap-1 pb-2">
            {WEEK.map((w, i) => (
              <span role="columnheader" aria-label={WEEK_FULL[i]} key={i} className="text-center text-[12px] font-semibold text-ink-3">
                {w}
              </span>
            ))}
          </div>
          <div role="row" className="grid grid-cols-7 gap-1">
            {Array.from({ length: lead }, (_, i) => (
              <span key={`e${i}`} aria-hidden />
            ))}
            {days.map((d) => {
              const slots = byDay?.[d];
              const freeN = slots?.filter((s) => s.free).length ?? 0;
              const full = !!slots && freeN === 0;
              const sel = draft.day === d;
              return (
                <button
                  key={d}
                  role="gridcell"
                  aria-selected={sel}
                  disabled={!slots || full}
                  aria-label={`${Number(d.slice(8, 10))} décembre, ${formatDay(d).split(" ")[0]} : ${slots ? (full ? "complet" : `${freeN} créneau${freeN > 1 ? "x" : ""} libre${freeN > 1 ? "s" : ""}`) : "chargement"}`}
                  onClick={() => {
                    haptic();
                    setDraft({ day: d, time: draft.day === d ? draft.time : null, packId: draft.day === d ? draft.packId : null });
                    requestAnimationFrame(() => {
                      const el = slotsRef.current;
                      if (el && window.innerWidth < 1024) {
                        const top = el.getBoundingClientRect().top;
                        if (top > window.innerHeight * 0.55) window.scrollBy({ top: top - 90, behavior: "smooth" });
                      }
                    });
                  }}
                  className={cn(
                    "relative flex aspect-[4/5] min-h-12 flex-col items-center justify-center gap-1.5 transition-[transform,background-color] duration-150 active:scale-95 sm:aspect-square",
                    sel ? "chamfer-sm bg-orange text-ink" : full ? "text-ink-3/60" : "chamfer-sm bg-card text-ink hover:bg-orange-soft",
                    !slots && "animate-pulse",
                  )}
                >
                  <span className={cn("tabular text-[17px] leading-none font-bold sm:text-[19px]", full && "line-through decoration-1")}>
                    {Number(d.slice(8, 10))}
                  </span>
                  {slots && !full && <Ticks slots={slots} selected={sel} />}
                  {full && <span className="text-[10.5px] font-semibold">complet</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───── Créneaux du jour ───── */}
      <div ref={slotsRef} className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
        {draft.day && byDay ? (
          <div key={draft.day} className="animate-rise">
            <h2 className="text-[22px] font-bold tracking-[-0.015em] first-letter:uppercase sm:text-[24px]">{formatDay(draft.day)}</h2>
            <p className="mt-1 text-[14px] text-ink-3">
              Lives de 1h30, avec {SCHEDULE.bufferMinutes} min d&apos;installation entre deux lives.
            </p>
            <ul className="mt-4 grid gap-2">
              {byDay[draft.day].map((s) => (
                <li key={s.time}>
                  <SlotRow
                    s={s}
                    selected={draft.time === s.time}
                    tz={country && offset !== 0 ? country.tz : null}
                    city={country?.city}
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
          <div className="hidden h-full min-h-64 flex-col justify-center border-2 border-dashed border-line-2 p-8 text-center lg:flex">
            <p className="text-[17px] font-semibold">Choisis un jour</p>
            <p className="mt-1 text-[14.5px] text-ink-3">Les créneaux libres s&apos;affichent ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** 7 petits traits sous chaque jour : un par créneau, plein = déjà pris. */
function Ticks({ slots, selected }: { slots: SlotState[]; selected: boolean }) {
  return (
    <span className="flex gap-[2px]" aria-hidden>
      {slots.map((s) => (
        <span
          key={s.time}
          className={cn(
            "h-[3px] w-[3px] rounded-full sm:w-1",
            s.free ? (selected ? "bg-ink/25" : "bg-line-2") : selected ? "bg-ink" : s.reason === "taken" ? "bg-orange" : "bg-transparent",
          )}
        />
      ))}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 pb-1.5 text-[12px] text-ink-3" aria-hidden>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-line-2" /> libre
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-orange" /> pris
      </span>
    </div>
  );
}

function SlotRow({ s, selected, tz, city, onPick }: { s: SlotState; selected: boolean; tz: string | null; city?: string; onPick: () => void }) {
  const end = addMinutes(s.start, SCHEDULE.baseMinutes);
  const unavailable = !s.free;
  const localStart = tz ? formatTime(s.start, tz) : null;
  const dayShift = tz && localDay(s.start, tz) !== s.start.slice(0, 10);
  return (
    <ChoiceCard
      cut="sm"
      selected={selected}
      disabled={unavailable}
      onClick={onPick}
      aria-pressed={selected}
      className={cn("px-4 py-3.5", unavailable && "[--surface:var(--color-paper-2)]")}
    >
      <span className="flex items-center gap-4">
        <span className={cn("min-w-0 flex-1", unavailable && "opacity-55")}>
          {tz ? (
            <>
              <span className="tabular flex items-baseline gap-2 text-[22px] leading-none font-bold">
                {localStart}
                <span className="text-[14px] font-semibold text-ink-3">
                  – {formatTime(end, tz)} chez toi{dayShift ? " (+1 j)" : ""}
                </span>
              </span>
              <span className="tabular mt-1.5 block text-[13.5px] text-ink-3">
                {s.time}–{formatTime(end)} à Lomé
              </span>
            </>
          ) : (
            <span className="tabular flex items-baseline gap-2 text-[22px] leading-none font-bold">
              {s.time}
              <span className="text-[14px] font-semibold text-ink-3">– {formatTime(end)}</span>
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {unavailable ? (
            <span className="text-[13px] font-semibold text-ink-3">{s.reason === "taken" ? "Réservé" : s.reason === "lead" ? "Trop tard" : "Fermé"}</span>
          ) : s.prime ? (
            <Tag tone={selected ? "ink" : "orange"}>
              <Flame className="size-3.5" strokeWidth={2.6} aria-hidden /> Prime time
            </Tag>
          ) : (
            <span className="text-[13px] font-semibold text-ok">Libre</span>
          )}
        </span>
      </span>
    </ChoiceCard>
  );
}
