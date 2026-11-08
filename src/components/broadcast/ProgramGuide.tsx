"use client";
import { SCHEDULE } from "@/lib/config";
import { daySlots, formatDay, isDayOpen, type Interval } from "@/lib/schedule";
import { cn } from "@/lib/cn";

/* La grille des programmes : la journée du studio, de l'ouverture à la fermeture, en cases. */
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const OPEN = toMin(SCHEDULE.startTimes[0]);
const CLOSE = toMin(SCHEDULE.closeTime);
const SPAN = CLOSE - OPEN;
const isoMin = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const pct = (m: number) => `${(((Math.max(OPEN, Math.min(CLOSE, m)) - OPEN) / SPAN) * 100).toFixed(3)}%`;
const width = (a: number, b: number) => `${(((Math.min(CLOSE, b) - Math.max(OPEN, a)) / SPAN) * 100).toFixed(3)}%`;
const PRIME = toMin(SCHEDULE.primeTimes[0]);

export const GUIDE_HOURS = Array.from({ length: (CLOSE - OPEN) / 120 + 1 }, (_, i) => OPEN / 60 + i * 2);

/** Une journée de la grille. Les cases libres sont cliquables si `onPick` est fourni. */
export function DayTrack({
  day,
  busy,
  now,
  selectedTime,
  onPick,
  highlight,
  highlightLabel,
  dark,
  tall,
  index = 0,
}: {
  day: string;
  busy: Interval[];
  now: Date;
  selectedTime?: string | null;
  onPick?: (time: string) => void;
  highlight?: Interval[];
  highlightLabel?: string;
  dark?: boolean;
  tall?: boolean;
  index?: number;
}) {
  const slots = daySlots(day, busy, now);
  const open = isDayOpen(day);
  const taken = busy.filter((b) => b.start.slice(0, 10) === day);
  const mine = (highlight ?? []).filter((b) => b.start.slice(0, 10) === day);
  return (
    <div className={cn("@container relative w-full", tall ? "h-[64px]" : "h-12")}>
      {/* prime time */}
      <span
        aria-hidden
        className={cn("absolute inset-y-0", dark ? "bg-white/[0.04]" : "bg-orange/[0.07]")}
        style={{ left: pct(PRIME), width: width(PRIME, CLOSE) }}
      />
      {!open && <span className={cn("mono-label absolute inset-0 grid place-items-center", dark ? "text-night-ink-2" : "text-ink-3")}>Relâche</span>}

      {/* déjà à l'antenne (sans le temps d'installation) */}
      {taken.map((b, k) => {
        const a = isoMin(b.start);
        const e = isoMin(b.end) - SCHEDULE.bufferMinutes;
        return (
          <span
            key={b.start}
            style={{ left: pct(a), width: width(a, e), ["--i" as string]: index * 4 + k }}
            className={cn(
              "guide-in hatch absolute inset-y-1 flex items-center overflow-hidden px-2",
              dark ? "bg-white/[0.06] [--hatch:rgb(255_255_255/0.09)]" : "bg-ink/[0.07] [--hatch:rgb(22_18_14/0.12)]",
            )}
          >
            <span className={cn("mono-label hidden truncate text-[9.5px] @2xl:inline", dark ? "text-night-ink-2" : "text-ink-2")}>À l&apos;antenne</span>
          </span>
        );
      })}

      {/* cases libres */}
      {slots
        .filter((s) => s.free)
        .map((s, k) => {
          const a = toMin(s.time);
          const sel = selectedTime === s.time;
          const common = {
            style: { left: pct(a), width: width(a, a + SCHEDULE.baseMinutes), ["--i" as string]: index * 4 + k },
            className: cn(
              "guide-in group absolute inset-y-1 flex flex-col justify-center overflow-hidden px-2 text-left transition-colors duration-150",
              sel
                ? "bg-orange text-ink"
                : dark
                  ? "border border-dashed border-white/20 text-night-ink hover:border-orange hover:bg-orange/15"
                  : "border border-dashed border-ink/25 text-ink hover:border-orange hover:bg-orange/15",
            ),
          };
          const inner = (
            <>
              <span className="mono text-[12px] leading-none font-bold sm:text-[13px]">{s.time.replace(":00", "h")}</span>
              {tall && <span className="mono-label mt-1.5 hidden truncate text-[9.5px] opacity-70 @3xl:block">{sel ? "Ta case" : s.prime ? "Prime" : "Libre"}</span>}
            </>
          );
          return onPick ? (
            <button
              key={s.time}
              type="button"
              {...common}
              aria-pressed={sel}
              aria-label={`${formatDay(day)}, ${s.time} : case libre${s.prime ? ", prime time" : ""}`}
              onClick={() => onPick(s.time)}
            >
              {inner}
            </button>
          ) : (
            <span key={s.time} {...common} aria-hidden>
              {inner}
            </span>
          );
        })}

      {/* ton live */}
      {mine.map((b) => {
        const a = isoMin(b.start);
        const e = isoMin(b.end);
        return (
          <span
            key={`m${b.start}`}
            style={{ left: pct(a), width: width(a, e) }}
            className="air-in absolute inset-y-0 z-10 flex flex-col justify-center overflow-hidden bg-orange px-2.5 text-ink shadow-[0_0_0_2px_var(--color-ink),0_10px_30px_-8px_rgb(241_105_3/0.7)]"
          >
            <span className="mono-label flex items-center gap-1.5 text-[9.5px]">
              <span className="tally tally-on [--t:var(--color-ink)]" /> On air
            </span>
            <span className="mt-1 truncate text-[13px] leading-tight font-extrabold">{highlightLabel}</span>
          </span>
        );
      })}
    </div>
  );
}

/** En-tête d'heures de la grille. */
export function GuideHours({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn("relative h-5", className)} aria-hidden>
      {GUIDE_HOURS.map((h, i) => (
        <span
          key={h}
          className={cn("mono absolute top-0 text-[11px] font-semibold", dark ? "text-night-ink-2" : "text-ink-3", i === GUIDE_HOURS.length - 1 ? "-translate-x-full" : i > 0 && "-translate-x-1/2")}
          style={{ left: pct(h * 60) }}
        >
          {String(h).padStart(2, "0")}h
        </span>
      ))}
    </div>
  );
}
