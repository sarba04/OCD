"use client";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/* ───────── Boutons ───────── */

export function PrimaryButton({
  children,
  loading,
  className,
  arrow = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; arrow?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "group relative inline-flex h-14 min-w-0 select-none items-center justify-center gap-2.5 px-6 text-[17px] font-bold text-ink transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:text-ink-3 disabled:active:scale-100",
        className,
      )}
    >
      <span
        aria-hidden
        className="chamfer-sm absolute inset-0 bg-orange transition-colors duration-200 group-hover:bg-[#ff7714] group-disabled:bg-line"
      />
      <span className="relative truncate">{children}</span>
      {loading ? (
        <LoaderCircle className="relative size-5 shrink-0 animate-spin" aria-hidden />
      ) : (
        arrow && (
          <ArrowRight
            className="relative size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:opacity-50"
            strokeWidth={2.5}
            aria-hidden
          />
        )
      )}
    </button>
  );
}

export function InkButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center gap-2 px-5 text-[15px] font-semibold text-paper transition-transform duration-150 active:scale-[0.98] disabled:opacity-50",
        className,
      )}
    >
      <span aria-hidden className="chamfer-sm absolute inset-0 bg-ink transition-colors group-hover:bg-[#2a231c]" />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

export function GhostButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "edge chamfer-sm inline-flex h-12 items-center justify-center gap-2 px-5 text-[15px] font-semibold text-ink transition-transform duration-150 [--edge:var(--color-line-2)] [--surface:var(--color-card)] hover:[--edge:var(--color-ink)] active:scale-[0.98] disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ───────── Carte sélectionnable : bordure qui suit la coupe + halo quand elle est choisie ───────── */

export const ChoiceCard = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; cut?: "sm" | "md" | "lg"; wrapperClassName?: string; dark?: boolean }
>(function ChoiceCard({ selected, cut = "md", className, wrapperClassName, dark, children, ...props }, ref) {
  return (
    <div className={cn("transition-[filter] duration-300", selected && "glow", wrapperClassName)}>
      <button
        ref={ref}
        type="button"
        {...props}
        className={cn(
          "edge relative block w-full text-left transition-transform duration-150 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100",
          cut === "sm" ? "chamfer-sm" : cut === "lg" ? "chamfer-lg" : "chamfer",
          dark
            ? selected
              ? "text-night-ink [--edge-w:2px] [--edge:var(--color-orange)] [--surface:#1d1611]"
              : "text-night-ink [--edge:#3a2f25] [--surface:#15110e] enabled:hover:[--edge:#7a5a3c]"
            : selected
              ? "[--edge-w:2px] [--edge:var(--color-orange)] [--surface:#fff7f0]"
              : "[--edge:var(--color-line)] [--surface:var(--color-card)] enabled:hover:[--edge:var(--color-line-2)]",
          className,
        )}
      >
        {children}
      </button>
    </div>
  );
});

/* ───────── Champs de formulaire ───────── */

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  counter,
  id,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  counter?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold text-ink">
          {label}
          {optional ? <span className="ml-1.5 text-[13px] font-normal text-ink-3">facultatif</span> : null}
        </label>
        {counter ? <span className="tabular text-[12px] text-ink-3">{counter}</span> : null}
      </div>
      <div
        className={cn(
          "edge chamfer-sm transition-[filter] [--surface:var(--color-card)] focus-within:[--edge-w:2px] focus-within:[--edge:var(--color-orange)]",
          error ? "[--edge-w:2px] [--edge:var(--color-danger)]" : "[--edge:var(--color-line-2)]",
        )}
      >
        {children}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[14px] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13.5px] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "block w-full bg-transparent px-4 py-3.5 text-[16px] leading-6 text-ink placeholder:text-ink-3/70 outline-none focus-visible:outline-none";

export function Checkbox({
  checked,
  onChange,
  children,
  error,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  error?: string;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span
          aria-hidden
          className={cn(
            "chamfer-sm mt-0.5 grid size-6 shrink-0 place-items-center transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange",
            checked ? "bg-orange text-ink" : error ? "bg-danger-soft ring-2 ring-danger ring-inset" : "bg-paper-2 ring-[1.5px] ring-line-2 ring-inset",
          )}
        >
          {checked && <Check className="size-4" strokeWidth={3} />}
        </span>
        <span className="text-[15px] leading-snug text-ink-2">{children}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="ml-9 text-[14px] font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {hint && <span className="block text-[13.5px] text-ink-3">{hint}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={cn(
          "relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange",
          checked ? "bg-orange" : "bg-line-2",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-transform duration-200 ease-[var(--ease-spring)]",
            checked && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}

/** Petite étiquette (« Prime time », « Le plus choisi »…). */
export function Tag({ children, tone = "ink", className }: { children: React.ReactNode; tone?: "ink" | "orange" | "live" | "soft" | "night" | "ok"; className?: string }) {
  return (
    <span
      className={cn(
        "chamfer-sm inline-flex h-6 items-center gap-1 px-2 text-[12.5px] font-semibold whitespace-nowrap",
        tone === "ink" && "bg-ink text-paper",
        tone === "orange" && "bg-orange text-ink",
        tone === "live" && "bg-live text-white",
        tone === "soft" && "bg-paper-2 text-ink-2",
        tone === "night" && "bg-night-3 text-night-ink",
        tone === "ok" && "bg-ok-soft text-ok",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* pas de vibreur : rien */
  }
}
