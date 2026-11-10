import { BRAND } from "../config";
import { getCountry } from "../countries";
import { formatTime } from "../schedule";
import type { PublicBooking } from "../types";

/**
 * L'affiche « Je passe en live », au format statut WhatsApp / story TikTok (1080 × 1920), dans le style de la Carte OCD :
 * le produit en plein écran (sa photo, ou l'objet de son rayon), la date et l'heure en très grand,
 * et en bas la carte blanche : le nom, la phrase, le prix, la livraison, le WhatsApp et l'adresse.
 */
const W = 1080;
const H = 1920;
const C = { ink: "#16120E", ink2: "#4A433B", ink3: "#6E665C", orange: "#F16903", live: "#E5262B", ok: "#17704A", okSoft: "#E3F3EA" };

/** Rayon de la réservation → image de l'objet (public/cat). */
const ART: Record<string, { id: string; color: string }> = {
  Mode: { id: "mode", color: "#c8624a" },
  "Pagnes & wax": { id: "wax", color: "#b8452a" },
  Beauté: { id: "beaute", color: "#b8607e" },
  "Cheveux & perruques": { id: "cheveux", color: "#7a5ea8" },
  "Food & boissons": { id: "food", color: "#d98e2b" },
  "Tech & téléphones": { id: "tech", color: "#3f6f9e" },
  "Maison & déco": { id: "maison", color: "#4f8a6c" },
  "Bijoux & accessoires": { id: "bijoux", color: "#a8862e" },
  "Produits locaux": { id: "local", color: "#6a8a3e" },
  Artisanat: { id: "local", color: "#6a8a3e" },
  Services: { id: "services", color: "#5f6b78" },
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].replace(/\s*\S*$/, "…");
    return cut;
  }
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, font: (s: number) => string, start: number, maxW: number, min = 40) {
  let s = start;
  ctx.font = font(s);
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= 3;
    ctx.font = font(s);
  }
  return s;
}

/** Image « cover » dans un rectangle. */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

/** Une pastille (texte sur fond arrondi) ; renvoie sa largeur. */
function pill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, font: string, bg: string, fg: string, padX = 26, h = 64) {
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
  return w;
}

