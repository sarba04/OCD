import { NextResponse, type NextRequest } from "next/server";
import { LIVE_PASS } from "@/lib/lives";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import { validPhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Abonnement payé : +30 jours pour ce vendeur. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { phone, name } = await req.json().catch(() => ({}));
  if (typeof phone !== "string" || !validPhone(phone)) return NextResponse.json({ message: "Numéro invalide." }, { status: 400 });
  const s = await (await getStore()).extendSeller(phone, typeof name === "string" ? name.slice(0, 50) : "", LIVE_PASS.days);
  return NextResponse.json({ seller: s });
}
