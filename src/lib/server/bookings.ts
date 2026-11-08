import "server-only";
import { getPack, PAYMENT_METHODS, SCHEDULE, CATEGORIES } from "../config";
import { getCountry } from "../countries";
import { addMinutes, checkPack, formatDay, isDayOpen, windowDays, type Interval } from "../schedule";
import type { Booking, BookingInput, PublicBooking } from "../types";
import { validateBusiness, type FieldErrors } from "../validate";
import { ConflictError, getStore } from "./store";

export class InputError extends Error {
  constructor(
    message: string,
    public errors: FieldErrors = {},
  ) {
    super(message);
  }
}

export interface Alternative {
  day: string;
  time: string;
  label: string;
}

const RANGE = () => ({ from: `${SCHEDULE.windowStart}T00:00:00.000Z`, to: `${addDaysISO(SCHEDULE.windowEnd, 1)}` });
const addDaysISO = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
};

export async function getBusy(): Promise<Interval[]> {
  const store = await getStore();
  const { from, to } = RANGE();
  // un pack hebdomadaire peut déborder : on prend une marge de 5 semaines
  return store.listBusy(from, addDaysISO(to.slice(0, 10), 35));
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeRef(day: string, time: string) {
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(3)), (n) => ALPHABET[n % ALPHABET.length]).join("");
  return `OCD-${day.slice(8, 10)}${day.slice(5, 7)}-${time.replace(":", "")}-${rnd}`;
}

const clean = (s: unknown, max = 200) => (typeof s === "string" ? s.trim().slice(0, max) : "");

/** Créneaux libres les plus proches pour ce pack (même jour d'abord, puis les jours suivants / précédents). */
export function alternatives(packId: string, day: string, time: string, busy: Interval[], now: Date, limit = 4): Alternative[] {
  const pack = getPack(packId);
  if (!pack) return [];
  const days = windowDays();
  const idx = Math.max(0, days.indexOf(day));
  const order = [idx, ...days.flatMap((_, i) => [idx + i + 1, idx - i - 1])].filter((i, k, a) => i >= 0 && i < days.length && a.indexOf(i) === k);
  const out: Alternative[] = [];
  for (const i of order) {
    const d = days[i];
    const times = [...SCHEDULE.startTimes].sort(
      (a, b) => Math.abs(toMin(a) - toMin(time)) - Math.abs(toMin(b) - toMin(time)),
    );
    for (const t of times) {
      if (d === day && t === time) continue;
      if (checkPack(pack, d, t, busy, now).ok) out.push({ day: d, time: t, label: `${formatDay(d, "short")} · ${t}` });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export async function createBooking(raw: BookingInput, now = new Date()): Promise<Booking> {
  if (raw.website) throw new InputError("Requête refusée.");
  const mode = raw.mode === "remote" ? "remote" : raw.mode === "studio" ? "studio" : null;
  if (!mode) throw new InputError("Choisis ton format de live.");
  const country = getCountry(mode === "studio" ? "TG" : raw.country);
  if (!country) throw new InputError("Indique depuis quel pays tu feras ton live.");
  const pack = getPack(raw.packId);
  if (!pack) throw new InputError("Choisis un pack.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.day) || !isDayOpen(raw.day)) throw new InputError("Ce jour n'est pas ouvert à la réservation.");
  if (!(SCHEDULE.startTimes as readonly string[]).includes(raw.time)) throw new InputError("Cette heure n'existe pas.");
  const pay = PAYMENT_METHODS.find((p) => p.id === raw.paymentMethod && (p.modes as readonly string[]).includes(mode));
  if (!pay) throw new InputError("Choisis un moyen de paiement.");

  const business = {
    name: clean(raw.business?.name, 60),
    category: (CATEGORIES as readonly string[]).includes(raw.business?.category) ? raw.business.category : "",
    pitch: clean(raw.business?.pitch, 160),
    priceHint: clean(raw.business?.priceHint, 60),
    displayPhone: clean(raw.business?.displayPhone, 24),
    address: clean(raw.business?.address, 120),
    delivers: !!raw.business?.delivers,
    social: clean(raw.business?.social, 80),
  };
  const contact = {
    fullName: clean(raw.contact?.fullName, 80),
    phone: clean(raw.contact?.phone, 24),
    email: clean(raw.contact?.email, 120).toLowerCase(),
  };
  const errors = validateBusiness(business, contact, { image: !!raw.consentImage, rules: !!raw.consentRules });
  if (Object.keys(errors).length) throw new InputError("Certaines informations sont à corriger.", errors);

  let photo: string | null = null;
  if (raw.photo) {
    if (!/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(raw.photo) || raw.photo.length > 700_000)
      throw new InputError("La photo n'a pas pu être lue. Essaie une autre image.");
    photo = raw.photo;
  }

  const busy = await getBusy();
  const check = checkPack(pack, raw.day, raw.time, busy, now);
  if (!check.ok) {
    const taken = check.reason?.includes("pris") || check.reason?.includes("libre");
    if (taken) throw new ConflictError(check.reason);
    throw new InputError(check.reason || "Ce créneau n'est pas disponible pour ce pack.");
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    ref: makeRef(raw.day, raw.time),
    createdAt: now.toISOString(),
    status: "pending",
    mode,
    country: country.code,
    timezone: country.tz,
    packId: pack.id,
    packName: pack.name,
    price: pack.price,
    sessions: check.sessions,
    business,
    contact,
    paymentMethod: pay.id,
    photo,
  };
  const store = await getStore();
  const slots = check.sessions.map((s) => ({ start: s.start, end: addMinutes(s.end, SCHEDULE.bufferMinutes) }));
  return store.createBooking(booking, slots);
}

export const toPublic = ({ photo: _p, demo: _d, ...b }: Booking): PublicBooking => b;
