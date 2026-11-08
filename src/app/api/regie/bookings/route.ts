import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { getStore, isDemo } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const store = await getStore();
  const [bookings, applications] = await Promise.all([store.listBookings(), store.listApplications()]);
  return NextResponse.json(
    {
      // la liste n'embarque pas les photos (lourdes) : on les charge à l'ouverture d'une fiche
      bookings: bookings.map(({ photo, ...b }) => ({ ...b, hasPhoto: !!photo })),
      applications,
      demo: isDemo(),
      now: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
