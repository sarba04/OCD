import { NextResponse, after, type NextRequest } from "next/server";
import { getCountry } from "@/lib/countries";
import { LIVE_CATEGORIES, LIVE_SESSIONS, LIVE_TEST_MODE, isPhotoDataUrl, isTikTokUrl, resolveTikTokVideo, tiktokVideoId, sessionState, type LiveEntry, type PublicLive } from "@/lib/lives";
import { notifyLive } from "@/lib/server/notify";
import { getStore, isDemo } from "@/lib/server/store";
import { validPhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const pub = (l: LiveEntry): PublicLive => ({ id: l.id, name: l.name, country: l.country, category: l.category, url: l.url, shortUrl: l.shortUrl, reviewedAt: l.reviewedAt, hasPhoto: l.hasPhoto });

/** Les lives validés de la session en cours (en démo : ceux du jour, pour que la page ait l'air vivante). */
export async function GET() {
  const now = new Date();
  const st = sessionState(now);
  const store = await getStore();
  const demo = isDemo();
  const approved = await store.listLives({ day: st.today, status: "approved" });
  // mode test ou démo : tous les lives validés du jour, à toute heure
  const open = demo || LIVE_TEST_MODE;
  const live = open ? approved : st.current ? approved.filter((l) => l.session === st.current!.id) : [];
  return NextResponse.json(
    {
      now: now.toISOString(),
      demo,
      testMode: LIVE_TEST_MODE,
      session: LIVE_TEST_MODE
        ? { id: (st.current ?? st.next).id, start: "00:00", end: "24:00", endsAt: null }
        : st.current ? { id: st.current.id, start: st.current.start, end: st.current.end, endsAt: st.endsAt } : null,
      next: { id: st.next.id, start: st.next.start, end: st.next.end, at: st.nextStart },
      sessions: LIVE_SESSIONS,
      lives: live.map(pub),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/** « Je suis en live » : le vendeur envoie son lien, l'équipe le valide. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true }, { status: 201 });
  const st = sessionState();
  const demo = isDemo();
  if (!st.current && !demo && !LIVE_TEST_MODE) {
    return NextResponse.json(
      { message: `L'équipe valide les lives de ${LIVE_SESSIONS.map((s) => `${s.start.replace(":00", "h")} à ${s.end.replace(":00", "h")}`).join(" et de ")}. Reviens à ${st.next.start.replace(":00", "h")}.`, closed: true },
      { status: 409 },
    );
  }
  const e: LiveEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    day: st.today,
    session: (st.current ?? st.next).id,
    name: clean(body.name, 50),
    country: clean(body.country, 2).toUpperCase(),
    category: clean(body.category, 20) as LiveEntry["category"],
    url: clean(body.url, 300),
    shortUrl: clean(body.shortUrl, 300),
    phone: clean(body.phone, 24),
    reviewedAt: null,
    subscribed: false,
    hasPhoto: false,
  };
  const photo = body.photo == null || body.photo === "" ? null : body.photo;
  const errors: Record<string, string> = {};
  if (e.name.length < 2) errors.name = "Écris ton nom ou le nom de ta boutique.";
  if (!getCountry(e.country)) errors.country = "Choisis ton pays.";
  if (!LIVE_CATEGORIES.some((c) => c.id === e.category)) errors.category = "Choisis ce que tu vends.";
  if (!isTikTokUrl(e.url)) errors.url = "Colle le lien de ton live TikTok (il commence par https://www.tiktok.com ou https://vm.tiktok.com).";
  if (e.shortUrl && !isTikTokUrl(e.shortUrl)) errors.shortUrl = "Ce lien n'est pas une vidéo TikTok.";
  if (!validPhone(e.phone)) errors.phone = "Ton numéro WhatsApp semble incomplet.";
  if (photo !== null && !isPhotoDataUrl(photo)) errors.photo = "Cette photo n'a pas pu être envoyée. Essaie une autre photo.";
  if (Object.keys(errors).length) return NextResponse.json({ message: "À compléter.", errors }, { status: 400 });

  // vidéo courte : on retrouve l'identifiant de la vidéo derrière un lien court
  if (e.shortUrl) e.shortUrl = await resolveTikTokVideo(e.shortUrl);

  const store = await getStore();
  const already = (await store.listLives({ day: e.day })).find((l) => l.phone === e.phone && l.session === e.session && l.status !== "rejected");
  if (already) return NextResponse.json({ ok: true, status: already.status, subscribed: already.subscribed, again: true }, { status: 200 });

  const seller = await store.getSeller(e.phone);
  e.subscribed = !!seller?.paidUntil && seller.paidUntil >= e.day;
  e.hasPhoto = !!photo;
  await store.createLive(e, photo);
  after(() => notifyLive(e, req.nextUrl.origin));
  return NextResponse.json(
    { ok: true, status: e.status, subscribed: e.subscribed, paidUntil: seller?.paidUntil ?? null, short: e.shortUrl ? !!tiktokVideoId(e.shortUrl) : null },
    { status: 201 },
  );
}
