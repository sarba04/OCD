/* eslint-disable @next/next/no-img-element */
"use client";
import { AtSign, MapPin, MessageCircle, RotateCw, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { renderSVG } from "uqr";
import { fcfa, initials } from "@/lib/format";
import { formatDay, formatTime } from "@/lib/schedule";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface CardData {
  name: string;
  pitch: string;
  priceHint: string;
  phone: string;
  address: string;
  delivers: boolean;
  social?: string;
  photo: string | null;
}

export interface CardMeta {
  ref?: string;
  packName: string;
  price: number;
  mode: Mode;
  /** Premier live et nombre de lives. */
  start: string;
  end: string;
  sessions: number;
  /** Heure locale du vendeur à distance, si différente de Lomé. */
  localTime?: string | null;
}

/**
 * La Carte OCD : le vendeur tel que les acheteurs le voient.
 * Recto : le produit (photo plein cadre), le nom, la phrase, le prix. Verso : comment le joindre,
 * et après la réservation, son live (date, pack, référence, QR pour la régie). On la retourne d'un geste.
 */
export function OcdCard({
  d,
  status,
  meta,
  className,
}: {
  d: CardData;
  status: "draft" | "review" | "scheduled";
  meta?: CardMeta;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const qr = useMemo(() => {
    if (!meta?.ref) return null;
    const url = `${typeof location !== "undefined" ? location.origin : ""}/regie?ref=${meta.ref}`;
    return renderSVG(url, { border: 0, blackColor: "#16120E", whiteColor: "#FFFFFF" });
  }, [meta?.ref]);

  const flipBtn = (back: boolean) => (
    <button
      type="button"
      onClick={() => setFlipped(!back)}
      aria-label={back ? "Revenir au recto de la carte" : "Retourner la carte"}
      className={cn(
        "absolute right-3 bottom-3 z-10 inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] transition-transform active:scale-95",
        back ? "bg-white text-ink" : "bg-ink text-paper",
      )}
    >
      <RotateCw className="size-4" aria-hidden /> {back ? "Recto" : "Verso"}
    </button>
  );

  return (
    <div className={cn("ocd-card mx-auto w-full max-w-[360px] [perspective:1400px]", className)}>
      <div className={cn("relative aspect-[4/5] transition-transform duration-700 ease-[var(--ease-out)] [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
        {/* ───── Recto : le produit ───── */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-ink text-white shadow-[0_40px_80px_-40px_rgb(22_18_14/0.7)] [backface-visibility:hidden]" aria-hidden={flipped} inert={flipped}>
          {d.photo ? (
            <img src={d.photo} alt={`Le produit de ${d.name || "ta boutique"}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="card-cover absolute inset-0 flex items-center justify-center" aria-hidden>
              <span className="display text-[110px] leading-none tracking-[-0.06em] text-white/90">{initials(d.name || "Ta boutique")}</span>
            </div>
          )}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" aria-hidden />

          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <img src="/brand/ocd-logo-white.svg" alt="OCD Live" width={951} height={368} className="h-5 w-auto" />
            <StatusPill status={status} start={meta?.start} />
          </div>

          {meta && (
            <div className="absolute top-14 left-4 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-md">
              <p className="text-[11.5px] font-semibold tracking-wide text-white/80 uppercase">{formatDay(meta.start.slice(0, 10), "short")}</p>
              <p className="tabular text-[20px] leading-tight font-extrabold">{formatTime(meta.start)}</p>
            </div>
          )}

          <div className="absolute inset-x-2.5 bottom-2.5 rounded-[22px] bg-white/95 p-4 pr-24 text-ink backdrop-blur">
            <p className="truncate text-[20px] leading-tight font-extrabold tracking-[-0.02em]">{d.name || "Le nom de ta boutique"}</p>
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink-2">{d.pitch || "Ce que tu vas présenter, en une phrase."}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {d.priceHint && <span className="tabular rounded-full bg-orange px-2.5 py-1 text-[12px] font-bold text-ink">{d.priceHint}</span>}
              {d.delivers && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-bold text-ok">
                  <Truck className="size-3.5" aria-hidden /> Livraison
                </span>
              )}
            </div>
          </div>
          {flipBtn(false)}
        </div>

        {/* ───── Verso : pour te joindre, et ton live ───── */}
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto rounded-[28px] bg-ink p-5 text-night-ink shadow-[0_40px_80px_-40px_rgb(22_18_14/0.7)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <p className="text-[12.5px] font-semibold text-night-ink-2">Pour te joindre</p>
          <p className="tabular mt-1 flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.02em]">
            <MessageCircle className="size-5 shrink-0 text-night-orange" aria-hidden />
            {d.phone || "+228 •• •• •• ••"}
          </p>
          <p className="mt-2 flex items-start gap-2 text-[14.5px] text-night-ink-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-night-orange" aria-hidden />
            {d.address || "Ton quartier, ta ville"}
          </p>
          {d.social && (
            <p className="mt-1.5 flex items-center gap-2 text-[14.5px] text-night-ink-2">
              <AtSign className="size-4 shrink-0 text-night-orange" aria-hidden />
              <span className="truncate">{d.social}</span>
            </p>
          )}

          {meta && (
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-night-line pt-4 text-[13.5px]">
              <Row k={meta.sessions > 1 ? `${meta.sessions} lives, dès le` : "Ton live"} v={`${formatDay(meta.start.slice(0, 10), "short")}, ${formatTime(meta.start)}–${formatTime(meta.end)}`} wide />
              {meta.localTime && <Row k="Chez toi" v={meta.localTime} wide />}
              <Row k="Lieu" v={meta.mode === "studio" ? "Studio OCD, Lomé" : "À distance"} />
              <Row k="Pack" v={meta.packName} />
              <Row k="Total" v={fcfa(meta.price)} />
              {meta.ref && <Row k="Référence" v={meta.ref} />}
            </dl>
          )}

          {qr && (
            <div className="mt-auto flex items-center gap-3 pt-4">
              <div className="size-[84px] shrink-0 rounded-xl bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="pr-20 text-[12.5px] leading-snug text-night-ink-2">À montrer à la régie {meta?.mode === "studio" ? "en arrivant au studio" : "si on te le demande"}.</p>
            </div>
          )}
          {flipBtn(true)}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="text-[11.5px] text-night-ink-2">{k}</dt>
      <dd className="tabular truncate font-semibold">{v}</dd>
    </div>
  );
}

function StatusPill({ status, start }: { status: "draft" | "review" | "scheduled"; start?: string }) {
  const left = useCountdown(status === "scheduled" ? start : undefined);
  if (status === "scheduled")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink">
        <span className="size-2 rounded-full bg-orange motion-safe:animate-pulse" aria-hidden />
        Programmé{left ? ` · ${left}` : ""}
      </span>
    );
  return (
    <span className="rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-bold backdrop-blur-md">{status === "review" ? "À confirmer" : "Aperçu"}</span>
  );
}

/** « dans 22 j 14 h », « dans 3 h 05 », « dans 12 min » — mis à jour chaque minute. */
export function useCountdown(iso?: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso || now === null) return null;
  const m = Math.round((new Date(iso).getTime() - now) / 60000);
  if (m <= 0) return "c'est l'heure";
  const j = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (j > 0) return `dans ${j} j ${h} h`;
  if (h > 0) return `dans ${h} h ${String(min).padStart(2, "0")}`;
  return `dans ${min} min`;
}
