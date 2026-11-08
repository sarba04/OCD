"use client";
import { AFRICA_CITIES, AFRICA_PATH, AFRICA_VIEWBOX, type CityKey } from "@/lib/geo/africa";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TARGETS: CityKey[] = ["dakar", "bamako", "abidjan", "ndjamena", "douala", "kinshasa", "nairobi", "johannesburg", "casablanca"];
const LABELS: Partial<Record<CityKey, string>> = {
  dakar: "Dakar",
  douala: "Douala",
  kinshasa: "Kinshasa",
  ndjamena: "N'Djamena",
  nairobi: "Nairobi",
  johannesburg: "Johannesburg",
  casablanca: "Casablanca",
  bamako: "Bamako",
};

const [LX, LY] = AFRICA_CITIES.lome;

function arc(to: CityKey) {
  const [x, y] = AFRICA_CITIES[to];
  const mx = (LX + x) / 2;
  const my = (LY + y) / 2;
  const dx = x - LX;
  const dy = y - LY;
  const d = Math.hypot(dx, dy);
  // point de contrôle décalé perpendiculairement, toujours « vers le haut » : des arcs qui respirent
  let nx = -dy / d;
  let ny = dx / d;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = d * 0.28;
  return `M${LX} ${LY}Q${(mx + nx * k).toFixed(1)} ${(my + ny * k).toFixed(1)} ${x} ${y}`;
}

/**
 * La carte d'Afrique rétroéclairée du studio, en vectoriel (≈5 Ko).
 * focus = "studio" : Lomé s'allume. focus = "remote" : les liaisons partent de Lomé vers tout le continent.
 */
export function AfricaMap({
  focus = null,
  labels = false,
  quiet = false,
  className,
}: {
  focus?: "studio" | "remote" | null;
  labels?: boolean;
  /** Version discrète (fond de page mobile) : pas de liaisons, halo plus doux. */
  quiet?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const arcsOpacity = focus === "studio" ? 0.12 : focus === "remote" ? 1 : 0.55;
  return (
    <div className={cn("relative", className)} aria-hidden="true">
      <svg viewBox={`0 0 ${AFRICA_VIEWBOX.width} ${AFRICA_VIEWBOX.height}`} className="block h-auto w-full overflow-visible">
        <defs>
          <filter id="ocd-wall-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <radialGradient id="ocd-wall" cx="35%" cy="42%" r="75%">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFF7EC" />
          </radialGradient>
        </defs>

        {/* Le halo du rétroéclairage */}
        <path d={AFRICA_PATH} fill="#FFB45C" opacity={quiet ? 0.42 : 0.75} filter="url(#ocd-wall-glow)" />
        {/* La découpe du mur */}
        <path d={AFRICA_PATH} fill="url(#ocd-wall)" stroke="#EFC08F" strokeWidth={quiet ? 2.5 : 1.5} />

        {/* Les liaisons depuis Lomé */}
        <g style={{ opacity: quiet ? 0 : arcsOpacity, transition: "opacity 500ms var(--ease-out)" }}>
          {TARGETS.map((c, i) => {
            const d = arc(c);
            const [x, y] = AFRICA_CITIES[c];
            return (
              <g key={c}>
                <path
                  d={d}
                  pathLength={1}
                  fill="none"
                  stroke="#F16903"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeDasharray="1"
                  style={
                    reduced
                      ? undefined
                      : ({ ["--len" as string]: 1, animation: `map-draw 1.4s var(--ease-out) ${0.15 + i * 0.09}s both` } as React.CSSProperties)
                  }
                  opacity={0.75}
                />
                <circle cx={x} cy={y} r={6} fill="#16120E" />
                <circle cx={x} cy={y} r={11} fill="none" stroke="#16120E" strokeOpacity={0.18} strokeWidth={2} />
                {!reduced && focus === "remote" && (
                  <circle r={5} fill="#F16903">
                    <animateMotion dur={`${2.6 + (i % 3) * 0.5}s`} begin={`${i * 0.35}s`} repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {/* Lomé : le studio */}
        <g>
          {!reduced && (
            <circle
              cx={LX}
              cy={LY}
              r={14}
              fill="none"
              stroke="#E5262B"
              strokeWidth={3}
              style={{ transformBox: "fill-box", transformOrigin: "center", animation: "live-ring 1.8s var(--ease-out) infinite" }}
            />
          )}
          <circle cx={LX} cy={LY} r={focus === "studio" ? 13 : 10} fill="#E5262B" style={{ transition: "r 300ms var(--ease-out)" }} />
          <circle cx={LX} cy={LY} r={4} fill="#fff" />
        </g>
      </svg>

      {labels &&
        TARGETS.filter((c) => LABELS[c]).map((c) => {
          const [x, y] = AFRICA_CITIES[c];
          return (
            <span
              key={c}
              className="pointer-events-none absolute -translate-x-1/2 translate-y-2.5 text-[11px] font-semibold tracking-wide text-ink-2 transition-opacity duration-500"
              style={{ left: `${(x / AFRICA_VIEWBOX.width) * 100}%`, top: `${(y / AFRICA_VIEWBOX.height) * 100}%`, opacity: focus === "studio" ? 0.25 : 1 }}
            >
              {LABELS[c]}
            </span>
          );
        })}
    </div>
  );
}

/** Position de Lomé en % (pour poser une étiquette HTML par-dessus la carte). */
export const LOME_POS = { left: (LX / AFRICA_VIEWBOX.width) * 100, top: (LY / AFRICA_VIEWBOX.height) * 100 };
