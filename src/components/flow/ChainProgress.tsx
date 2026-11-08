/**
 * Barre de progression en maillons : chaque étape franchie s'emboîte et passe à l'orange,
 * comme le C et le D du logo.
 */
export function ChainProgress({ current, total, label }: { current: number; total: number; label: string }) {
  const W = 26;
  const H = 14;
  const step = 17;
  const width = W + step * (total - 1) + 4;
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={label} className="flex items-center">
      <svg width={width} height={H + 4} viewBox={`-2 -2 ${width} ${H + 4}`} aria-hidden>
        {Array.from({ length: total }, (_, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <rect
              key={i}
              x={i * step}
              y={0}
              width={W}
              height={H}
              rx={H / 2}
              fill={done ? "#F16903" : now ? "#FFEDDF" : "none"}
              fillOpacity={done ? 0.18 : 1}
              stroke={done || now ? "#F16903" : "#D3C7B6"}
              strokeWidth={now ? 3 : 2.4}
              style={{ transition: "stroke 300ms, fill 300ms" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