export async function drawPoster(b: PublicBooking, photo: string | null): Promise<Blob> {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-bricolage").trim() || "system-ui, sans-serif";
  const F = (w: number, s: number) => `${w} ${s}px ${family}`;
  await Promise.all([document.fonts.load(F(800, 100)), document.fonts.load(F(600, 40))]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const first = b.sessions[0];
  const d = new Date(first.start);
  const art = ART[b.business.category] ?? { id: "local", color: "#6a8a3e" };
  const photoImg = photo ? await loadImage(photo).catch(() => null) : null;

  /* ───── Fond : la photo du produit, ou l'objet du rayon sur sa teinte ───── */
  if (photoImg) {
    cover(ctx, photoImg, 0, 0, W, H);
    const top = ctx.createLinearGradient(0, 0, 0, 640);
    top.addColorStop(0, "rgba(0,0,0,0.62)");
    top.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 640);
    const bot = ctx.createLinearGradient(0, 1100, 0, H);
    bot.addColorStop(0, "rgba(0,0,0,0)");
    bot.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = bot;
    ctx.fillRect(0, 1100, W, H - 1100);
  } else {
    ctx.fillStyle = "#fbf7f1";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = art.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(W / 2, 640, 40, W / 2, 640, 760);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // une trame fine en diagonale
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    for (let x = -H; x < W; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }
    try {
      const obj = await loadImage(`/cat/${art.id}-l.webp`);
      ctx.save();
      ctx.shadowColor = "rgba(40,20,5,0.35)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 30;
      ctx.drawImage(obj, (W - 740) / 2, 540, 740, 740);
      ctx.restore();
    } catch {
      /* sans image : la teinte suffit */
    }
  }
  const dark = !!photoImg;

  /* ───── En haut : le logo et « Je passe en live » ───── */
  try {
    const logo = await loadImage(dark ? "/brand/ocd-logo-white.svg" : "/brand/ocd-logo.svg");
    ctx.drawImage(logo, 72, 84, 176, (176 * 368) / 951);
    ctx.font = F(800, 44);
    ctx.fillStyle = dark ? "#fff" : C.ink;
    ctx.fillText("Live", 72 + 186, 84 + 62);
  } catch {
    /* le logo n'a pas chargé : on continue */
  }
  ctx.font = F(800, 30);
  const tag = "JE PASSE EN LIVE";
  const tw = ctx.measureText(tag).width + 88;
  ctx.fillStyle = C.live;
  rr(ctx, W - 72 - tw, 84, tw, 72, 36);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(W - 72 - tw + 36, 120, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.textBaseline = "middle";
  ctx.fillText(tag, W - 72 - tw + 58, 122);
  ctx.textBaseline = "alphabetic";

  /* ───── La date et l'heure, en très grand ───── */
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  ctx.fillStyle = dark ? "#fff" : C.ink;
  ctx.font = F(700, 46);
  ctx.fillText(day.charAt(0).toUpperCase() + day.slice(1), 72, 268);
  ctx.font = F(800, 196);
  ctx.save();
  if (dark) {
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 30;
  }
  ctx.fillText(formatTime(first.start).replace(":", "h"), 64, 440);
  ctx.restore();
  const c = getCountry(b.country);
  ctx.font = F(600, 36);
  ctx.fillStyle = dark ? "rgba(255,255,255,0.85)" : C.ink2;
  ctx.fillText(
    b.mode === "remote" && c && c.tz !== "Africa/Lome" ? `heure de Lomé · ${formatTime(first.start, c.tz).replace(":", "h")} à ${c.city}` : `heure de Lomé · sur ${BRAND.liveAccount}`,
    72,
    500,
  );
  if (b.sessions.length > 1) {
    pill(ctx, 72, 530, `+ ${b.sessions.length - 1} autre${b.sessions.length > 2 ? "s" : ""} live${b.sessions.length > 2 ? "s" : ""}`, F(700, 30), dark ? "rgba(255,255,255,0.22)" : "rgba(22,18,14,0.08)", dark ? "#fff" : C.ink, 22, 56);
  }

  /* ───── La carte blanche, en bas ───── */
  const cx = 48;
  const cw = W - 96;
  // la carte s'ajuste à son contenu et reste collée en bas
  ctx.font = F(500, 38);
  const pitchLines = wrap(ctx, b.business.pitch, cw - 112, 2).length;
  const nsPre = fit(ctx, b.business.name, (s) => F(800, s), 86, cw - 112, 48);
  const hasChips = !!b.business.priceHint || b.business.delivers;
  const ch = 56 + nsPre * 0.8 + 58 + pitchLines * 50 + 10 + (hasChips ? 98 : 0) + 156 + 34 + 56;
  const cy = H - 68 - ch;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#fff";
  rr(ctx, cx, cy, cw, ch, 56);
  ctx.fill();
  ctx.restore();

  const px = cx + 56;
  const pw = cw - 112;
  ctx.fillStyle = C.ink;
  const ns = fit(ctx, b.business.name, (s) => F(800, s), 86, pw, 48);
  ctx.font = F(800, ns);
  ctx.fillText(b.business.name, px, cy + 56 + ns * 0.8);
  let y = cy + 56 + ns * 0.8 + 58;
  ctx.font = F(500, 38);
  ctx.fillStyle = C.ink2;
  for (const line of wrap(ctx, b.business.pitch, pw, 2)) {
    ctx.fillText(line, px, y);
    y += 50;
  }
  y += 10;
  let x = px;
  if (b.business.priceHint) x += pill(ctx, x, y, b.business.priceHint, F(700, 32), C.orange, C.ink) + 14;
  if (b.business.delivers) pill(ctx, x, y, "Livraison", F(700, 32), C.okSoft, C.ok);
  if (hasChips) y += 64 + 34;

  // le WhatsApp, en grand, dans une pastille sombre
  ctx.font = F(800, 52);
  const num = b.business.displayPhone;
  const nw = Math.min(pw, ctx.measureText(num).width + 150);
  ctx.fillStyle = C.ink;
  rr(ctx, px, y, nw, 104, 52);
  ctx.fill();
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(px + 58, y + 52, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + 40, y + 74);
  ctx.lineTo(px + 44, y + 60);
  ctx.lineTo(px + 54, y + 72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(num, px + 104, y + 55);
  ctx.textBaseline = "alphabetic";
  y += 104 + 52;

  // l'adresse
  ctx.fillStyle = C.orange;
  ctx.beginPath();
  ctx.arc(px + 14, y - 12, 13, Math.PI, 0);
  ctx.lineTo(px + 14, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.ink2;
  ctx.font = F(600, 34);
  ctx.fillText(wrap(ctx, b.business.address, pw - 44, 1)[0] ?? "", px + 42, y);

  /* ───── Pied : où regarder ───── */
  ctx.font = F(700, 30);
  ctx.fillStyle = dark ? "rgba(255,255,255,0.9)" : C.ink2;
  ctx.textAlign = "center";
  ctx.fillText(`En direct sur TikTok · ${BRAND.liveAccount}`, W / 2, H - 22);
  ctx.textAlign = "left";

  return new Promise((res, rej) => canvas.toBlob((bl) => (bl ? res(bl) : rej(new Error("toBlob"))), "image/jpeg", 0.9));
}
