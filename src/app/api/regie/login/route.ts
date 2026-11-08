import { NextResponse, type NextRequest } from "next/server";
import { adminPassword, checkPassword, COOKIE, sessionToken } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  if (!adminPassword())
    return NextResponse.json({ message: "La Régie n'est pas encore configurée (variable ADMIN_PASSWORD manquante)." }, { status: 503 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  await new Promise((r) => setTimeout(r, 350)); // freine les essais en rafale
  if (typeof password !== "string" || !checkPassword(password))
    return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 401 });
  const { value, maxAge } = sessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  return res;
}
