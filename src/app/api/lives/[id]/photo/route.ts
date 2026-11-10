import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** La photo produit d'un live : publique une fois le live validé, sinon réservée à la Régie. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await (await getStore()).getLivePhoto(id);
  if (!p) return new NextResponse(null, { status: 404 });
  const approved = p.status === "approved";
  if (!approved && !(await isAdmin())) return new NextResponse(null, { status: 404 });
  if (p.photo.startsWith("/")) return NextResponse.redirect(new URL(p.photo, req.nextUrl.origin));
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(p.photo);
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: {
      "content-type": m[1],
      "cache-control": approved ? "public, max-age=86400, immutable" : "private, no-store",
    },
  });
}
