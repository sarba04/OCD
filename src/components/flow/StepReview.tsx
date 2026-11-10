"use client";
import { Check, CircleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPack, PAYMENT_METHODS } from "@/lib/config";
import { eur, fcfa } from "@/lib/format";
import { packSessions } from "@/lib/schedule";
import { haptic } from "@/components/ui/kit";
import { OcdCard } from "./OcdCard";
import { formatTime, offsetFromStudio } from "@/lib/schedule";
import { countryOf, displayPhone, type Draft, type Step } from "./state";

export interface Conflict {
  message: string;
  alternatives: { day: string; time: string; label: string }[];
}


export function StepReview({
  draft,
  setDraft,
  conflict,
  error,
  onEdit,
}: {
  draft: Draft;
  setDraft: (p: Partial<Draft>) => void;
  conflict: Conflict | null;
  error: string | null;
  onEdit: (s: Step) => void;
}) {
  const pack = getPack(draft.packId)!;
  const country = countryOf(draft);
  const sessions = packSessions(pack, draft.day!, draft.time!);
  const methods = PAYMENT_METHODS.filter((m) => (m.modes as readonly string[]).includes(draft.mode!));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <OcdCard
          status="review"
          d={{ ...draft.business, phone: displayPhone(draft), photo: draft.photo }}
          meta={{
            packName: pack.name,
            price: pack.price,
            mode: draft.mode!,
            start: sessions[0].start,
            end: sessions[0].end,
            sessions: sessions.length,
            localTime:
              draft.mode === "remote" && country && offsetFromStudio(country.tz, sessions[0].start) !== 0
                ? `${formatTime(sessions[0].start, country.tz)} à ${country.city}`
                : null,
          }}
        />
        <div className="mx-auto mt-5 flex max-w-[460px] flex-wrap justify-center gap-x-5 gap-y-1 text-[14px]">
          <EditLink onClick={() => onEdit("when")}>Changer la date</EditLink>
          <EditLink onClick={() => onEdit("pack")}>Changer de pack</EditLink>
          <EditLink onClick={() => onEdit("business")}>Modifier mes infos</EditLink>
        </div>
      </div>

      <div>
        {conflict && (
          <div role="alert" className="mb-8 border-l-4 border-orange bg-orange-soft px-4 py-4">
            <p className="flex items-start gap-2 text-[15.5px] font-bold">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-orange-ink" aria-hidden />
              {conflict.message} Quelqu&apos;un a été plus rapide.
            </p>
            {conflict.alternatives.length > 0 ? (
              <>
                <p className="mt-2 text-[14.5px] text-ink-2">Les créneaux libres les plus proches pour ce pack :</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conflict.alternatives.map((a) => (
                    <button
                      key={`${a.day}-${a.time}`}
                      onClick={() => {
                        haptic();
                        setDraft({ day: a.day, time: a.time });
                      }}
                      className="chamfer-sm tabular h-11 bg-ink px-3.5 text-[14.5px] font-semibold text-paper transition-transform active:scale-95"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button onClick={() => onEdit("when")} className="mt-3 h-10 font-semibold text-orange-ink underline underline-offset-4">
                Choisir un autre créneau
              </button>
            )}
          </div>
        )}

        <h2 className="display text-[26px]">Comment veux-tu payer&nbsp;?</h2>
        <p className="mt-1.5 text-[15px] text-ink-2">Choisis, puis appuie sur « Payer ». Pour l&apos;instant le paiement est simulé : rien n&apos;est débité.</p>
        <div role="radiogroup" aria-label="Moyen de paiement" className="cascade-auto mt-5 grid grid-cols-2 gap-2.5">
          {methods.map((m) => {
            const on = draft.paymentMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  haptic();
                  setDraft({ paymentMethod: m.id });
                }}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-2xl bg-card p-3.5 text-left ring-1 transition-[box-shadow,transform] duration-150 active:scale-[0.98]",
                  on ? "ring-2 ring-ink shadow-[0_12px_24px_-16px_rgb(22_18_14/0.5)]" : "ring-line hover:ring-ink/30",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/pay/${m.id}.svg`} alt="" width={96} height={64} className="h-10 w-auto rounded-md ring-1 ring-black/5" />
                <span className="flex w-full items-end justify-between gap-2">
                  <span>
                    <span className="block text-[15.5px] leading-tight font-bold">{m.label}</span>
                    <span className="block text-[12.5px] text-ink-3">{m.hint}</span>
                  </span>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full ring-2", on ? "bg-ink text-paper ring-ink" : "ring-line-2")} aria-hidden>
                    {on && <Check className="size-3.5" strokeWidth={3.5} />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 border-t border-line pt-6 text-[15px]">
          <Row k={`Pack ${pack.name}`} v={fcfa(pack.price)} />
          {pack.regular && <Row k="Remise de lancement" v={`− ${fcfa(pack.regular - pack.price)}`} muted />}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="text-[17px] font-bold">Total</span>
            <span className="text-right">
              <span className="tabular display block text-[30px]">{fcfa(pack.price)}</span>
              {country?.euro && <span className="tabular text-[13px] text-ink-3">{eur(pack.price)}</span>}
            </span>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[13.5px] leading-snug text-ink-3">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Report gratuit jusqu&apos;à 48 h avant ton live. L&apos;équipe OCD reçoit ta réservation à l&apos;instant où tu confirmes.
        </p>

        {error && (
          <p role="alert" className="mt-5 border-l-4 border-danger bg-danger-soft px-4 py-3 text-[14.5px] font-medium text-ink">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={muted ? "text-ink-3" : "text-ink-2"}>{k}</span>
      <span className={muted ? "tabular text-ok" : "tabular font-semibold"}>{v}</span>
    </div>
  );
}

function EditLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-10 font-semibold text-ink-2 underline decoration-line-2 underline-offset-4 hover:text-ink hover:decoration-orange">
      {children}
    </button>
  );
}
