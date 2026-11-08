"use client";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Logo } from "@/components/brand/Logo";
import { PrimaryButton } from "@/components/ui/kit";
import { getPack } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { formatDay, formatTime, offsetFromStudio, toISO, type Interval } from "@/lib/schedule";
import type { PublicBooking } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Timecode } from "@/components/broadcast/Timecode";
import { EMPTY, FLOW, STEP_LABEL, STEP_PARAM, businessErrors, countryOf, firstIncomplete, stepFromParam, toInput, type Draft, type Step } from "./state";
import { StepScene } from "./StepScene";
import { StepWhen } from "./StepWhen";
import { StepPack } from "./StepPack";
import { StepBusiness } from "./StepBusiness";
import { StepReview, type Conflict } from "./StepReview";
import { StepDone } from "./StepDone";

export interface Availability {
  busy: Interval[];
  now: string;
  demo: boolean;
}

const DRAFT_KEY = "ocd-live-draft-v1";
const DONE_KEY = "ocd-live-done-v1";

const read = <T,>(k: string): T | null => {
  try {
    const v = sessionStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown) => {
  try {
    if (v === null) sessionStorage.removeItem(k);
    else sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* stockage plein ou désactivé : le parcours continue sans sauvegarde */
  }
};

const urlFor = (s: Step) => (STEP_PARAM[s] ? `?etape=${STEP_PARAM[s]}` : location.pathname);

/**
 * Transition native entre deux écrans (View Transitions API) : le logo, le titre et le « talon de billet »
 * glissent d'un écran à l'autre au lieu de clignoter. Sans support ou en mouvement réduit : changement direct.
 */
function withTransition(dir: 1 | -1, update: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = () => {
    flushSync(update);
    window.scrollTo({ top: 0 });
  };
  if (!d.startViewTransition || reduced) return run();
  document.documentElement.dataset.vt = dir > 0 ? "forward" : "back";
  d.startViewTransition(run);
}

export function BookingApp() {
  const [draft, setDraftState] = useState<Draft>(EMPTY);
  const [step, setStep] = useState<Step>("scene");
  const [dir, setDir] = useState<1 | -1>(1);
  const [ready, setReady] = useState(false);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [availError, setAvailError] = useState(false);
  const [done, setDone] = useState<PublicBooking | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const setDraft = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraftState((d) => {
      const next = { ...d, ...(typeof patch === "function" ? patch(d) : patch) };
      write(DRAFT_KEY, next);
      return next;
    });
  }, []);

  /* Disponibilités (heures occupées seulement) + heure du serveur, pour ne pas dépendre de l'horloge du téléphone. */
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/availability", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setAvail(await r.json());
      setAvailError(false);
    } catch {
      setAvailError(true);
    }
  }, []);

  /* Restauration : brouillon, réservation confirmée, étape demandée dans l'URL. */
  useEffect(() => {
    const saved = read<Draft>(DRAFT_KEY);
    const d = saved ? { ...EMPTY, ...saved, business: { ...EMPTY.business, ...saved.business }, contact: { ...EMPTY.contact, ...saved.contact } } : EMPTY;
    const b = read<PublicBooking>(DONE_KEY);
    const wanted = stepFromParam(new URLSearchParams(location.search).get("etape"));
    setDraftState(d);
    if (wanted === "done" && b) {
      setDone(b);
      setStep("done");
    } else {
      const limit = firstIncomplete(d);
      const s = wanted === "done" ? limit : FLOW.indexOf(wanted) <= FLOW.indexOf(limit) ? wanted : limit;
      setStep(s);
      history.replaceState({ step: s }, "", urlFor(s));
    }
    setReady(true);
    refresh();
  }, [refresh]);

  /* Bouton retour du téléphone = étape précédente. */
  useEffect(() => {
    const onPop = () => {
      const s = stepFromParam(new URLSearchParams(location.search).get("etape"));
      withTransition(-1, () => setStep((cur) => {
        if (cur === "done") {
          // après confirmation, revenir en arrière repart d'un parcours neuf (jamais de double réservation)
          setDraftState((d) => ({ ...EMPTY, business: d.business, contact: d.contact, displayDial: d.displayDial, displayLocal: d.displayLocal, photo: d.photo }));
          setDone(null);
          write(DONE_KEY, null);
          history.replaceState({ step: "scene" }, "", location.pathname);
          return "scene";
        }
        setDir(FLOW.indexOf(s) < FLOW.indexOf(cur) ? -1 : 1);
        return s;
      }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* À chaque étape : haut de page, focus sur le titre (lecteurs d'écran), données fraîches si utile. */
  useEffect(() => {
    if (!ready) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus({ preventScroll: true });
    if (step === "when" || step === "review") refresh();
  }, [step, ready, refresh]);

  const go = useCallback((s: Step, opts: { replace?: boolean } = {}) => {
    const dir = FLOW.indexOf(s) < FLOW.indexOf(step) && s !== "done" ? -1 : 1;
    if (opts.replace) history.replaceState({ step: s }, "", urlFor(s));
    else history.pushState({ step: s }, "", urlFor(s));
    withTransition(dir, () => {
      setDir(dir);
      setStep(s);
    });
  }, [step]);

  const back = () => {
    if (history.state?.step && step !== "scene") history.back();
    else go(FLOW[Math.max(0, FLOW.indexOf(step) - 1)]);
  };

  const pack = getPack(draft.packId);
  const country = countryOf(draft);
  const errors = useMemo(() => ({ ...businessErrors(draft), ...serverErrors }), [draft, serverErrors]);

  async function submit() {
    if (!draft.paymentMethod) return;
    setSubmitting(true);
    setSubmitError(null);
    setConflict(null);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toInput(draft)),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 201) {
        setDone(j.booking);
        write(DONE_KEY, j.booking);
        write(DRAFT_KEY, null);
        go("done", { replace: true });
      } else if (r.status === 409) {
        setConflict({ message: j.message, alternatives: j.alternatives || [] });
        refresh();
      } else if (r.status === 400 && j.errors && Object.keys(j.errors).length) {
        setServerErrors(j.errors);
        setShowErrors(true);
        go("business");
      } else {
        setSubmitError(j.message || "Une erreur est survenue. Réessaie dans un instant.");
      }
    } catch {
      setSubmitError("Connexion perdue. Vérifie ton réseau puis appuie à nouveau sur Confirmer : rien n'a été enregistré.");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setDraftState((d) => {
      const next = { ...EMPTY, business: d.business, contact: d.contact, displayDial: d.displayDial, displayLocal: d.displayLocal, sameNumber: d.sameNumber, contactDial: d.contactDial, contactLocal: d.contactLocal, photo: d.photo };
      write(DRAFT_KEY, next);
      return next;
    });
    setDone(null);
    write(DONE_KEY, null);
    go("scene", { replace: true });
  }

  /* ───────── Écran d'accueil (rendu côté serveur : il s'affiche avant même que le JavaScript arrive) ───────── */
  if (!ready || step === "scene")
    return (
      <StepScene
        avail={avail}
        selected={draft.mode}
        preset={draft.day && draft.time ? { day: draft.day, time: draft.time } : null}
        onPreset={(day, time) => {
          setDraft({ day, time, packId: null });
          requestAnimationFrame(() => {
            const el = document.getElementById("choix-studio");
            el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
          });
        }}
        onPick={(mode) => {
          setDraft((d) => ({
            mode,
            // changer de format garde le créneau seulement si on reste dans le même format
            ...(d.mode && d.mode !== mode ? { paymentMethod: null } : {}),
            displayDial: d.displayLocal ? d.displayDial : mode === "studio" ? "228" : d.displayDial,
          }));
          go("when");
        }}
      />
    );

  /* ───────── Confirmation ───────── */
  if (step === "done" && done)
    return (
      <div className="min-h-dvh">
        <TopBar step={step} onBack={null} />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-8">
          <StepDone booking={done} photo={draft.photo} titleRef={titleRef} onRestart={restart} />
        </main>
      </div>
    );

  /* ───────── Étapes du parcours ───────── */
  const idx = FLOW.indexOf(step);
  const dock = dockFor();

  function dockFor() {
    switch (step) {
      case "when":
        return {
          cta: "Voir les packs",
          disabled: !draft.day || !draft.time || (draft.mode === "remote" && !draft.country),
          onClick: () => go("pack"),
        };
      case "pack":
        return { cta: "Choisir ce pack", disabled: !pack, onClick: () => go("business") };
      case "business":
        return {
          cta: "Voir le récap",
          disabled: false,
          onClick: () => {
            if (Object.keys(errors).length) {
              setShowErrors(true);
              requestAnimationFrame(() => document.getElementById("error-summary")?.focus());
            } else go("review");
          },
        };
      default:
        return {
          cta: "Réserver mon live",
          disabled: !draft.paymentMethod || !!conflict,
          onClick: submit,
        };
    }
  }

  return (
    <div className="min-h-dvh pb-36">
      <TopBar step={step} onBack={back} />
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10">
        {avail?.demo && step === "when" && (
          <p className="-mt-3 mb-5 text-[13px] text-ink-3 sm:-mt-6">
            Démo : le planning est pré-rempli avec des réservations fictives pour montrer le fonctionnement.
          </p>
        )}
        <div key={step} className={cn("step-anim", dir > 0 ? "animate-rise" : "animate-rise-back")}>
          <p className="mono-label flex items-center gap-2 text-orange-ink">
            <span className="tally tally-on" aria-hidden /> Séquence {String(idx).padStart(2, "0")} / {String(FLOW.length - 1).padStart(2, "0")}
          </p>
          <h1 ref={titleRef} tabIndex={-1} className="tv mt-3 text-[54px] outline-none [view-transition-name:step-title] sm:text-[88px]">
            {title()}
          </h1>
          <div className="mt-6 sm:mt-8">
            {step === "when" && <StepWhen draft={draft} setDraft={setDraft} avail={avail} availError={availError} onRetry={refresh} />}
            {step === "pack" && <StepPack draft={draft} setDraft={setDraft} avail={avail} onEditWhen={() => go("when")} />}
            {step === "business" && (
              <StepBusiness
                draft={draft}
                setDraft={(p) => {
                  setServerErrors({});
                  setDraft(p);
                }}
                errors={showErrors ? errors : {}}
              />
            )}
            {step === "review" && (
              <StepReview
                draft={draft}
                setDraft={(p) => {
                  setConflict(null);
                  setSubmitError(null);
                  setDraft(p);
                }}
                conflict={conflict}
                error={submitError}
                onEdit={(s) => go(s)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Le « talon de billet » : il se remplit au fil des choix. */}
      <div className="deck fixed inset-x-0 bottom-0 z-40 border-t border-deck-line shadow-[0_-12px_32px_-18px_rgb(0_0_0/0.5)] [view-transition-name:dock] safe-bottom">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-3 sm:gap-6 sm:px-8">
          <span className="mono-label hidden flex-col gap-1.5 border-r border-deck-line pr-5 text-night-ink-2 sm:flex">
            <span className="flex items-center gap-2">
              <span className="tally" style={{ ["--t" as string]: "var(--color-preview)" }} aria-hidden /> PVW
            </span>
            <Timecode className="mono text-[11px] text-night-ink" />
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            <p key={`${draft.day}-${draft.time}-${step === "review"}`} className="tick-in mono truncate text-[14px] leading-tight font-bold tracking-[-0.03em] text-night-ink sm:text-[17px] sm:tracking-normal">
              {step === "review" && pack
                ? `Total ${fcfa(pack.price)}`
                : draft.day && draft.time
                  ? `${formatDay(draft.day, "short")} à ${
                      draft.mode === "remote" && country && offsetFromStudio(country.tz, toISO(draft.day, draft.time)) !== 0
                        ? `${formatTime(toISO(draft.day, draft.time), country.tz)} chez toi`
                        : draft.time
                    }`
                  : draft.mode === "studio"
                    ? "Studio Lomé"
                    : "À distance"}
            </p>
            <p key={draft.packId ?? "none"} className="tick-in mt-1 truncate text-[13px] text-night-ink-2">
              {[
                draft.mode === "studio" ? "Au studio à Lomé" : `À distance${country ? `, depuis ${country.name === "Togo" ? "le Togo" : country.name}` : ""}`,
                pack ? pack.name : draft.day && draft.time ? "pack à choisir" : "choisis ton créneau",
              ]
                .filter((x, i) => !(i === 0 && !(draft.day && draft.time) && step !== "review"))
                .join(", ")}
            </p>
          </div>
          <PrimaryButton onClick={dock.onClick} disabled={dock.disabled} loading={step === "review" && submitting} className="shrink-0 px-5 sm:px-8">
            {dock.cta}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );

  function title() {
    switch (step) {
      case "when":
        return "Ta case dans la grille.";
      case "pack":
        return "Ton format.";
      case "business":
        return "Ta fiche antenne.";
      default:
        return "Dernier contrôle.";
    }
  }
}

function TopBar({ step, onBack }: { step: Step; onBack: (() => void) | null }) {
  const idx = FLOW.indexOf(step);
  const steps = FLOW.slice(1);
  return (
    <header className="deck sticky top-0 z-30 border-b border-deck-line">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 sm:h-16 sm:px-6">
        {onBack ? (
          <button onClick={onBack} aria-label="Étape précédente" className="grid size-12 place-items-center text-night-ink transition-colors hover:text-night-orange">
            <ChevronLeft className="size-6" strokeWidth={2.4} />
          </button>
        ) : (
          <span className="w-3" />
        )}
        <a href="/" aria-label="OCD Live, accueil" className={cn("inline-flex", !onBack && "ml-1")}>
          <Logo size={20} onDark className="[view-transition-name:ocd-logo]" />
        </a>
        {step !== "done" ? (
          <ol
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={idx}
            aria-label={`Étape ${idx} sur ${steps.length} : ${STEP_LABEL[step]}`}
            className="ml-auto flex items-stretch gap-1 pr-2"
          >
            {steps.map((s, i) => {
              const n = i + 1;
              const state = n < idx ? "done" : n === idx ? "now" : "next";
              return (
                <li
                  key={s}
                  aria-hidden
                  className={cn(
                    "mono-label flex h-8 items-center gap-1.5 px-2 text-[10px] transition-colors duration-300 sm:px-2.5",
                    state === "now" ? "bg-tally text-white" : state === "done" ? "bg-white/10 text-night-ink" : "text-night-ink-2/70 ring-1 ring-deck-line ring-inset",
                  )}
                >
                  <span>{String(n).padStart(2, "0")}</span>
                  <span className={cn("hidden md:inline", state === "now" && "inline")}>{STEP_SHORT[s]}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <span className="mono-label ml-auto flex items-center gap-2 pr-3 text-night-ink">
            <span className="tally tally-on" aria-hidden /> Programmé
          </span>
        )}
      </div>
    </header>
  );
}

const STEP_SHORT: Partial<Record<Step, string>> = { when: "Case", pack: "Format", business: "Fiche", review: "Contrôle" };
