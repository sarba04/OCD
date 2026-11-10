/* eslint-disable @next/next/no-img-element */
"use client";
import { Check, CreditCard, LoaderCircle, Lock, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_METHODS } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";
import { haptic } from "@/components/ui/kit";

type Phase = "form" | "processing" | "success";

/**
 * Simulateur de paiement : la fenêtre qu'on aura avec un vrai agrégateur (Mobile Money ou carte),
 * mais AUCUN argent n'est débité. Après « Payer », on simule la validation, puis la réservation est enregistrée.
 */
export function PaySheet({
  method,
  amount,
  phone,
  onClose,
  onPay,
  onDone,
}: {
  method: string;
  amount: number;
  phone: string;
  onClose: () => void;
  /** Enregistre la réservation ; renvoie true si c'est fait. */
  onPay: () => Promise<boolean>;
  onDone: () => void;
}) {
  const m = PAYMENT_METHODS.find((x) => x.id === method)!;
  const card = m.kind === "card";
  const [phase, setPhase] = useState<Phase>("form");
  const [num, setNum] = useState(phone);
  const [cardNo, setCardNo] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && phase === "form" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  async function pay() {
    if (card) {
      if (cardNo.replace(/\D/g, "").length < 15 || !/^\d{2}\s?\/\s?\d{2}$/.test(exp) || cvc.replace(/\D/g, "").length < 3) {
        setErr("Vérifie le numéro de carte, la date (MM/AA) et le code à 3 chiffres.");
        return;
      }
    } else if (num.replace(/\D/g, "").length < 8) {
      setErr(`Ton numéro ${m.label}.`);
      return;
    }
    setErr(null);
    setPhase("processing");
    haptic(12);
    await new Promise((r) => setTimeout(r, card ? 1800 : 2600));
    const ok = await onPay();
    if (!ok) return onClose();
    setPhase("success");
    haptic(30);
    setTimeout(onDone, 1300);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="pay-title">
      <button aria-label="Fermer" onClick={() => phase === "form" && onClose()} className="animate-fade absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="animate-sheet relative w-full max-w-[440px] rounded-t-[28px] bg-card p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[28px] sm:p-6">
        {phase === "form" && (
          <>
            <div className="flex items-center gap-3">
              <img src={`/pay/${m.id}.webp`} alt="" width={96} height={64} className="h-11 w-auto rounded-lg ring-1 ring-line" />
              <div className="min-w-0 flex-1">
                <p id="pay-title" className="text-[18px] font-bold">
                  Payer avec {m.label}
                </p>
                <p className="tabular text-[14px] text-ink-2">{fcfa(amount)} · OCD Live</p>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="grid size-11 place-items-center rounded-full hover:bg-paper-2">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <p className="mt-4 rounded-2xl bg-orange-soft px-3.5 py-2.5 text-[13.5px] text-ink-2">
              <strong className="text-ink">Simulation</strong> : aucun argent n&apos;est débité. Le vrai paiement sera branché bientôt.
            </p>

            <div className="mt-5 grid gap-3">
              {card ? (
                <>
                  <Input id="pay-card" label="Numéro de carte" icon={<CreditCard className="size-5" />} value={cardNo} refEl={first} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                    onChange={(v) => setCardNo(v.replace(/[^\d]/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input id="pay-exp" label="Expire fin" value={exp} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA"
                      onChange={(v) => { const d = v.replace(/\D/g, "").slice(0, 4); setExp(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }} />
                    <Input id="pay-cvc" label="Code (CVC)" value={cvc} inputMode="numeric" autoComplete="cc-csc" placeholder="123" onChange={(v) => setCvc(v.replace(/\D/g, "").slice(0, 4))} />
                  </div>
                </>
              ) : (
                <Input id="pay-phone" label={`Ton numéro ${m.label}`} icon={<Smartphone className="size-5" />} value={num} refEl={first} inputMode="tel" autoComplete="tel" onChange={setNum} />
              )}
            </div>
            {err && (
              <p role="alert" className="mt-3 text-[14px] font-medium text-danger">
                {err}
              </p>
            )}
            <button onClick={pay} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-[17px] font-bold text-paper active:scale-[0.99]">
              <Lock className="size-4" aria-hidden /> Payer {fcfa(amount)}
            </button>
          </>
        )}

        {phase === "processing" && (
          <div className="grid place-items-center py-8 text-center" role="status" aria-live="polite">
            <img src={`/pay/${m.id}.webp`} alt="" width={96} height={64} className="h-14 w-auto rounded-lg ring-1 ring-line" />
            <LoaderCircle className="mt-6 size-9 animate-spin text-ink" aria-hidden />
            <p className="mt-4 text-[18px] font-bold">Paiement en cours…</p>
            <p className="mt-1 max-w-[30ch] text-[14.5px] text-ink-2">
              {card ? "Vérification de la carte auprès de la banque." : `Valide le paiement sur ton téléphone avec ton code ${m.label}.`}
            </p>
          </div>
        )}

        {phase === "success" && (
          <div className="grid place-items-center py-8 text-center" role="status" aria-live="polite">
            <span className="pay-ok grid size-20 place-items-center rounded-full bg-ok text-white">
              <Check className="size-11" strokeWidth={3} aria-hidden />
            </span>
            <p className="mt-5 text-[20px] font-bold">Paiement confirmé</p>
            <p className="tabular mt-1 text-[14.5px] text-ink-2">
              {fcfa(amount)} · {m.label} · simulation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({
  id,
  label,
  value,
  onChange,
  icon,
  refEl,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  refEl?: React.RefObject<HTMLInputElement | null>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[14px] font-semibold">
        {label}
      </label>
      <div className={cn("flex items-center gap-2 rounded-2xl bg-paper px-4 ring-1 ring-line-2 focus-within:ring-2 focus-within:ring-orange")}>
        {icon && <span className="text-ink-3" aria-hidden>{icon}</span>}
        <input id={id} ref={refEl} value={value} onChange={(e) => onChange(e.target.value)} className="tabular h-13 w-full bg-transparent py-3.5 text-[17px] font-semibold outline-none" {...rest} />
      </div>
    </div>
  );
}
