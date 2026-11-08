import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  return NextResponse.json({ applications: await (await getStore()).listApplications() });
}
