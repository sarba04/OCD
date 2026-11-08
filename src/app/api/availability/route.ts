import { NextResponse } from "next/server";
import { getBusy } from "@/lib/server/bookings";
import { isDemo } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Créneaux occupés (heures uniquement, aucune donnée personnelle) + l'heure du serveur. */
export async function GET() {
  const busy = await getBusy();
  return NextResponse.json(
    { busy, now: new Date().toISOString(), demo: isDemo() },
    { headers: { "cache-control": "no-store" } },
  );
}
