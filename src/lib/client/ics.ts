import { BRAND } from "../config";
import type { PublicBooking } from "../types";

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

/** Fichier agenda (.ics) : un évènement par live, avec rappels la veille et 2 h avant. */
export function bookingIcs(b: PublicBooking) {
  const where = b.mode === "studio" ? BRAND.studioAddress : "À distance (ton animatrice OCD t'appelle)";
  const events = b.sessions.map((s, i) =>
    [
      "BEGIN:VEVENT",
      `UID:${b.ref}-${i}@ocd-live`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(s.start)}`,
      `DTEND:${stamp(s.end)}`,
      `SUMMARY:${esc(`Mon live OCD · ${b.business.name}`)}`,
      `LOCATION:${esc(where)}`,
      `DESCRIPTION:${esc(`Pass ${b.ref} · Pack ${b.packName}.\nEn direct sur ${BRAND.liveAccount}.\nPrépare tes produits et ton plus beau sourire.`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Demain, tu passes en live sur OCD Live",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Ton live OCD commence dans 2 heures",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"),
  );
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OCD Live//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...events, "END:VCALENDAR"].join("\r\n");
}

export function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
