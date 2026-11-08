"use client";
import { Check, CircleAlert, Repeat } from "lucide-react";
import { useMemo } from "react";
import { PACKS, type Pack } from "@/lib/config";
import { eur, fcfa } from "@/lib/format";
import { checkPack, formatDay, formatTime, hm, type PackCheck } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { ChoiceCard, Tag, haptic } from "@/components/ui/kit";
import type { Availability } from "./BookingApp";
import { countryOf, type Draft } from "./state";

export function StepPack({
  draft,
  setDraft,
  avail,
  onEditWhen,
}: {
  draft: Draft;
  setDraft: (p: Partial<Draft>) => void;
  avail: Availability | null;
  onEditWhen: () => void;
}) {
  const country = countryOf(draft);
  const checks = useMemo(() => {
    if (!avail || !draft.day || !draft.time) return null;
    const now = new Date(avail.now);
    return Object.fromEntries(PACKS.map((p) => [p.id, checkPack(p, draft.day!, draft.time!, avail.busy, now)]));
  }, [avail, draft.day, draft.time]);

  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15.5px] text-ink-2">
        <span>
          À partir du <strong className="font-semibold text-ink">{draft.day && formatDay(draft.day)}</strong> à{" "}
          <strong className="tabular font-semibold text-ink">{draft.time}</strong>
          {country && country.tz !== "Africa/Lome" && draft.day && draft.time ? (
            <span className="text-ink-3"> ({formatTime(`${draft.day}T${draft.time}:00Z`, country.tz)} chez toi)</span>
          ) : null}
        </span>
        <button onClick={onEditWhen} className="inline-flex h-9 items-center font-semibold text-orange-ink underline decoration-2 underline-offset-4">
          Modifier
        </button>
      </p>
      <p className="mt-1 text-[14px] text-ink-3">Prix de lancement, valables pour tout décembre.</p>

      <ul className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        {PACKS.map((p, pi) => {
          const c = checks?.[p.id];
          return (
            <li key={p.id} className="cascade" style={{ ["--i" as string]: pi * 3 }}>
              <PackCard
                pack={p}
                check={c}
                selected={draft.packId === p.id}
                euro={!!country?.euro}
                onPick={() => {
                  haptic();
                  setDraft({ packId: p.id });
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PackCard({ pack, check, selected, euro, onPick }: { pack: Pack; check?: PackCheck; selected: boolean; euro: boolean; onPick: () => void }) {
  const ok = check?.ok ?? false;
  const hours = (pack.sessions * pack.minutes) / 60;
  const perHour = Math.round(pack.price / hours / 50) * 50;
  const dark = !!pack.premium;
  const muted = dark ? "text-night-ink-2" : "text-ink-3";
  const body = dark ? "text-night-ink-2" : "text-ink-2";
  return (
    <ChoiceCard
      dark={dark}
      selected={selected}
      disabled={!check || !ok}
      onClick={onPick}
      aria-pressed={selected}
      className={cn("h-full p-5", !ok && check && !dark && "[--surface:var(--color-paper-2)]")}
      wrapperClassName="h-full"
    >
      {dark && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(70%_100%_at_25%_0%,rgb(241_105_3/0.32),transparent_70%)]"
        />
      )}
      <span className={cn("relative flex h-full flex-col", !ok && check && "opacity-60")}>
        {pack.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/media/${pack.image.src}-480.webp`}
            srcSet={`/media/${pack.image.src}-480.webp 480w, /media/${pack.image.src}-800.webp 800w`}
            sizes="(min-width: 768px) 520px, 100vw"
            width={800}
            height={450}
            loading="lazy"
            decoding="async"
            alt={pack.image.alt}
            className="chamfer-sm mb-4 block aspect-[16/8] w-full object-cover"
          />
        )}
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[22px] leading-none font-extrabold tracking-[-0.02em]">{pack.name}</span>
              {pack.badge && <Tag tone={selected ? "ink" : "orange"}>{pack.badge}</Tag>}
            </span>
            <span className={cn("mt-2 block text-[14.5px] leading-snug", body)}>{pack.tagline}</span>
          </span>
          <span className="shrink-0 text-right">
            {pack.regular && <span className={cn("tabular block text-[13px] line-through decoration-orange decoration-2", muted)}>{fcfa(pack.regular)}</span>}
            <span className="tabular block text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{fcfa(pack.price)}</span>
            {euro && <span className={cn("tabular block text-[12.5px]", muted)}>{eur(pack.price)}</span>}
            {pack.showHourly && <span className={cn("tabular mt-0.5 block text-[12.5px]", muted)}>≈ {fcfa(perHour)} / h</span>}
          </span>
        </span>

        <span className="mt-4 flex flex-wrap gap-1.5">
          <Tag tone={dark ? "night" : "soft"}>
            {pack.sessions > 1 ? `${pack.sessions} lives de ${hm(pack.minutes)}` : `1 live de ${hm(pack.minutes)}`}
          </Tag>
        </span>

        <span className={cn("mt-4 grid gap-1.5 border-t pt-4", dark ? "border-night-line" : "border-line")}>
          {pack.includes.map((i) => (
            <span key={i} className={cn("flex items-start gap-2 text-[14px] leading-snug", body)}>
              <Check className={cn("mt-0.5 size-4 shrink-0", dark ? "text-night-orange" : "text-orange-ink")} strokeWidth={3} aria-hidden />
              {i}
            </span>
          ))}
        </span>

        {check && !ok && (
          <span className={cn("mt-4 flex items-start gap-2 text-[13.5px] font-medium", dark ? "text-night-ink" : "text-ink")}>
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-orange-ink" aria-hidden />
            {check.reason}
          </span>
        )}
        {check && ok && selected && check.sessions.length > 1 && (
          <span className="mt-4 block border-t border-dashed border-line-2 pt-3">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <Repeat className="size-4 text-orange-ink" aria-hidden /> Tes {check.sessions.length} lives
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {check.sessions.map((s) => (
                <span key={s.start} className="chamfer-sm tabular bg-orange/15 px-2 py-1 text-[12.5px] font-semibold text-ink">
                  {formatDay(s.start.slice(0, 10), "short")}, {formatTime(s.start)}
                </span>
              ))}
            </span>
          </span>
        )}
      </span>
    </ChoiceCard>
  );
}
