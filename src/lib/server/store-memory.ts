import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PACKS, SCHEDULE } from "../config";
import { getCountry } from "../countries";
import { prettyPhone } from "../format";
import { addMinutes, isFree, packSessions, windowDays, type Interval } from "../schedule";
import type { Booking } from "../types";
import { sessionState, type LiveEntry, type Seller } from "../lives";
import { ConflictError, type Application, type Store } from "./store";

/**
 * Mode démo : aucune base de données configurée.
 * Les données vivent en mémoire (+ copie dans le dossier temporaire) et le planning est pré-rempli
 * avec des réservations fictives, marquées « démo », pour que le calendrier ait l'air vivant.
 */
const FILE = join(tmpdir(), "ocd-live-demo.json");

interface Data {
  bookings: Booking[];
  applications: Application[];
  lives?: LiveEntry[];
  sellers?: Seller[];
  photos?: Record<string, string>;
}

function load(): Data | null {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Data;
  } catch {
    return null;
  }
}

function save(d: Data) {
  try {
    writeFileSync(FILE, JSON.stringify(d));
  } catch {
    /* lecture seule : tant pis, on reste en mémoire */
  }
}

const slotsOf = (b: Booking): Interval[] =>
  b.status === "cancelled" ? [] : b.sessions.map((s) => ({ start: s.start, end: addMinutes(s.end, SCHEDULE.bufferMinutes) }));

const overlap = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/* ───────────── Données de démonstration ───────────── */

const SELLERS: [string, string, string, string, string, string][] = [
  // nom, business, catégorie, pitch, adresse, pays
  ["Afi Mensah", "Afi Wax Couture", "Pagnes & wax", "Robes et ensembles en wax cousus main, du 36 au 52", "Bè-Kpota, Lomé", "TG"],
  ["Kossi Agbéko", "Jus Sika", "Food & boissons", "Jus de bissap, gingembre et baobab sans sucre ajouté", "Adidogomé, Lomé", "TG"],
  ["Mireille Ngo Bassa", "Mimi Hair", "Cheveux & perruques", "Perruques naturelles et tissages brésiliens", "Akwa, Douala", "CM"],
  ["Yao Kodjo", "KJ Phones", "Tech & téléphones", "Téléphones reconditionnés garantis 6 mois", "Grand Marché, Lomé", "TG"],
  ["Aïcha Traoré", "Karité d'Or", "Beauté", "Beurre de karité pur et savons noirs artisanaux", "Hamdallaye, Bamako", "ML"],
  ["Edem Akakpo", "Edem Déco", "Maison & déco", "Coussins, nappes et tableaux en tissu kente", "Tokoin, Lomé", "TG"],
  ["Grâce Nzinga", "Nzinga Bijoux", "Bijoux & accessoires", "Bijoux en perles et laiton faits à la main", "Gombe, Kinshasa", "CD"],
  ["Ablavi Dossou", "Les Délices d'Abla", "Food & boissons", "Plats togolais sur commande : ademe, fufu, gboma", "Agoè, Lomé", "TG"],
  ["Mahamat Saleh", "Sahel Cuirs", "Artisanat", "Sacs et sandales en cuir tanné à N'Djamena", "Moursal, N'Djamena", "TD"],
  ["Esther Kouassi", "Glow by Esther", "Beauté", "Soins visage et gommages naturels", "Cocody, Abidjan", "CI"],
  ["Komi Lawson", "Lawson Farm", "Produits locaux", "Miel, gari et huile rouge directement de la ferme", "Kpalimé", "TG"],
  ["Sandrine Mbappé", "SM Fashion", "Mode", "Prêt-à-porter femme, arrivages chaque semaine", "Bastos, Yaoundé", "CM"],
];

