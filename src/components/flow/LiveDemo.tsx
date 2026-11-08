"use client";
import { Heart, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StudioWall } from "@/components/brand/StudioWall";
import { BRAND } from "@/lib/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LowerThird, type PreviewData } from "./LivePreview";

/* Exemples de bandeaux (vendeurs fictifs, numéros masqués) pour montrer ce qui passe à l'écran. */
const EXAMPLES: PreviewData[] = [
  { name: "Afi Wax Couture", pitch: "Robes et ensembles en wax cousus main, du 36 au 52", phone: "+228 90 •• •• 41", address: "Bè-Kpota, Lomé", delivers: true, priceHint: "dès 8 000 F", photo: null },
  { name: "Mimi Hair", pitch: "Perruques naturelles et tissages brésiliens", phone: "+237 6 •• •• •• 18", address: "Akwa, Douala", delivers: true, priceHint: "dès 25 000 F", photo: null },
  { name: "Jus Sika", pitch: "Bissap, gingembre et baobab, sans sucre ajouté", phone: "+228 92 •• •• 07", address: "Adidogomé, Lomé", delivers: true, priceHint: "1 000 F", photo: null },
  { name: "Sahel Cuirs", pitch: "Sacs et sandales en cuir tanné à la main", phone: "+235 66 •• •• 30", address: "Moursal, N'Djamena", delivers: false, priceHint: "dès 12 000 F", photo: null },
];

const COMMENTS: [string, string][][] = [
  [["kafui.tg", "elle existe en bleu ?"], ["mamie_237", "vous livrez à Kara ?"], ["sena_b", "je prends la rouge"]],
  [["lady.douala", "c'est combien la longue ?"], ["ines_cm", "trop belle 😍"], ["mel.yde", "dispo en 24 pouces ?"]],
  [["kossi_k", "la bouteille de 1 L ?"], ["afi.tg", "livraison à Bè ?"], ["yao", "j'ai commandé 6"]],
  [["moussa.td", "taille 43 dispo ?"], ["fatime", "le sac marron svp"], ["abakar", "prix pour 3 paires ?"]],
];

/** Un live en cours, comme le voient les spectateurs : le bandeau du vendeur change toutes les 3 secondes. */
function OnAirPhone() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return;
    const t = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, [visible, reduced]);

  const d = EXAMPLES[i];
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[320px]">
      {/* la lumière du plateau derrière le téléphone */}
      <div className="absolute -inset-16 rounded-full bg-[radial-gradient(closest-side,rgb(241_105_3/0.35),transparent)]" aria-hidden />
      <div className="relative aspect-[9/18] rounded-[40px] bg-[#050403] p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1.5px_rgb(255_255_255/0.08)]">
        <div className="relative h-full w-full overflow-hidden rounded-[31px] bg-[#e9e4dd]">
          {/* la caméra filme le mur du studio */}
          <div className="wall absolute inset-0" />
          <StudioWall animate={false} className="absolute top-[7%] left-1/2 w-[92%] -translate-x-1/2" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-45% to-black/75" />

          {/* barre du haut */}
          <div className="absolute inset-x-3 top-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ocd-logo.svg" alt="" className="w-6" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] leading-tight font-semibold text-white">
              {BRAND.liveAccount}
              <span className="block truncate text-[10px] font-normal text-white/75">avec {d.name}</span>
            </span>
            <span className="rounded-[4px] bg-live px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">LIVE</span>
            <span className="tabular inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Users className="size-3" aria-hidden /> {(1.2 + i * 0.3).toFixed(1).replace(".", ",")}k
            </span>
          </div>

          {/* commentaires */}
          <div key={`c${i}`} className="lt-in absolute right-12 bottom-[33%] left-3 grid gap-1.5 text-[10.5px] leading-snug text-white">
            {COMMENTS[i].map(([u, t]) => (
              <p key={u} className="w-fit max-w-full rounded-full bg-black/30 px-2 py-0.5">
                <b className="font-semibold text-white/70">{u}</b> {t}
              </p>
            ))}
          </div>

          {/* cœurs */}
          {!reduced && visible && (
            <div className="absolute right-3 bottom-[30%] h-40 w-8" aria-hidden>
              {[0, 1, 2, 3, 4].map((k) => (
                <Heart
                  key={k}
                  className="absolute bottom-0 left-1 size-5 fill-live text-live"
                  style={{ animation: `float-up 2.8s var(--ease-out) ${k * 0.55}s infinite`, ["--dx" as string]: `${(k % 2 ? -1 : 1) * (6 + k * 3)}px` } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {/* le bandeau du vendeur */}
          <div key={i} className="lt-in absolute inset-x-3 bottom-5">
            <LowerThird d={d} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveDemo() {
  const steps = [
    { t: "Choisis ta scène", d: "Au studio à Lomé, ou à distance depuis ta boutique." },
    { t: "Ton jour, ton heure, ton pack", d: "Tout décembre est ouvert. Les créneaux pris disparaissent en direct." },
    { t: "Tu passes en live", d: `En direct sur ${BRAND.liveAccount}, avec une régie qui dirige tout.` },
  ];
  return (
    <section id="comment" aria-labelledby="antenne-titre" className="relative overflow-hidden bg-night text-night-ink">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-20 lg:py-28">
        <div className="order-2 lg:order-1">
          <OnAirPhone />
        </div>
        <div className="order-1 lg:order-2">
          <p className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-night-orange">
            <span className="live-dot" aria-hidden /> À l&apos;antenne
          </p>
          <h2 id="antenne-titre" className="display mt-4 max-w-[14ch] text-[40px] sm:text-[60px]">
            Pendant 1h30, ton numéro reste à l&apos;écran.
          </h2>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-night-ink-2 sm:text-[18px]">
            La régie affiche ton produit, ton WhatsApp et ton adresse du début à la fin. Même ceux qui arrivent en retard repartent avec ton
            contact. Le marketing avant la vente.
          </p>
          <ol className="mt-12 grid gap-7">
            {steps.map((s, k) => (
              <li key={s.t} className="grid grid-cols-[52px_1fr] items-baseline gap-4">
                <span className="display tabular text-[44px] leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-night-orange)]">
                  {k + 1}
                </span>
                <span>
                  <span className="block text-[19px] font-bold">{s.t}</span>
                  <span className="mt-1 block text-[15.5px] leading-relaxed text-night-ink-2">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => document.getElementById("choix-studio")?.focus({ preventScroll: true }), 500);
            }}
            className="group relative mt-12 inline-flex h-14 items-center px-7 text-[17px] font-bold text-ink"
          >
            <span aria-hidden className="chamfer-sm absolute inset-0 bg-orange transition-colors group-hover:bg-[#ff7714]" />
            <span className="relative">Réserver mon live</span>
          </a>
        </div>
      </div>
    </section>
  );
}
