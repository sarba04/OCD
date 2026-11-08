/* eslint-disable @next/next/no-img-element */
"use client";
import { CalendarPlus, Check, Download, LoaderCircle, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BRAND, PAYMENT_METHODS } from "@/lib/config";
import { getCountry } from "@/lib/countries";
import { fcfa, waLink } from "@/lib/format";
import { formatDay, formatTime } from "@/lib/schedule";
import type { PublicBooking } from "@/lib/types";
import { bookingIcs, download } from "@/lib/client/ics";
import { drawPoster } from "@/lib/client/poster";
import { GhostButton, InkButton, PrimaryButton } from "@/components/ui/kit";
import { PassCard } from "./PassCard";
import { DayTrack, GuideHours } from "@/components/broadcast/ProgramGuide";
import { SCHEDULE } from "@/lib/config";
import { addMinutes } from "@/lib/schedule";

export function StepDone({
  booking: b,
  photo,
  titleRef,
  onRestart,
}: {
  booking: PublicBooking;
  photo: string | null;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onRestart: () => void;
}) {
  const first = b.sessions[0];
  const c = getCountry(b.country);
  const firstName = b.contact.fullName.split(/\s+/)[0];
  const pay = PAYMENT_METHODS.find((p) => p.id === b.paymentMethod);

  const [poster, setPoster] = useState<{ blob: Blob; url: string } | null>(null);
  const [posterError, setPosterError] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let url = "";
    drawPoster(b, photo)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setPoster({ blob, url });
      })
      .catch(() => setPosterError(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [b, photo]);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [titleRef]);

  const posterName = `live-ocd-${b.ref}.png`;
  async function sharePoster() {
    if (!poster) return;
    const file = new File([poster.blob], posterName, { type: "image/png" });
    const text = `Je passe en live sur ${BRAND.liveAccount} le ${formatDay(first.start.slice(0, 10))} ! Viens découvrir ${b.business.name}.`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        setShared(true);
        return;
      }
    } catch {
      return; // partage annulé
    }
    download(posterName, poster.blob);
  }

  const teamMsg = [
    `Bonjour OCD Live, je viens de réserver mon live.`,
    `Réf : ${b.ref}`,
    `${formatDay(first.start.slice(0, 10))}, ${formatTime(first.start)}–${formatTime(first.end)} (Lomé)`,
    `Pack ${b.packName}, ${fcfa(b.price)}`,
    `Business : ${b.business.name}`,
  ].join("\n");
  const teamLink = BRAND.whatsapp ? waLink(BRAND.whatsapp, teamMsg) : `https://wa.me/?text=${encodeURIComponent(teamMsg)}`;

  const payNumber = b.paymentMethod === "flooz" ? BRAND.payFlooz : b.paymentMethod === "mixx" ? BRAND.payMixx : "";

  return (
    <div className="animate-rise grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
      <div>
        <p className="flex items-center gap-2 text-[15px] font-semibold text-ok">
          <span className="grid size-5 place-items-center rounded-full bg-ok text-white">
            <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
          </span>
          Réservation enregistrée
        </p>
        <h1 ref={titleRef} tabIndex={-1} className="tv mt-3 text-[52px] outline-none sm:text-[80px]">
          <span className="block">{firstName},</span>
          <span className="block text-orange-ink">ton live est programmé.</span>
        </h1>
        <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-ink-2">
          {b.mode === "studio" ? "On t'attend au studio le " : "Tu passes en live le "}
          <strong className="font-semibold text-ink">
            {formatDay(first.start.slice(0, 10))} à {b.mode === "remote" && c ? formatTime(first.start, c.tz) : formatTime(first.start)}
          </strong>
          {b.mode === "remote" && c && c.tz !== "Africa/Lome" ? ` (heure de ${c.city})` : ""}. L&apos;équipe OCD vient de recevoir ta fiche.
        </p>

        {/* ton live entre dans la grille des programmes */}
        <div className="mt-7 border-y-2 border-ink bg-[#f3eee6] px-2 pt-2 pb-1" aria-hidden>
          <p className="mono-label px-1 pb-2 text-ink-3">Grille du {formatDay(first.start.slice(0, 10), "short")}</p>
          <GuideHours />
          <DayTrack
            tall
            day={first.start.slice(0, 10)}
            busy={b.sessions.map((s) => ({ start: s.start, end: addMinutes(s.end, SCHEDULE.bufferMinutes) }))}
            now={new Date(0)}
            highlight={[first]}
            highlightLabel={b.business.name}
          />
        </div>

        {/* la fente de l'imprimante à tickets */}
        <div aria-hidden className="relative z-10 mx-auto mt-8 h-4 w-[min(100%,500px)] rounded-full bg-ink shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
          <span className="absolute inset-x-5 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black" />
        </div>
        <div className="-mx-4 -mt-2 overflow-hidden px-4 pb-10">
          <div className="print-out">
          <PassCard
            stamped
            data={{
              ref: b.ref,
              mode: b.mode,
              country: b.country,
              sessions: b.sessions,
              packName: b.packName,
              price: b.price,
              businessName: b.business.name,
              fullName: b.contact.fullName,
            }}
          />
          </div>
        </div>
        <div className="mx-auto mt-6 grid max-w-[460px] gap-2.5 sm:grid-cols-2">
          <GhostButton onClick={() => download(`ocd-live-${b.ref}.ics`, new Blob([bookingIcs(b)], { type: "text/calendar" }))}>
            <CalendarPlus className="size-5" aria-hidden /> Ajouter à l&apos;agenda
          </GhostButton>
          <a
            href={teamLink}
            target="_blank"
            rel="noopener"
            className="edge chamfer-sm inline-flex h-12 items-center justify-center gap-2 px-5 text-[15px] font-semibold text-ink [--edge:var(--color-line-2)] hover:[--edge:var(--color-ink)]"
          >
            <MessageCircle className="size-5" aria-hidden /> Écrire à l&apos;équipe
          </a>
        </div>
      </div>

      <div className="grid content-start gap-10">
        <figure className="chamfer-lg relative overflow-hidden bg-night">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/studio-night-640.webp"
            srcSet="/media/studio-night-640.webp 640w, /media/studio-night-1200.webp 1200w"
            sizes="(min-width: 1024px) 560px, 100vw"
            width={1200}
            height={1313}
            decoding="async"
            alt="Le studio OCD Live, mur Afrique allumé, prêt pour le live"
            className="block aspect-[16/10] h-auto w-full object-cover object-[50%_40%]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pt-10 pb-4 text-[17px] font-bold text-white">
            {b.mode === "studio" ? "Le studio t'attend." : "La régie t'attend, ton animatrice aussi."}
          </figcaption>
        </figure>
        {/* 1. Payer */}
        <section className="border-t-2 border-ink pt-5">
          <h2 className="text-[22px] font-bold tracking-[-0.015em]">
            {b.paymentMethod === "cash" ? "Tu paies au studio" : b.paymentMethod === "later" ? "L'équipe te contacte" : `Paie ${fcfa(b.price)} par ${pay?.label}`}
          </h2>
          <div className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
            {b.paymentMethod === "cash" && <p>Le jour J, avant ton live. Ta place reste bloquée : l&apos;équipe te confirme tout sur WhatsApp.</p>}
            {b.paymentMethod === "later" && <p>Sous 24 h sur WhatsApp, pour trouver le moyen de paiement qui t&apos;arrange (Wave, transfert, carte…).</p>}
            {(b.paymentMethod === "flooz" || b.paymentMethod === "mixx") && (
              <ol className="grid gap-1.5">
                <li>
                  1. Envoie <strong className="tabular font-semibold text-ink">{fcfa(b.price)}</strong>{" "}
                  {payNumber ? (
                    <>
                      au <strong className="tabular font-semibold text-ink">{payNumber}</strong>
                    </>
                  ) : (
                    "au numéro que l'équipe t'envoie sur WhatsApp"
                  )}
                  .
                </li>
                <li>
                  2. Mets la référence <strong className="tabular font-bold tracking-[0.02em] text-ink">{b.ref}</strong> en motif.
                </li>
                <li>3. Ta place est confirmée dès réception. Tu as 24 h.</li>
              </ol>
            )}
          </div>
        </section>

        {/* 2. Affiche */}
        <section className="border-t-2 border-ink pt-5">
          <h2 className="text-[22px] font-bold tracking-[-0.015em]">Fais venir tes clients</h2>
          <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
            Ton affiche est prête. Mets-la en statut WhatsApp et sur TikTok : tes clients sauront quand te retrouver. Le marketing avant la vente.
          </p>
          <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-5">
            <div className="chamfer aspect-[9/16] overflow-hidden bg-paper-2 shadow-[0_18px_30px_-18px_rgb(22_18_14/0.5)]">
              {poster ? (
                <img src={poster.url} alt={`Affiche du live de ${b.business.name}`} className="h-full w-full object-cover" />
              ) : posterError ? (
                <p className="p-3 text-[12px] text-ink-3">L&apos;affiche n&apos;a pas pu être créée sur ce téléphone.</p>
              ) : (
                <div className="grid h-full place-items-center">
                  <LoaderCircle className="size-6 animate-spin text-ink-3" aria-label="Création de l'affiche" />
                </div>
              )}
            </div>
            <div className="grid gap-2.5">
              <PrimaryButton onClick={sharePoster} disabled={!poster} arrow={false} className="w-full">
                <span className="inline-flex items-center gap-2">
                  <Share2 className="size-5" aria-hidden /> {shared ? "Partager encore" : "Partager"}
                </span>
              </PrimaryButton>
              <InkButton onClick={() => poster && download(posterName, poster.blob)} disabled={!poster} className="w-full">
                <Download className="size-5" aria-hidden /> Télécharger
              </InkButton>
            </div>
          </div>
        </section>

        {/* 3. Préparer */}
        <section className="border-t-2 border-ink pt-5">
          <h2 className="text-[22px] font-bold tracking-[-0.015em]">Prépare ton live</h2>
          <ul className="mt-3 grid gap-2.5 text-[15.5px] text-ink-2">
            {(b.mode === "studio"
              ? [
                  "Arrive 20 minutes avant : la régie t'installe.",
                  "Apporte tes produits, bien rangés, prêts à montrer.",
                  "Prépare 3 phrases sur ton business : qui tu es, ce que tu vends, pourquoi chez toi.",
                  "Annonce ton live à tes clients avec ton affiche.",
                ]
              : [
                  "La veille, ton animatrice t'appelle pour tester la connexion.",
                  "Une connexion stable (Wi-Fi ou 4G) et un téléphone chargé à 100 %.",
                  "La lumière face à toi, jamais dans ton dos.",
                  "Tes produits à portée de main, rangés dans l'ordre où tu vas les montrer.",
                ]
            ).map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="chamfer-sm mt-0.5 grid size-5 shrink-0 place-items-center bg-orange-soft text-orange-ink">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <button onClick={onRestart} className="h-11 justify-self-start text-[15px] font-semibold text-ink-2 underline decoration-line-2 underline-offset-4 hover:text-ink">
          Réserver un autre live
        </button>
      </div>
    </div>
  );
}