function seed(): Data {
  const bookings: Booking[] = [];
  const busy: Interval[] = [];
  let r = 7;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const days = windowDays();
  let i = 0;
  for (const day of days) {
    const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
    // plus de monde le week-end et le soir
    const count = wd === 6 || wd === 0 ? 3 : wd === 5 ? 2 : rand() < 0.55 ? 1 : 0;
    // ordre aléatoire, avec une préférence (pas une obligation) pour le soir
    const times = [...SCHEDULE.startTimes]
      .map((t) => ({ t, w: rand() + (t >= "18:00" ? 0.3 : 0) }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.t);
    let placed = 0;
    for (const time of times) {
      if (placed >= count) break;
      const pack = PACKS[[0, 0, 0, 2, 2, 1, 3, 4][Math.floor(rand() * 8)]];
      const sessions = packSessions(pack, day, time);
      const slots = sessions.map((s) => ({ start: s.start, end: addMinutes(s.end, SCHEDULE.bufferMinutes) }));
      if (sessions.some((s) => s.start.slice(0, 10) > SCHEDULE.windowEnd)) continue;
      if (time > "18:00" && pack.minutes > 90) continue;
      if (!sessions.every((s) => isFree(busy, s.start, pack.minutes))) continue;
      const [fullName, name, category, pitch, address, country] = SELLERS[i % SELLERS.length];
      const c = getCountry(country)!;
      const phone = prettyPhone(c.dial, (country === "TG" ? "9" : "6") + String(Math.floor(rand() * 1e7)).padStart(7, "0"));
      i++;
      bookings.push({
        id: crypto.randomUUID(),
        ref: `OCD-${day.slice(8, 10)}${day.slice(5, 7)}-${time.replace(":", "")}-D${i}`,
        createdAt: new Date(Date.UTC(2026, 10, 7, 18, 0) + i * 1_200_000).toISOString(),
        status: (["paid", "confirmed", "pending", "paid", "confirmed"] as const)[i % 5],
        mode: country === "TG" && rand() < 0.8 ? "studio" : "remote",
        country,
        timezone: c.tz,
        packId: pack.id,
        packName: pack.name,
        price: pack.price,
        sessions,
        business: { name, category, pitch, priceHint: "", displayPhone: phone, address, delivers: rand() < 0.6, social: "" },
        contact: { fullName, phone, email: "" },
        paymentMethod: (["flooz", "mixx", "cash", "flooz"] as const)[i % 4],
        photo: null,
        demo: true,
      });
      busy.push(...slots);
      placed++;
    }
  }
  return { bookings, applications: [], lives: seedLives(), sellers: [] };
}

/** Démo : quelques vendeurs ont une photo produit (images du site), les autres gardent la couverture à initiales. */
const DEMO_PHOTOS: Record<string, string> = {
  "Afi Wax Couture": "/media/live-seller-480.webp",
  "Lawson Farm": "/media/products-760.webp",
  "Sahel Cuirs": "/media/pack-vitrine-480.webp",
  "KJ Phones": "/media/pack-spotlight-480.webp",
  "Dakar Wax": "/media/live-seller-720.webp",
  "Karité d'Or": "/media/products-760.webp",
};

/** Démo de l'annuaire : des vendeurs fictifs « en live » aujourd'hui, dans plusieurs pays. */
const DEMO_LIVES: [string, string, LiveEntry["category"]][] = [
  ["Mama Rose Cuisine", "CM", "food"], ["Ndolé Express", "CM", "food"], ["Mimi Hair Douala", "CM", "cheveux"], ["SM Fashion", "CM", "mode"],
  ["Bastos Phones", "CM", "tech"], ["Karité Yaoundé", "CM", "beaute"], ["Afi Wax Couture", "TG", "wax"], ["Jus Sika", "TG", "food"],
  ["Les Délices d'Abla", "TG", "food"], ["KJ Phones", "TG", "tech"], ["Lawson Farm", "TG", "local"], ["Edem Déco", "TG", "maison"],
  ["Chez Tantie Bénin", "BJ", "food"], ["Cotonou Style", "BJ", "mode"], ["Glow by Esther", "CI", "beaute"], ["Garba de Yopougon", "CI", "food"],
  ["Abidjan Bijoux", "CI", "bijoux"], ["Thiéboudienne Mame", "SN", "food"], ["Dakar Wax", "SN", "wax"], ["Karité d'Or", "ML", "beaute"],
  ["Nzinga Bijoux", "CD", "bijoux"], ["Kin Couture", "CD", "mode"], ["Sahel Cuirs", "TD", "local"], ["Ouaga Répare", "BF", "services"],
];

function seedLives(): LiveEntry[] {
  const { today, current, next } = sessionState();
  return DEMO_LIVES.map(([name, country, category], i) => ({
    id: crypto.randomUUID(),
    createdAt: new Date(Date.now() - (i + 1) * 240_000).toISOString(),
    status: i % 9 === 8 ? "pending" : "approved",
    day: today,
    session: (current ?? next).id,
    name,
    country,
    category,
    url: `https://www.tiktok.com/@${name.toLowerCase().replace(/[^a-z]+/g, "")}/live`,
    shortUrl: "",
    phone: `+${getCountry(country)!.dial} 6${String(1000000 + i * 7919).slice(0, 7)}`,
    reviewedAt: i % 9 === 8 ? null : new Date(Date.now() - i * 200_000).toISOString(),
    subscribed: i % 5 !== 4,
    hasPhoto: !!DEMO_PHOTOS[name],
  }));
}

export function createMemoryStore(): Store {
  const data: Data = load() ?? seed();
  // la démo de l'annuaire se renouvelle chaque jour
  if (!data.lives || !data.lives.some((l) => l.day === sessionState().today)) data.lives = [...(data.lives ?? []).filter((l) => !DEMO_LIVES.some(([n]) => n === l.name)), ...seedLives()];
  data.sellers ??= [];
  data.photos ??= {};
  for (const l of data.lives) if (DEMO_PHOTOS[l.name]) data.photos[l.id] = DEMO_PHOTOS[l.name];
  save(data);
  const lives = data.lives;
  const sellers = data.sellers;
  const photos = data.photos;

  return {
    kind: "memory",

    async close() {},

    async listBusy(from, to) {
      return data.bookings.flatMap(slotsOf).filter((s) => s.end > from && s.start < to);
    },

    async createBooking(b, busySlots) {
      const taken = data.bookings.flatMap(slotsOf);
      if (busySlots.some((s) => taken.some((t) => overlap(s, t)))) throw new ConflictError();
      data.bookings.push(b);
      save(data);
      return b;
    },

    async listBookings() {
      return [...data.bookings].sort((a, b) => a.sessions[0].start.localeCompare(b.sessions[0].start));
    },

    async getBooking(id) {
      return data.bookings.find((b) => b.id === id) ?? null;
    },

    async updateStatus(id, status) {
      const b = data.bookings.find((x) => x.id === id);
      if (!b) return null;
      if (b.status === "cancelled" && status !== "cancelled") {
        const others = data.bookings.filter((x) => x.id !== id).flatMap(slotsOf);
        const mine = slotsOf({ ...b, status });
        if (mine.some((s) => others.some((t) => overlap(s, t))))
          throw new ConflictError("Impossible de réactiver : le créneau a été repris entre-temps.");
      }
      b.status = status;
      save(data);
      return b;
    },

    async createApplication(a) {
      data.applications.unshift(a);
      save(data);
    },

    async listApplications() {
      return data.applications;
    },

    async createLive(e, photo) {
      lives.unshift(e);
      if (photo) photos[e.id] = photo;
      save(data);
    },

    async getLivePhoto(id) {
      const l = lives.find((x) => x.id === id);
      return l && photos[id] ? { status: l.status, photo: photos[id] } : null;
    },

    async listLives(opts = {}) {
      return lives.filter((l) => (!opts.day || l.day === opts.day) && (!opts.status || l.status === opts.status) && (!opts.since || l.createdAt >= opts.since));
    },

    async updateLive(id, status) {
      const l = lives.find((x) => x.id === id);
      if (!l) return null;
      l.status = status;
      l.reviewedAt = new Date().toISOString();
      save(data);
      return l;
    },

    async getSeller(phone) {
      return sellers.find((x) => x.phone === phone) ?? null;
    },

    async extendSeller(phone, name, days) {
      const today = new Date().toISOString().slice(0, 10);
      let s = sellers.find((x) => x.phone === phone);
      if (!s) sellers.push((s = { phone, name, paidUntil: null }));
      const from = s.paidUntil && s.paidUntil > today ? s.paidUntil : today;
      const d = new Date(`${from}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + days);
      s.name = name;
      s.paidUntil = d.toISOString().slice(0, 10);
      save(data);
      return s;
    },
  };
}
