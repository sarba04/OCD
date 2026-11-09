/**
 * « En live maintenant » : l'annuaire des lives business, par pays et par catégorie.
 * Un vendeur lance son live TikTok chez lui, envoie le lien sur OCD Live, l'équipe vérifie qu'il vend
 * vraiment et valide : le live apparaît sur le site pendant la session en cours.
 */
import { COUNTRIES } from "./countries";

/** Les sessions où l'équipe valide les lives (heure de Lomé = GMT). Modifiable ici. */
export const LIVE_SESSIONS = [
  { id: "matin", label: "Session du matin", start: "08:00", end: "11:00" },
  { id: "soir", label: "Session du soir", start: "18:00", end: "21:00" },
] as const;
export type SessionId = (typeof LIVE_SESSIONS)[number]["id"];

/** L'abonnement mensuel pour apparaître dans l'annuaire (2 sessions par jour). */
export const LIVE_PASS = {
  price: Number(process.env.NEXT_PUBLIC_LIVE_PASS_PRICE) || 11000,
  days: 30,
};

/** Les rayons du marché : une icône claire pour chacun, sans avoir besoin de lire. */
export const LIVE_CATEGORIES = [
  { id: "food", label: "Nourriture", icon: "🍲", color: "#f6b73c" },
  { id: "mode", label: "Habits", icon: "👗", color: "#f28c6b" },
  { id: "wax", label: "Pagnes", icon: "🧵", color: "#e0582a" },
  { id: "beaute", label: "Beauté", icon: "💄", color: "#ef7aa0" },
  { id: "cheveux", label: "Cheveux", icon: "💇🏾‍♀️", color: "#b68cf0" },
  { id: "tech", label: "Téléphones", icon: "📱", color: "#5aa9f0" },
  { id: "maison", label: "Maison", icon: "🛋️", color: "#7cc79a" },
  { id: "bijoux", label: "Bijoux", icon: "💍", color: "#f3d36b" },
  { id: "local", label: "Produits locaux", icon: "🌿", color: "#8fc46a" },
  { id: "services", label: "Services", icon: "🛠️", color: "#9aa7b4" },
] as const;
export type CategoryId = (typeof LIVE_CATEGORIES)[number]["id"];
export const getCategory = (id: string) => LIVE_CATEGORIES.find((c) => c.id === id) ?? LIVE_CATEGORIES[0];

/** Les pays de l'annuaire : l'Afrique d'abord. */
export const LIVE_COUNTRIES = COUNTRIES;

/** Drapeau en emoji à partir du code pays (CM → 🇨🇲). */
export const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export type LiveStatus = "pending" | "approved" | "rejected";

export interface LiveEntry {
  id: string;
  createdAt: string;
  status: LiveStatus;
  /** Jour (AAAA-MM-JJ, heure de Lomé) et session où le live a été envoyé. */
  day: string;
  session: SessionId;
  name: string;
  country: string;
  category: CategoryId;
  /** Lien du live TikTok. */
  url: string;
  /** Lien d'une vidéo courte (TikTok) pour les Shorts OCD, facultatif. */
  shortUrl: string;
  /** WhatsApp du vendeur (visible seulement par l'équipe). */
  phone: string;
  reviewedAt: string | null;
  /** Abonnement actif au moment de l'envoi. */
  subscribed: boolean;
}

/** Ce que le public voit. */
export type PublicLive = Pick<LiveEntry, "id" | "name" | "country" | "category" | "url" | "shortUrl" | "reviewedAt">;

export interface Seller {
  phone: string;
  name: string;
  paidUntil: string | null;
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** La session en cours (ou null), et la prochaine, à partir de l'heure de Lomé (= UTC). */
export function sessionState(now = new Date()) {
  const m = now.getUTCHours() * 60 + now.getUTCMinutes();
  const today = now.toISOString().slice(0, 10);
  const current = LIVE_SESSIONS.find((s) => m >= toMin(s.start) && m < toMin(s.end)) ?? null;
  const nextToday = LIVE_SESSIONS.find((s) => toMin(s.start) > m);
  const next = nextToday ?? LIVE_SESSIONS[0];
  const nextDay = nextToday ? today : new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
  const nextStart = new Date(`${nextDay}T${next.start}:00Z`);
  const endsAt = current ? new Date(`${today}T${current.end}:00Z`) : null;
  return { today, current, next, nextStart, endsAt };
}

/** Le lien est-il bien un lien TikTok ? */
export const isTikTokUrl = (u: string) => {
  try {
    const url = new URL(u.trim());
    return url.protocol === "https:" && /(^|\.)tiktok\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
};

/** Identifiant d'une vidéo TikTok (…/video/7312345678901234567), pour l'intégrer dans les Shorts. */
export const tiktokVideoId = (u: string) => /\/video\/(\d{8,25})/.exec(u)?.[1] ?? null;
