import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "ocd_regie";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 jours

/** Mot de passe de la Régie. En mode démo (sans base), un mot de passe par défaut est accepté. */
export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.DATABASE_URL ? null : "regie2026";
}

function secret() {
  const base = process.env.ADMIN_SECRET || adminPassword() || "ocd-live";
  return createHash("sha256").update(`ocd-live:${base}`).digest();
}

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(input: string) {
  const pw = adminPassword();
  return !!pw && same(createHash("sha256").update(input).digest("hex"), createHash("sha256").update(pw).digest("hex"));
}

export function sessionToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return { value: `${exp}.${sign(`admin.${exp}`)}`, maxAge: MAX_AGE };
}

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return same(sig, sign(`admin.${exp}`));
}

/** Jeton pour le bandeau d'incrustation (lien à coller dans OBS / TikTok LIVE Studio). */
export const overlayToken = (id: string) => sign(`overlay.${id}`).slice(0, 22);
export const checkOverlayToken = (id: string, t: string) => same(overlayToken(id), t);
