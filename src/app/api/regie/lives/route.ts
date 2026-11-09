import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Les lives des 3 derniers jours, avec l'abonnement de chaque vendeur. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const store = await getStore();
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const lives = await store.listLives({ since });
  const phones = [...new Set(lives.map((l) => l.phone))];
  const sellers = Object.fromEntries((await Promise.all(phones.map((p) => store.getSeller(p)))).filter(Boolean).map((s) => [s!.phone, s!.paidUntil]));
  return NextResponse.json({ lives, sellers, now: new Date().toISOString() }, { headers: { "cache-control": "no-store" } });
}
