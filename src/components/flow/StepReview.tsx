"use client";
import { Banknote, CircleAlert, Clock, Phone, Smartphone } from "lucide-react";
import { getPack, PAYMENT_METHODS } from "@/lib/config";
import { eur, fcfa } from "@/lib/format";
import { packSessions } from "@/lib/schedule";
import { ChoiceCard, haptic } from "@/components/ui/kit";
import { OcdCard } from "./OcdCard";
import { formatTime, offsetFromStudio } from "@/lib/schedule";
import { countryOf, displayPhone, type Draft, type Step } from "./state";

export interface Conflict {
  message: string;
  alternatives: { day: string; time: string; label: string }[];
}

const ICON: Record<string, React.ReactNode> = {
  flooz: <Smartphone className="size-5" aria-hidden />,
  mixx: <Smartphone className="size-5" aria-hidden />,
  cash: <Banknote className="size-5" aria-hidden />,
  later: <Phone className="size-5" aria-hidden />,
};

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
        <p className="mt-1.5 text-[15px] text-ink-2">
          Rien n&apos;est débité maintenant. Ta place est bloquée <strong className="font-semibold text-ink">24 h</strong> le temps de payer.
        </p>
        <div role="radiogroup" aria-label="Moyen de paiement" className="cascade-auto mt-5 grid gap-2.5 sm:grid-cols-2">
          {methods.map((m) => {
            const on = draft.paymentMethod === m.id;
            return (
              <ChoiceCard
                key={m.id}
                cut="sm"
                role="radio"
                aria-checked={on}
                selected={on}
                onClick={() => {
                  haptic();
                  setDraft({ paymentMethod: m.id });
                }}
                className="px-4 py-3.5"
              >
                <span className="flex items-center gap-3">
                  <span className={on ? "text-orange-ink" : "text-ink-3"}>{ICON[m.id]}</span>
                  <span>
                    <span className="block text-[16px] font-bold">{m.label}</span>
                    <span className="block text-[13px] text-ink-3">{m.hint}</span>
                  </span>
                </span>
              </ChoiceCard>
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
