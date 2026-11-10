import "server-only";
import { BRAND, PAYMENT_LABEL } from "../config";
import { getCountry } from "../countries";
import { fcfa } from "../format";
import { formatDay, formatTime } from "../schedule";
import type { Application } from "./store";
import type { Booking } from "../types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const h = (t: string) => t.replace(":", "h");

/** La phrase exacte que l'équipe veut lire : « telle personne fait tel business, a réservé tel jour… » */
export function bookingSentence(b: Booking) {
  const s = b.sessions[0];
  const day = formatDay(s.start.slice(0, 10));
  const where =
    b.mode === "studio"
      ? `viendra au studio à ${BRAND.studioCity}`
      : `sera en live depuis ${getCountry(b.country)?.name ?? b.country}`;
  return `${b.contact.fullName} (${b.business.name}, ${b.business.category.toLowerCase()}) a réservé le ${day} de ${h(
    formatTime(s.start),
  )} à ${h(formatTime(s.end))} et ${where}.`;
}

function lines(b: Booking) {
  const pay = PAYMENT_LABEL[b.paymentMethod] ?? b.paymentMethod;
  const c = getCountry(b.country);
  const out = [
    `Ce qu'il/elle présente : « ${b.business.pitch} »`,
    ...b.sessions.map(
      (s, i) =>
        `${b.sessions.length > 1 ? `Live ${i + 1} : ` : "Live : "}${formatDay(s.start.slice(0, 10))}, ${formatTime(s.start)}–${formatTime(s.end)} (Lomé)` +
        (b.mode === "remote" && c && c.tz !== "Africa/Lome" ? ` · ${formatTime(s.start, c.tz)} à ${c.city}` : ""),
    ),
    `Pack ${b.packName} · ${fcfa(b.price)} · Paiement : ${pay}`,
    `WhatsApp : ${b.contact.phone}`,
    `Numéro affiché à l'écran : ${b.business.displayPhone}`,
    `Adresse : ${b.business.address}${b.business.delivers ? " · livre / expédie" : ""}`,
    b.business.social ? `Réseaux : ${b.business.social}` : "",
    `Réf : ${b.ref}`,
  ];
  return out.filter(Boolean);
}

async function telegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(6000),
  });
  return r.ok;
}

async function email(subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!key || !to) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: process.env.NOTIFY_EMAIL_FROM || "OCD Live <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()),
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(6000),
  });
  return r.ok;
}

async function send(subject: string, sentence: string, details: string[], adminUrl?: string) {
  const tg = [`🔴 <b>${esc(subject)}</b>`, "", esc(sentence), "", ...details.map(esc), adminUrl ? `\n${adminUrl}` : ""].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#16120E">
    <p style="font-size:18px;font-weight:700;margin:0 0 12px">${esc(sentence)}</p>
    <ul style="padding-left:18px;margin:0 0 16px">${details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    ${adminUrl ? `<p><a href="${adminUrl}" style="color:#C25000;font-weight:700">Ouvrir la fiche dans la Régie →</a></p>` : ""}
  </div>`;
  const text = [sentence, "", ...details, adminUrl ?? ""].join("\n");
  const results = await Promise.allSettled([telegram(tg), email(subject, html, text)]);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value);
  if (!delivered) console.info(`[OCD Live] ${subject}\n${text}`);
}

export async function notifyBooking(b: Booking, origin?: string) {
  await send(
    `Nouvelle réservation · ${b.ref}`,
    bookingSentence(b),
    lines(b),
    origin ? `${origin}/regie?fiche=${b.id}` : undefined,
  ).catch((e) => console.error("[OCD Live] notification", e));
}

export async function notifyApplication(a: Application) {
  await send(
    "Nouvelle candidature animatrice",
    `${a.fullName} (${a.city}) veut devenir animatrice OCD Live.`,
    [`WhatsApp : ${a.phone}`, `Pourquoi : ${a.why}`, a.link ? `Vidéo / vocal : ${a.link}` : ""].filter(Boolean),
  ).catch((e) => console.error("[OCD Live] notification", e));
}

export async function notifyLive(e: import("../lives").LiveEntry, origin?: string) {
  const { getCategory } = await import("../lives");
  const { getCountry } = await import("../countries");
  await send(
    "Live à valider",
    `${e.name} est en live (${getCategory(e.category).label}, ${getCountry(e.country)?.name ?? e.country}).`,
    [`Lien : ${e.url}`, `WhatsApp : ${e.phone}`, e.subscribed ? "Abonnement : actif" : "Abonnement : à payer"],
    origin ? `${origin}/regie?vue=lives` : undefined,
  ).catch((err) => console.error("[OCD Live] notification", err));
}
