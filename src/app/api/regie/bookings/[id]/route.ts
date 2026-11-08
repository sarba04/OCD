import { NextResponse, type NextRequest } from "next/server";
import { isAdmin, overlayToken } from "@/lib/server/auth";
import { ConflictError, getStore } from "@/lib/server/store";
import type { BookingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = ["pending", "paid", "confirmed", "done", "no_show", "cancelled"];

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await ctx.params;
  const b = await (await getStore()).getBooking(id);
  if (!b) return NextResponse.json({ message: "Réservation introuvable." }, { status: 404 });
  return NextResponse.json({ booking: b, overlay: `/regie/bandeau/${b.id}?t=${overlayToken(b.id)}` });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await ctx.params;
  const { status } = await req.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return NextResponse.json({ message: "Statut inconnu." }, { status: 400 });
  try {
    const b = await (await getStore()).updateStatus(id, status);
    if (!b) return NextResponse.json({ message: "Réservation introuvable." }, { status: 404 });
    const { photo, ...rest } = b;
    return NextResponse.json({ booking: { ...rest, hasPhoto: !!photo } });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ message: e.message }, { status: 409 });
    throw e;
  }
}
