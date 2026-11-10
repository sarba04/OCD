import { NextResponse } from "next/server";
import { PAYMENT_LABEL } from "@/lib/config";
import { getCountry } from "@/lib/countries";
import { formatDay, formatTime } from "@/lib/schedule";
import { isAdmin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import { STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Export compatible Excel (séparateur point-virgule + BOM UTF-8 pour les accents). */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const bookings = await (await getStore()).listBookings();
  const head = ["Réf", "Statut", "Format", "Pays", "Jour", "Début (Lomé)", "Fin (Lomé)", "Nb lives", "Pack", "Prix (F CFA)", "Paiement",
    "Business", "Catégorie", "Présentation", "Numéro à l'écran", "Adresse", "Livre", "Réseaux", "Contact", "WhatsApp", "E-mail", "Réservé le"];
  const rows = bookings.map((b) => {
    const s = b.sessions[0];
    return [b.ref, STATUS_LABEL[b.status], b.mode === "studio" ? "Studio Lomé" : "À distance", getCountry(b.country)?.name ?? b.country,
      formatDay(s.start.slice(0, 10)), formatTime(s.start), formatTime(s.end), b.sessions.length, b.packName, b.price,
      PAYMENT_LABEL[b.paymentMethod] ?? b.paymentMethod, b.business.name, b.business.category,
      b.business.pitch, b.business.displayPhone, b.business.address, b.business.delivers ? "oui" : "non", b.business.social,
      b.contact.fullName, b.contact.phone, b.contact.email, new Date(b.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Lome" })];
  });
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ocd-live-reservations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
