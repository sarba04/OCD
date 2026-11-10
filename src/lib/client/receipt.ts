import { encode } from "uqr";
import { BRAND, PAYMENT_LABEL, getPack } from "../config";
import { getCountry } from "../countries";
import { fcfa } from "../format";
import { formatDay, formatTime } from "../schedule";
import type { PublicBooking } from "../types";

/** Les espaces insécables du français (15 000 F) ne sont pas dans la police PDF de base : on les remplace. */
const t = (s: string) => s.replace(/[  ]/g, " ").replace(/[–—]/g, "-").replace(/[’]/g, "'");

async function logoPng(): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.src = "/brand/ocd-logo.svg";
    await img.decode();
    const w = 951;
    const h = 368;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return { data: c.toDataURL("image/png"), w, h };
  } catch {
    return null;
  }
}

/**
 * Le reçu de réservation, en PDF A4, fabriqué sur le téléphone (aucun envoi au serveur) :
 * référence, client, business, dates du live, montant, moyen de paiement, et le QR à présenter à la régie.
 */
export async function downloadReceipt(b: PublicBooking, mode: "download" | "print" = "download") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  const ink: [number, number, number] = [22, 18, 14];
  const grey: [number, number, number] = [110, 102, 92];
  const orange: [number, number, number] = [241, 105, 3];
  const pack = getPack(b.packId);
  const country = getCountry(b.country);
  const paid = ["mtn", "orange", "wave", "card"].includes(b.paymentMethod);

  // bandeau orange fin en haut
  doc.setFillColor(...orange);
  doc.rect(0, 0, W, 4, "F");

  const logo = await logoPng();
  if (logo) doc.addImage(logo.data, "PNG", M, 14, 34, (34 * logo.h) / logo.w);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text("Live", M + 36, 26);

  doc.setFontSize(10);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("REÇU DE RÉSERVATION", W - M, 17, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ink);
  doc.text(b.ref, W - M, 24, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...grey);
  doc.text(t(`Émis le ${new Date(b.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`), W - M, 30, { align: "right" });

  // titre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text(t(`${b.business.name}`), M, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor(...grey);
  doc.text(t(`Live ${b.packName} · ${b.mode === "studio" ? "Au studio OCD, Lomé" : `À distance${country ? `, depuis ${country.name}` : ""}`}`), M, 60);

  // statut
  const status = paid ? "PAIEMENT CONFIRMÉ (SIMULATION, AUCUN DÉBIT)" : "PAIEMENT EN ATTENTE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const sw = doc.getTextWidth(status) + 8;
  doc.setDrawColor(paid ? 23 : 179, paid ? 112 : 74, paid ? 74 : 0);
  doc.setTextColor(paid ? 23 : 179, paid ? 112 : 74, paid ? 74 : 0);
  doc.roundedRect(M, 66, sw, 8, 4, 4, "S");
  doc.text(status, M + 4, 71.4);

  // blocs d'informations
  let y = 88;
  const block = (title: string, rows: [string, string][]) => {
    doc.setDrawColor(230, 222, 210);
    doc.line(M, y, W - M, y);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...orange);
    doc.text(title.toUpperCase(), M, y);
    y += 6;
    for (const [k, v] of rows) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...grey);
      doc.text(t(k), M, y);
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      const lines = doc.splitTextToSize(t(v), W - M - 70);
      doc.text(lines, 70, y);
      y += 6.2 * lines.length;
    }
    y += 3;
  };

  block("Ton live", [
    ...b.sessions.map((s, i): [string, string] => [
      b.sessions.length > 1 ? `Live ${i + 1}` : "Date",
      `${formatDay(s.start.slice(0, 10))}, ${formatTime(s.start)}-${formatTime(s.end)} (heure de Lomé)${
        b.mode === "remote" && country && country.tz !== "Africa/Lome" ? ` · ${formatTime(s.start, country.tz)} à ${country.city}` : ""
      }`,
    ]),
    ["Lieu", b.mode === "studio" ? BRAND.studioAddress : "À distance, avec une animatrice OCD"],
    ["Pack", `${b.packName}${pack ? ` · ${pack.includes.join(" · ")}` : ""}`],
  ]);
  block("Client", [
    ["Nom", b.contact.fullName],
    ["WhatsApp", b.contact.phone],
    ...(b.contact.email ? ([["E-mail", b.contact.email]] as [string, string][]) : []),
    ["Business", `${b.business.name} (${b.business.category})`],
    ["Numéro à l'écran", b.business.displayPhone],
  ]);
  block("Paiement", [
    ["Moyen", `${PAYMENT_LABEL[b.paymentMethod] ?? b.paymentMethod}${paid ? " (simulation)" : ""}`],
    ...(pack?.regular ? ([["Prix normal", fcfa(pack.regular)], ["Remise de lancement", `- ${fcfa(pack.regular - b.price)}`]] as [string, string][]) : []),
  ]);

  // total
  doc.setFillColor(253, 240, 228);
  doc.roundedRect(M, y, W - 2 * M, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text("Total", M + 6, y + 11.5);
  doc.setFontSize(18);
  doc.text(t(fcfa(b.price)), W - M - 6, y + 12, { align: "right" });
  y += 28;

  // QR pour la régie
  const qr = encode(`${location.origin}/regie?ref=${b.ref}`, { border: 0 });
  const size = 34;
  const cell = size / qr.size;
  const qx = M;
  const qy = Math.min(y, 297 - 18 - size - 6);
  doc.setFillColor(...ink);
  qr.data.forEach((row, r) => row.forEach((on, c) => on && doc.rect(qx + c * cell, qy + r * cell, cell + 0.02, cell + 0.02, "F")));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("À présenter à la régie", qx + size + 8, qy + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...grey);
  doc.text(
    doc.splitTextToSize(
      t(
        b.mode === "studio"
          ? "Montre ce reçu ou ce code en arrivant au studio, 20 minutes avant ton live."
          : "Garde ce reçu : ton animatrice t'appelle la veille pour tester la connexion.",
      ),
      W - M - (qx + size + 8),
    ),
    qx + size + 8,
    qy + 16,
  );

  // pied de page
  doc.setDrawColor(230, 222, 210);
  doc.line(M, 279, W - M, 279);
  doc.setFontSize(8.5);
  doc.text(t(`${BRAND.name} · ${BRAND.studioCity}, Togo · ${location.host}`), M, 285);
  doc.text(t("Paiement simulé tant que le paiement en ligne n'est pas activé."), W - M, 285, { align: "right" });

  if (mode === "print") {
    // le reçu s'ouvre dans un nouvel onglet, prêt à imprimer (ou « Enregistrer en PDF »)
    doc.autoPrint();
    const url = doc.output("bloburl");
    if (!window.open(url, "_blank")) doc.save(`recu-ocd-live-${b.ref}.pdf`);
  } else doc.save(`recu-ocd-live-${b.ref}.pdf`);
}
