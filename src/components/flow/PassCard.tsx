"use client";
import { useMemo } from "react";
import { renderSVG } from "uqr";
import { Logo } from "@/components/brand/Logo";
import { getCountry } from "@/lib/countries";
import { fcfa } from "@/lib/format";
import { formatDay, formatTime, offsetFromStudio, type Interval } from "@/lib/schedule";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface PassData {
  ref?: string;
  mode: Mode;
  country: string;
  sessions: Interval[];
  packName: string;
  price: number;
  businessName: string;
  fullName: string;
}

const WD = ["DIM.", "LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM."];

/** Le Pass Live : un vrai billet, avec sa coupe à 45°, son talon perforé et son QR pour la régie. */
export function PassCard({ data, stamped, className }: { data: PassData; stamped?: boolean; className?: string }) {
  const first = data.sessions[0];
  const d = new Date(first.start);
  const c = getCountry(data.country);
  const showLocal = data.mode === "remote" && c && offsetFromStudio(c.tz, first.start) !== 0;
  const qr = useMemo(() => {
    if (!data.ref) return null;
    const url = `${typeof location !== "undefined" ? location.origin : ""}/regie?ref=${data.ref}`;
    return renderSVG(url, { border: 0, blackColor: "#16120E", whiteColor: "#FFFFFF" });
  }, [data.ref]);

  return (
    <div className={cn("relative mx-auto w-full max-w-[460px] drop-shadow-[0_24px_40px_rgb(22_18_14/0.18)]", className)}>
      <div className="chamfer-lg overflow-hidden bg-card">
        {/* bandeau orange */}
        <div className="flex items-center justify-between gap-3 bg-orange px-5 py-4">
          <Logo tone="ink" size={22} />
          <div className="text-right">
            <p className="text-[12px] font-semibold text-ink">Pass Live</p>
            <p className="tabular text-[15px] font-bold tracking-[0.02em] text-ink">{data.ref ?? "OCD-••••-••••"}</p>
          </div>
        </div>

        {/* date + heure */}
        <div className="grid grid-cols-[auto_1fr] items-end gap-5 px-5 pt-5 pb-4">
          <div className="leading-none">
            <p className="display text-[20px] text-orange-ink">{WD[d.getUTCDay()]}</p>
            <p className="display tabular text-[64px] tracking-[-0.05em]">{String(d.getUTCDate()).padStart(2, "0")}</p>
            <p className="display text-[20px]">DÉC.</p>
          </div>
          <div className="min-w-0 pb-1">
            <p className="tabular text-[28px] leading-none font-extrabold tracking-[-0.02em]">
              {formatTime(first.start)}<span className="text-ink-3">–</span>{formatTime(first.end)}
            </p>
            <p className="mt-1.5 text-[13px] text-ink-3">heure de Lomé</p>
            {showLocal && c && (
              <p className="tabular mt-0.5 text-[13.5px] font-semibold text-ink-2">
                {formatTime(first.start, c.tz)} chez toi, à {c.city}
              </p>
            )}
          </div>
        </div>
        {data.sessions.length > 1 && (
          <p className="tabular -mt-1 px-5 pb-4 text-[13px] leading-relaxed text-ink-2">
            {data.sessions.length} lives : {data.sessions.map((s) => formatDay(s.start.slice(0, 10), "short")).join(", ")}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line px-5 py-4 text-[14px]">
          <Item k="Format" v={data.mode === "studio" ? "Au studio, Lomé" : `À distance${c ? `, ${c.name}` : ""}`} />
          <Item k="Pack" v={data.packName} />
          <Item k="Business" v={data.businessName || "—"} />
          <Item k="Total" v={fcfa(data.price)} strong />
        </dl>

        {/* talon perforé */}
        <div className="relative h-5">
          <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-paper" />
          <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-paper" />
          <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-line-2" />
        </div>
        <div className="flex items-center gap-4 px-5 pt-2 pb-6">
          {qr ? (
            <div className="size-[84px] shrink-0 bg-white p-1.5 ring-1 ring-line [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          ) : (
            <div className="grid size-[84px] shrink-0 place-items-center bg-paper-2 text-center text-[11px] text-ink-3">QR après confirmation</div>
          )}
          <p className="text-[13.5px] leading-snug text-ink-2">
            {data.mode === "studio"
              ? "Montre ce code à la régie en arrivant au studio. Prévois d'être là 20 minutes avant."
              : "Garde ce pass : ton animatrice t'appelle la veille pour tester la connexion."}
          </p>
        </div>
      </div>

      {stamped && (
        <div className="animate-stamp pointer-events-none absolute top-[31%] right-5 select-none" aria-hidden>
          <div className="border-[2.5px] border-ok px-2.5 py-0.5 text-[17px] font-extrabold tracking-[0.14em] text-ok opacity-90 mix-blend-multiply">RÉSERVÉ</div>
        </div>
      )}
    </div>
  );
}

function Item({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-ink-3">{k}</dt>
      <dd className={cn("mt-0.5 truncate text-ink", strong ? "tabular text-[17px] font-extrabold" : "font-semibold")}>{v}</dd>
    </div>
  );
}
