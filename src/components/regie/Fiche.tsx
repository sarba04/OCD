/* eslint-disable @next/next/no-img-element */
"use client";
import { Copy, ExternalLink, LoaderCircle, MapPin, MessageCircle, Phone, Truck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_METHODS } from "@/lib/config";
import { getCountry } from "@/lib/countries";
import { fcfa, waLink } from "@/lib/format";
import { formatDay, formatTime } from "@/lib/schedule";
import { STATUS_LABEL, type Booking, type BookingStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { StatusChip, type Row } from "./RegieApp";

const ACTIONS: { s: BookingStatus; label: string; tone?: "danger" }[] = [
  { s: "paid", label: "Paiement reçu" },
  { s: "confirmed", label: "Confirmer" },
  { s: "done", label: "Live fait" },
  { s: "no_show", label: "Absent" },
  { s: "pending", label: "Remettre en attente" },
  { s: "cancelled", label: "Annuler", tone: "danger" },
];

export function Fiche({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: (b: Row) => void }) {
  const [b, setB] = useState<Booking | null>(null);
  const [overlay, setOverlay] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<BookingStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setB(null);
    setErr(null);
    fetch(`/api/regie/bookings/${id}`)
      .then(async (r) => {
        const j = await r.json();
        if (!alive) return;
        if (!r.ok) setErr(j.message);
        else {
          setB(j.booking);
          setOverlay(`${location.origin}${j.overlay}`);
        }
      })
      .catch(() => alive && setErr("Connexion perdue."));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);

  async function setStatus(s: BookingStatus) {
    if (!b) return;
    if (s === "cancelled" && !confirm(`Annuler la réservation de ${b.business.name} ? Le créneau redeviendra libre.`)) return;
    setBusy(s);
    setErr(null);
    const r = await fetch(`/api/regie/bookings/${b.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: s }) }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setBusy(null);
    if (!r?.ok) return setErr(j?.message || "Mise à jour impossible.");
    setB((x) => (x ? { ...x, status: s } : x));
    onChanged(j.booking);
  }

  const c = b ? getCountry(b.country) : null;
  const pay = b ? PAYMENT_METHODS.find((p) => p.id === b.paymentMethod)?.label : "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Fiche vendeur">
      <button aria-label="Fermer la fiche" onClick={onClose} className="animate-fade absolute inset-0 cursor-default bg-black/60" />
      <div ref={panel} tabIndex={-1} className="animate-sheet relative flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-night-2 outline-none sm:animate-fade">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-night-line bg-night-2 px-5 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[12.5px] text-night-ink-2">{b?.ref ?? "…"}</p>
            {b && <StatusChip s={b.status} />}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="grid size-11 place-items-center text-night-ink-2 hover:text-night-ink">
            <X className="size-6" />
          </button>
        </div>

        {!b ? (
          <div className="grid flex-1 place-items-center p-10 text-night-ink-2">{err ?? <LoaderCircle className="size-6 animate-spin" aria-label="Chargement" />}</div>
        ) : (
          <div className="px-5 pt-5 pb-10">
            {/* Business */}
            <div className="flex gap-4">
              {b.photo ? (
                <img src={b.photo} alt={`Produit de ${b.business.name}`} className="chamfer size-24 shrink-0 object-cover" />
              ) : (
                <div className="chamfer grid size-24 shrink-0 place-items-center bg-night-3 text-[28px] font-extrabold text-night-orange">
                  {b.business.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="eyebrow text-[10.5px] text-night-orange">{b.business.category}</p>
                <h2 className="display mt-1 text-[28px]">{b.business.name}</h2>
                <p className="mt-1.5 text-[15px] leading-snug text-night-ink">{b.business.pitch}</p>
                {b.business.priceHint && <p className="mt-1 text-[13.5px] text-night-ink-2">Prix : {b.business.priceHint}</p>}
              </div>
            </div>

            {/* Ce qui passe à l'écran */}
            <section className="mt-6 bg-night px-4 py-4 ring-1 ring-night-line ring-inset">
              <p className="eyebrow text-[10.5px] text-night-ink-2">À l&apos;écran pendant le live</p>
              <p className="tabular mt-2 flex items-center gap-2 text-[17px] font-bold">
                <MessageCircle className="size-4 text-night-orange" aria-hidden /> {b.business.displayPhone}
              </p>
              <p className="mt-1 flex items-start gap-2 text-[15px]">
                <MapPin className="mt-1 size-4 shrink-0 text-night-orange" aria-hidden /> {b.business.address}
              </p>
              {b.business.delivers && (
                <p className="mt-1 flex items-center gap-2 text-[14px] text-night-ink-2">
                  <Truck className="size-4" aria-hidden /> Livre ou expédie
                </p>
              )}
              {b.business.social && <p className="mt-1 text-[14px] text-night-ink-2">{b.business.social}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={overlay} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 bg-night-orange px-3 text-[14px] font-bold text-ink">
                  <ExternalLink className="size-4" aria-hidden /> Bandeau du live
                </a>
                <button
                  onClick={async () => {
                    await navigator.clipboard?.writeText(overlay).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex h-10 items-center gap-2 px-3 text-[14px] font-semibold ring-1 ring-night-line ring-inset hover:bg-night-3"
                >
                  <Copy className="size-4" aria-hidden /> {copied ? "Lien copié" : "Copier le lien (OBS)"}
                </button>
              </div>
            </section>

            {/* Créneaux */}
            <section className="mt-6">
              <h3 className="eyebrow text-[10.5px] text-night-ink-2">
                {b.sessions.length > 1 ? `${b.sessions.length} lives` : "Live"} · Pack {b.packName} · {fcfa(b.price)}
              </h3>
              <ul className="mt-2 grid gap-1.5">
                {b.sessions.map((s) => (
                  <li key={s.start} className="tabular flex flex-wrap items-baseline gap-x-3 text-[15.5px]">
                    <span className="font-semibold first-letter:uppercase">{formatDay(s.start.slice(0, 10))}</span>
                    <span>
                      {formatTime(s.start)}–{formatTime(s.end)} <span className="text-night-ink-2">Lomé</span>
                    </span>
                    {b.mode === "remote" && c && c.tz !== "Africa/Lome" && (
                      <span className="text-[13.5px] text-night-ink-2">
                        ({formatTime(s.start, c.tz)} à {c.city})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[14px] text-night-ink-2">
                {b.mode === "studio" ? "Vient au studio à Lomé" : `À distance depuis ${c?.name ?? b.country} : prévoir une animatrice`} · Paiement : {pay}
              </p>
            </section>

            {/* Contact */}
            <section className="mt-6">
              <h3 className="eyebrow text-[10.5px] text-night-ink-2">Contact</h3>
              <p className="mt-2 text-[17px] font-bold">{b.contact.fullName}</p>
              <p className="tabular text-[15px] text-night-ink-2">
                {b.contact.phone}
                {b.contact.email ? ` · ${b.contact.email}` : ""}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={waLink(b.contact.phone, `Bonjour ${b.contact.fullName.split(" ")[0]}, ici l'équipe OCD Live pour ton live du ${formatDay(b.sessions[0].start.slice(0, 10))} (réf. ${b.ref}).`)}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 items-center justify-center gap-2 bg-[#1f3d2c] text-[15px] font-semibold text-[#7ee2a8] ring-1 ring-[#2c5a40] ring-inset"
                >
                  <MessageCircle className="size-5" aria-hidden /> WhatsApp
                </a>
                <a href={`tel:${b.contact.phone.replace(/\s/g, "")}`} className="inline-flex h-12 items-center justify-center gap-2 text-[15px] font-semibold ring-1 ring-night-line ring-inset hover:bg-night-3">
                  <Phone className="size-5" aria-hidden /> Appeler
                </a>
              </div>
            </section>

            {/* Statut */}
            <section className="mt-8 border-t border-night-line pt-5">
              <h3 className="eyebrow text-[10.5px] text-night-ink-2">Changer le statut</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIONS.filter((a) => a.s !== b.status).map((a) => (
                  <button
                    key={a.s}
                    onClick={() => setStatus(a.s)}
                    disabled={!!busy}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 px-3.5 text-[14px] font-semibold ring-1 ring-inset transition-colors disabled:opacity-50",
                      a.tone === "danger" ? "text-[#ff8a7a] ring-[#6e211c] hover:bg-[#3a1210]" : "text-night-ink ring-night-line hover:bg-night-3",
                    )}
                  >
                    {busy === a.s && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                    {a.label}
                  </button>
                ))}
              </div>
              {err && (
                <p role="alert" className="mt-3 text-[14px] font-medium text-[#ff8a7a]">
                  {err}
                </p>
              )}
              <p className="mt-4 text-[12.5px] text-night-ink-2">
                Réservé le {new Date(b.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Lome", dateStyle: "long", timeStyle: "short" })} · statut actuel : {STATUS_LABEL[b.status]}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
