import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Valider ou refuser un live. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!["approved", "rejected", "pending"].includes(status)) return NextResponse.json({ message: "Statut inconnu." }, { status: 400 });
  const l = await (await getStore()).updateLive(id, status);
  if (!l) return NextResponse.json({ message: "Live introuvable." }, { status: 404 });
  return NextResponse.json({ live: l });
}
