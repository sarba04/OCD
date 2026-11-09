/**
 * « En live maintenant » : l'annuaire des lives business, par pays et par catégorie.
 * Un vendeur lance son live TikTok chez lui, envoie le lien sur OCD Live, l'équipe vérifie qu'il vend
 * vraiment et valide : le live apparaît sur le site pendant la session en cours.
 */
import { COUNTRIES } from "./countries";

/**
 * MODE TEST : ouvert à toute heure (pas de sessions), pour les essais.
 * Pour remettre les sessions 8h–11h et 18h–21h : passer à `false`, ou mettre NEXT_PUBLIC_LIVE_TEST_MODE=0 sur Vercel.
 */
export const LIVE_TEST_MODE = process.env.NEXT_PUBLIC_LIVE_TEST_MODE ? process.env.NEXT_PUBLIC_LIVE_TEST_MODE !== "0" : true;

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

/** Les rayons du marché : une couleur et une icône (voir CategoryIcon) pour chacun. */
export const LIVE_CATEGORIES = [
  { id: "food", label: "Nourriture", color: "#d98e2b" },
  { id: "mode", label: "Habits", color: "#c8624a" },
  { id: "wax", label: "Pagnes", color: "#b8452a" },
  { id: "beaute", label: "Beauté", color: "#b8607e" },
  { id: "cheveux", label: "Cheveux", color: "#7a5ea8" },
  { id: "tech", label: "Téléphones", color: "#3f6f9e" },
  { id: "maison", label: "Maison", color: "#4f8a6c" },
  { id: "bijoux", label: "Bijoux", color: "#a8862e" },
  { id: "local", label: "Produits locaux", color: "#6a8a3e" },
  { id: "services", label: "Services", color: "#5f6b78" },
] as const;
export type CategoryId = (typeof LIVE_CATEGORIES)[number]["id"];
export const getCategory = (id: string) => LIVE_CATEGORIES.find((c) => c.id === id) ?? LIVE_CATEGORIES[0];

/** Les pays de l'annuaire : l'Afrique d'abord. */
export const LIVE_COUNTRIES = COUNTRIES;

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

/**
 * Les liens copiés depuis l'appli TikTok sont courts (vm.tiktok.com/…, tiktok.com/t/…) et ne contiennent pas
 * l'identifiant de la vidéo : on suit la redirection côté serveur pour retrouver le lien complet.
 */
export async function resolveTikTokVideo(u: string): Promise<string> {
  if (!u || tiktokVideoId(u)) return u;
  try {
    const r = await fetch(u, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36" },
      signal: AbortSignal.timeout(5000),
    });
    if (tiktokVideoId(r.url)) return r.url.split("?")[0];
    const html = await r.text();
    const id = /"(?:videoId|itemId)"\s*:\s*"(\d{8,25})"/.exec(html)?.[1] ?? /\/video\/(\d{8,25})/.exec(html)?.[1];
    return id ? `https://www.tiktok.com/video/${id}` : u;
  } catch {
    return u;
  }
}
