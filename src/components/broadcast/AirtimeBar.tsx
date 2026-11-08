import type { Pack } from "@/lib/config";
import { cn } from "@/lib/cn";

/** Le temps d'antenne d'un pack, dessiné : un segment par live, à l'échelle (4 h = toute la barre). */
export function AirtimeBar({ pack, dark }: { pack: Pack; dark?: boolean }) {
  const unit = pack.pattern === "weekly" ? "S" : pack.pattern === "consecutive" ? "J" : null;
  const total = (pack.sessions * pack.minutes) / 60;
  return (
    <span className="block" aria-hidden>
      <span className="flex items-center justify-between gap-3">
        <span className={cn("mono-label text-[10px]", dark ? "text-night-ink-2" : "text-ink-3")}>Temps d&apos;antenne</span>
        <span className="mono text-[12px] font-bold">{String(total).replace(".", ",")} h</span>
      </span>
      <span className="mt-2 flex h-3 gap-1">
        {Array.from({ length: pack.sessions }, (_, i) => (
          <span key={i} className={cn("relative flex-1", dark ? "bg-white/10" : "bg-ink/[0.08]")}>
            <span
              className="air-fill absolute inset-y-0 left-0 bg-orange"
              style={{ width: `${Math.min(100, (pack.minutes / 240) * 100)}%`, ["--i" as string]: i }}
            />
            {unit && <span className={cn("mono absolute -bottom-4 left-0 text-[9.5px] font-semibold", dark ? "text-night-ink-2" : "text-ink-3")}>{unit}{i + 1}</span>}
          </span>
        ))}
      </span>
      {unit && <span className="block h-3.5" />}
    </span>
  );
}
