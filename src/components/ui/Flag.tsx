import { BE, BF, BJ, CA, CD, CF, CG, CH, CI, CM, DE, ES, FR, GA, GB, GH, GN, IT, MA, ML, NE, NG, SN, TD, TG, US } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/cn";

const FLAGS = { BE, BF, BJ, CA, CD, CF, CG, CH, CI, CM, DE, ES, FR, GA, GB, GH, GN, IT, MA, ML, NE, NG, SN, TD, TG, US } as const;

/** Un vrai drapeau (SVG), identique sur tous les téléphones. */
export function Flag({ code, className }: { code: string; className?: string }) {
  const F = FLAGS[code as keyof typeof FLAGS];
  if (!F) return null;
  return (
    <span className={cn("inline-block aspect-[3/2] w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]", className)} aria-hidden>
      <F className="block h-full w-full" />
    </span>
  );
}
