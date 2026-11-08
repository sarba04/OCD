import { NextResponse, after, type NextRequest } from "next/server";
import { validPhone } from "@/lib/validate";
import { notifyApplication } from "@/lib/server/notify";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.website) return NextResponse.json({ ok: true });
  const a = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    fullName: clean(body.fullName, 80),
    phone: clean(body.phone, 24),
    city: clean(body.city, 60),
    why: clean(body.why, 600),
    link: clean(body.link, 300),
  };
  const errors: Record<string, string> = {};
  if (a.fullName.length < 4) errors.fullName = "Ton prénom et ton nom.";
  if (!validPhone(a.phone)) errors.phone = "Ce numéro semble incomplet.";
  if (a.city.length < 2) errors.city = "Ta ville.";
  if (a.why.length < 20) errors.why = "Dis-nous en un peu plus (20 caractères minimum).";
  if (Object.keys(errors).length) return NextResponse.json({ message: "À compléter.", errors }, { status: 400 });
  await (await getStore()).createApplication(a);
  after(() => notifyApplication(a));
  return NextResponse.json({ ok: true }, { status: 201 });
}
