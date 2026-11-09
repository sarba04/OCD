import { NextResponse } from "next/server";
import { tiktokVideoId } from "@/lib/lives";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Les Shorts OCD : les vidéos courtes des vendeurs validés, des 30 derniers jours. */
export async function GET() {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const lives = await (await getStore()).listLives({ status: "approved", since });
  const seen = new Set<string>();
  const shorts = lives
    .map((l) => ({ id: l.id, name: l.name, country: l.country, category: l.category, url: l.url, video: tiktokVideoId(l.shortUrl) }))
    .filter((s) => s.video && !seen.has(s.video) && seen.add(s.video));
  return NextResponse.json({ shorts }, { headers: { "cache-control": "no-store" } });
}
