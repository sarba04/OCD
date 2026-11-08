/* eslint-disable @next/next/no-img-element */
import { AFRICA_PATH, AFRICA_VIEWBOX } from "@/lib/geo/africa";
import { cn } from "@/lib/cn";

/**
 * Le mur du studio OCD Live, recréé en code : une plaque en forme d'Afrique,
 * décollée du mur et rétroéclairée, avec l'enseigne OCD en lettres orange en relief
 * et « Live » en noir. Au chargement, les LED s'allument une fois en vacillant.
 *
 * `intensity` permet de faire monter la lumière quand on survole un choix.
 */
export function StudioWall({
  className,
  intensity = 1,
  animate = true,
}: {
  className?: string;
  intensity?: number;
  animate?: boolean;
}) {
  const { width: W, height: H } = AFRICA_VIEWBOX;
  return (
    <div className={cn("@container relative select-none", className)} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden>
      <svg viewBox={`-60 -60 ${W + 120} ${H + 120}`} className="absolute -inset-[6%] h-[112%] w-[112%] overflow-visible">
        <defs>
          <filter id="sw-wide" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="58" />
          </filter>
          <filter id="sw-mid" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="17" />
          </filter>
          <filter id="sw-rim" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id="sw-cast" x="-10%" y="-10%" width="120%" height="130%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          {/* la plaque : éclairée en haut à gauche, un peu plus mate en bas à droite */}
          <linearGradient id="sw-plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#FBF9F6" />
            <stop offset="1" stopColor="#EFEAE3" />
          </linearGradient>
          <linearGradient id="sw-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#C9B9A4" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* la lumière derrière la plaque */}
        <g
          className={animate ? "studio-lights" : undefined}
          style={{ opacity: Math.min(1, 0.75 + 0.25 * intensity), transition: "opacity 600ms var(--ease-out)" }}
        >
          <path
            d={AFRICA_PATH}
            fill="#FF8A1F"
            filter="url(#sw-wide)"
            style={{
              opacity: 0.5 + 0.22 * intensity,
              transform: `scale(${1 + 0.035 * intensity})`,
              transformOrigin: "50% 50%",
              transformBox: "fill-box",
              transition: "transform 700ms var(--ease-out), opacity 700ms var(--ease-out)",
            }}
          />
          <path d={AFRICA_PATH} fill="#FFA43A" filter="url(#sw-mid)" />
          <path d={AFRICA_PATH} fill="#FFE2A6" filter="url(#sw-rim)" />
        </g>

        {/* l'ombre portée de la plaque sur le mur */}
        <path d={AFRICA_PATH} fill="#3B2410" opacity={0.16} filter="url(#sw-cast)" transform="translate(8 14)" />
        {/* la tranche de la plaque (épaisseur) */}
        <path d={AFRICA_PATH} fill="url(#sw-edge)" transform="translate(3 5)" />
        {/* la face de la plaque */}
        <path d={AFRICA_PATH} fill="url(#sw-plate)" />
      </svg>

      {/* l'enseigne */}
      <div className="absolute top-[30%] left-[22%] w-[58%]">
        <img src="/brand/ocd-logo.svg" alt="" width={951} height={368} className="sign-3d block h-auto w-full" draggable={false} />
        <span className="sign-live display absolute top-[100%] right-[-2%] mt-[1%] text-[10cqw] leading-none tracking-[-0.045em] text-ink">
          Live
        </span>
      </div>
    </div>
  );
}
