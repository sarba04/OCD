import { SCHEDULE, STUDIO_TZ, type Pack } from "./config";

/** Intervalle ISO (UTC). Pour les créneaux occupés, `end` inclut déjà le temps d'installation. */
export interface Interval {
  start: string;
  end: string;
}

const MIN = 60_000;

export const addMinutes = (iso: string, m: number) => new Date(new Date(iso).getTime() + m * MIN).toISOString();
export const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Lomé = UTC : « 2026-12-01 » + « 10:00 » → 2026-12-01T10:00:00.000Z */
export const toISO = (day: string, time: string) => new Date(`${day}T${time}:00Z`).toISOString();

export function windowDays(): string[] {
  const out: string[] = [];
  for (let d: string = SCHEDULE.windowStart; d <= SCHEDULE.windowEnd; d = addDays(d, 1)) out.push(d);
  return out;
}

export const weekday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();

export function isDayOpen(day: string) {
  if (day < SCHEDULE.windowStart || day > SCHEDULE.windowEnd) return false;
  if ((SCHEDULE.closedDates as readonly string[]).includes(day)) return false;
  if ((SCHEDULE.closedWeekdays as readonly number[]).includes(weekday(day))) return false;
  return true;
}

export const isPrime = (time: string) => (SCHEDULE.primeTimes as readonly string[]).includes(time);

const overlaps = (aStart: number, aEnd: number, b: Interval) =>
  aStart < new Date(b.end).getTime() && new Date(b.start).getTime() < aEnd;

/** Le créneau [start, start + durée + installation) est-il libre ? */
export function isFree(busy: Interval[], startISO: string, minutes: number) {
  const s = new Date(startISO).getTime();
  const e = s + (minutes + SCHEDULE.bufferMinutes) * MIN;
  return !busy.some((b) => overlaps(s, e, b));
}

export function fitsBeforeClose(day: string, time: string, minutes: number) {
  return new Date(addMinutes(toISO(day, time), minutes)).getTime() <= new Date(toISO(day, SCHEDULE.closeTime)).getTime();
}

export function leadOk(startISO: string, now: Date, leadHours: number = SCHEDULE.minLeadHours) {
  return new Date(startISO).getTime() - now.getTime() >= leadHours * 60 * MIN;
}

export interface SlotState {
  time: string;
  start: string;
  end: string;
  free: boolean;
  prime: boolean;
  /** Raison si indisponible. */
  reason?: "taken" | "lead" | "closed";
}

/** États des créneaux standards (1h30) d'une journée. */
export function daySlots(day: string, busy: Interval[], now: Date): SlotState[] {
  const open = isDayOpen(day);
  return SCHEDULE.startTimes.map((time) => {
    const start = toISO(day, time);
    const end = addMinutes(start, SCHEDULE.baseMinutes);
    let reason: SlotState["reason"];
    if (!open) reason = "closed";
    else if (!leadOk(start, now)) reason = "lead";
    else if (!isFree(busy, start, SCHEDULE.baseMinutes)) reason = "taken";
    return { time, start, end, free: !reason, prime: isPrime(time), reason };
  });
}

/** Les dates/heures de chaque live d'un pack, à partir du premier créneau choisi. */
export function packSessions(pack: Pack, day: string, time: string): Interval[] {
  const days =
    pack.pattern === "consecutive"
      ? Array.from({ length: pack.sessions }, (_, i) => addDays(day, i))
      : pack.pattern === "weekly"
        ? Array.from({ length: pack.sessions }, (_, i) => addDays(day, i * 7))
        : [day];
  return days.map((d) => {
    const start = toISO(d, time);
    return { start, end: addMinutes(start, pack.minutes) };
  });
}

export interface PackCheck {
  ok: boolean;
  sessions: Interval[];
  reason?: string;
}

/** Le pack peut-il démarrer à ce créneau ? Renvoie une raison lisible sinon. */
export function checkPack(pack: Pack, day: string, time: string, busy: Interval[], now: Date): PackCheck {
  const sessions = packSessions(pack, day, time);
  if (!fitsBeforeClose(day, time, pack.minutes)) {
    const latest = SCHEDULE.startTimes.filter((t) => fitsBeforeClose(day, t, pack.minutes)).pop();
    return {
      ok: false,
      sessions,
      reason: `Un live de ${hm(pack.minutes)} doit commencer au plus tard à ${latest}.`,
    };
  }
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const d = s.start.slice(0, 10);
    if (!isDayOpen(d)) {
      return {
        ok: false,
        sessions,
        reason:
          sessions.length > 1
            ? `Ton ${ordinal(i + 1)} live tomberait le ${formatDay(d, "short")}, hors période d'ouverture.`
            : "Ce jour est fermé.",
      };
    }
    if (!isFree(busy, s.start, pack.minutes)) {
      return {
        ok: false,
        sessions,
        reason:
          sessions.length > 1
            ? `Le ${formatDay(d, "short")} à ${time} est déjà pris.`
            : `La plage ${time}–${formatTime(addMinutes(s.start, pack.minutes))} n'est pas entièrement libre.`,
      };
    }
  }
  const lead = Math.max(pack.minLeadHours ?? 0, SCHEDULE.minLeadHours);
  if (!leadOk(sessions[0].start, now, lead)) {
    return {
      ok: false,
      sessions,
      reason: `Ce pack se réserve au moins ${Math.round(lead / 24) || 1} jour${lead >= 48 ? "s" : ""} à l'avance.`,
    };
  }
  return { ok: true, sessions };
}

/** Nombre de créneaux standards encore libres sur toute la période. */
export function freeSlotCount(busy: Interval[], now: Date) {
  return windowDays().reduce((n, d) => n + daySlots(d, busy, now).filter((s) => s.free).length, 0);
}

/* ───────────── Formatage (français, heure de Lomé par défaut) ───────────── */

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const DAYS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dayNum = (n: number) => (n === 1 ? "1er" : String(n));

/** « mardi 1er décembre » / « mar. 1er déc. » */
export function formatDay(day: string, style: "long" | "short" = "long") {
  const d = new Date(`${day}T12:00:00Z`);
  const wd = d.getUTCDay();
  const m = d.getUTCMonth();
  return style === "long"
    ? `${DAYS[wd]} ${dayNum(d.getUTCDate())} ${MONTHS[m]}`
    : `${DAYS_SHORT[wd]} ${dayNum(d.getUTCDate())} ${MONTHS_SHORT[m]}`;
}

export const monthName = (day: string) => MONTHS[new Date(`${day}T12:00:00Z`).getUTCMonth()];

/** « 10:00 » dans le fuseau demandé (Lomé par défaut). */
export function formatTime(iso: string, tz: string = STUDIO_TZ) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));
}

/** Jour local (AAAA-MM-JJ) d'un instant dans un fuseau. */
export function localDay(iso: string, tz: string) {
  const p = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz }).format(
    new Date(iso),
  );
  return p;
}

/** Décalage d'un fuseau par rapport à Lomé, en heures (ex : Douala → +1). */
export function offsetFromStudio(tz: string, iso: string) {
  const fmt = (z: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: z,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(iso));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));
  };
  return Math.round((fmt(tz) - fmt(STUDIO_TZ)) / 3_600_000);
}

/** « 1h30 », « 4 h » */
export function hm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h} h`;
}
