import { BRAND } from "../config";
import { getCountry } from "../countries";
import { formatDay, formatTime } from "../schedule";
import type { PublicBooking } from "../types";

/**
 * L'affiche « Je passe en live » au format statut WhatsApp / story TikTok (1080 × 1920),
 * aux couleurs du studio. Chaque vendeur la partage à ses clients : c'est de la pub gratuite
 * pour son live… et pour OCD Live.
 */
const W = 1080;
const H = 1920;
const C = {
  paper: "#FBF8F3",
  ink: "#16120E",
  ink2: "#4A433B",
  ink3: "#6E665C",
  orange: "#F16903",
  live: "#E5262B",
  glow: "rgba(255,170,80,0.95)",
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function chamferPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) {
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + c);
  ctx.closePath();
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
    s -= 4;
    ctx.font = font(s);
  }
  return s;
}

export async function drawPoster(b: PublicBooking, photo: string | null): Promise<Blob> {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-bricolage").trim() || "system-ui, sans-serif";
  const F = (w: number, s: number) => `${w} ${s}px ${family}`;
  await Promise.all([document.fonts.load(F(800, 100)), document.fonts.load(F(600, 40))]).catch(() => {});

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  /* fond papier + lumière chaude */
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.5, 620, 60, W * 0.5, 620, 900);
  g.addColorStop(0, "rgba(255,200,140,0.55)");
  g.addColorStop(1, "rgba(255,200,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  /* le projecteur : un grand disque de lumière derrière le logo */
  ctx.save();
  ctx.shadowColor = C.glow;
  for (const blur of [160, 80, 26]) {
    ctx.shadowBlur = blur;
    ctx.fillStyle = "#FFFDF8";
    ctx.beginPath();
    ctx.arc(W / 2, 620, 380, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  /* « EN LIVE » */
  ctx.fillStyle = C.live;
  chamferPath(ctx, 72, 84, 268, 76, 18);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(116, 122, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = F(800, 40);
  ctx.textBaseline = "middle";
  ctx.fillText("EN LIVE", 142, 124);
  ctx.fillStyle = C.ink2;
  ctx.font = F(600, 34);
  ctx.textAlign = "right";
  ctx.fillText(`sur ${BRAND.liveAccount}`, W - 72, 124);
  ctx.textAlign = "left";

  /* logo OCD + Live au centre du mur */
  try {
    const logo = await loadImage("/brand/ocd-logo.svg");
    const lw = 420;
    const lh = (lw * 368) / 951;
    const lx = (W - lw) / 2 - 40;
    const ly = 560;
    ctx.drawImage(logo, lx, ly, lw, lh);
    ctx.fillStyle = C.ink;
    ctx.font = F(800, 120);
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Live", lx + lw - 150, ly + lh + 108);
  } catch {
    /* sans logo, l'affiche reste lisible */
  }

  /* date + heure, dans le fuseau du vendeur : c'est l'heure de SES clients */
  const first = b.sessions[0];
  const c = getCountry(b.country);
  const tz = b.mode === "remote" && c ? c.tz : "Africa/Lome";
  const city = b.mode === "remote" && c ? c.city : "Lomé";
  const dayLabel = formatDay(first.start.slice(0, 10)).toUpperCase();
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  const ds = fit(ctx, dayLabel, (z) => F(800, z), 84, W - 144);
  ctx.font = F(800, ds);
  ctx.fillText(dayLabel, 72, 1220);
  ctx.fillStyle = C.orange;
  ctx.font = F(800, 230);
  const time = formatTime(first.start, tz).replace(":", "h");
  ctx.fillText(time, 64, 1440);
  const tw = ctx.measureText(time).width;
  ctx.fillStyle = C.ink3;
  ctx.font = F(600, 34);
  ctx.fillText(`heure de ${city}`, 64 + tw + 24, 1440);
  if (b.sessions.length > 1) ctx.fillText(`+ ${b.sessions.length - 1} autre${b.sessions.length > 2 ? "s" : ""} live${b.sessions.length > 2 ? "s" : ""}`, 64 + tw + 24, 1392);

  /* le business */
  let tx = 72;
  const ty = 1490;
  if (photo) {
    try {
      const img = await loadImage(photo);
      const size = 230;
      ctx.save();
      chamferPath(ctx, 72, ty, size, size, 30);
      ctx.clip();
      const r = Math.max(size / img.width, size / img.height);
      ctx.drawImage(img, 72 + (size - img.width * r) / 2, ty + (size - img.height * r) / 2, img.width * r, img.height * r);
      ctx.restore();
      tx = 72 + size + 36;
    } catch {
      /* photo illisible : on l'ignore */
    }
  }
  ctx.fillStyle = C.ink;
  const ns = fit(ctx, b.business.name, (z) => F(800, z), 72, W - tx - 72, 44);
  ctx.font = F(800, ns);
  ctx.fillText(b.business.name, tx, ty + ns * 0.85);
  ctx.fillStyle = C.ink2;
  ctx.font = F(500, 34);
  wrap(ctx, b.business.pitch, W - tx - 72, 3).forEach((l, i) => ctx.fillText(l, tx, ty + ns + 40 + i * 44));

  /* bandeau du bas : comment commander */
  const by = 1760;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, by, W, H - by);
  ctx.fillStyle = C.orange;
  ctx.fillRect(0, by, W, 10);
  ctx.fillStyle = "rgba(251,248,243,0.7)";
  ctx.font = F(600, 28);
  ctx.fillText("COMMANDE SUR WHATSAPP", 72, by + 64);
  ctx.fillStyle = C.orange;
  ctx.font = F(800, 58);
  ctx.fillText(b.business.displayPhone, 72, by + 130);
  ctx.fillStyle = C.paper;
  ctx.font = F(500, 30);
  ctx.textAlign = "right";
  const addr = wrap(ctx, b.business.address + (b.business.delivers ? " · livraison" : ""), 380, 2);
  addr.forEach((l, i) => ctx.fillText(l, W - 72, by + 92 + i * 38));
  ctx.textAlign = "left";

  return new Promise((res, rej) => canvas.toBlob((blob) => (blob ? res(blob) : rej(new Error("toBlob"))), "image/png"));
}
