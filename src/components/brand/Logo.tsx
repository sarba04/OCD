/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";

/** Lockup « OCD Live » : le logo orange + « Live » noir très gras, comme sur le mur du studio. */
export function Logo({
  className,
  tone = "orange",
  live = true,
  size = 28,
  onDark = false,
}: {
  onDark?: boolean;
  className?: string;
  tone?: "orange" | "white" | "ink";
  live?: boolean;
  size?: number;
}) {
  const src = tone === "white" ? "/brand/ocd-logo-white.svg" : tone === "ink" ? "/brand/ocd-logo-ink.svg" : "/brand/ocd-logo.svg";
  return (
    <span className={cn("inline-flex items-end gap-[0.18em] leading-none", className)} style={{ fontSize: size }}>
      <img src={src} alt="OCD" width={951} height={368} style={{ height: size, width: "auto" }} draggable={false} />
      {live && (
        <span
          className={cn("display translate-y-[0.06em] text-[0.82em] tracking-[-0.04em]", tone === "white" || onDark ? "text-white" : "text-ink")}
        >
          Live
        </span>
      )}
    </span>
  );
}
