import { NextResponse, after, type NextRequest } from "next/server";
import { alternatives, createBooking, getBusy, InputError, toPublic } from "@/lib/server/bookings";
import { notifyBooking } from "@/lib/server/notify";
import { ConflictError } from "@/lib/server/store";
import type { BookingInput } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Anti-abus très simple : 8 réservations max par IP et par tranche de 10 minutes. */
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ message: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });

  let input: BookingInput;
  try {
    input = (await req.json()) as BookingInput;
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }

  try {
    const booking = await createBooking(input);
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    after(() => notifyBooking(booking, origin));
    return NextResponse.json({ booking: toPublic(booking) }, { status: 201 });
  } catch (e) {
    if (e instanceof ConflictError) {
      const busy = await getBusy();
      return NextResponse.json(
        { message: e.message, alternatives: alternatives(input.packId, input.day, input.time, busy, new Date()) },
        { status: 409 },
      );
    }
    if (e instanceof InputError) return NextResponse.json({ message: e.message, errors: e.errors }, { status: 400 });
    console.error(e);
    return NextResponse.json({ message: "Le serveur n'a pas pu enregistrer ta réservation. Réessaie dans un instant." }, { status: 500 });
  }
}
