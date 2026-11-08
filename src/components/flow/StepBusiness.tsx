/* eslint-disable @next/next/no-img-element */
"use client";
import { ChevronDown, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CATEGORIES, FORBIDDEN, BRAND } from "@/lib/config";
import { COUNTRIES } from "@/lib/countries";
import { compressImage } from "@/lib/client/image";
import { cn } from "@/lib/cn";
import { Checkbox, Field, Toggle, inputClass } from "@/components/ui/kit";
import { LowerThird, PhonePreview, type PreviewData } from "./LivePreview";
import { displayPhone, type Draft } from "./state";

const DIALS = Array.from(new Map(COUNTRIES.map((c) => [c.dial, c])).values());

export function StepBusiness({
  draft,
  setDraft,
  errors,
}: {
  draft: Draft;
  setDraft: (p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  errors: Record<string, string | undefined>;
}) {
  const b = draft.business;
  const setB = (p: Partial<Draft["business"]>) => setDraft((d) => ({ business: { ...d.business, ...p } }));
  const setC = (p: Partial<Draft["contact"]>) => setDraft((d) => ({ contact: { ...d.contact, ...p } }));
  const errList = Object.entries(errors).filter(([, v]) => v) as [string, string][];

  const preview: PreviewData = useMemo(
    () => ({ name: b.name, pitch: b.pitch, phone: displayPhone(draft), address: b.address, delivers: b.delivers, priceHint: b.priceHint, photo: draft.photo }),
    [b, draft],
  );

  const describedBy = (k: string, hint = false) => (errors[k] ? `${k}-error` : hint ? `${k}-hint` : undefined);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div>
        <p className="max-w-[52ch] text-[16px] leading-relaxed text-ink-2">
          C&apos;est ce que la régie affichera à l&apos;écran pendant ton live. Ton produit, ton numéro, ton adresse : c&apos;est comme ça que les
          clients te retrouvent après.
        </p>

        {/* Aperçu compact (mobile) */}
        <div className="sticky-preview sticky top-16 z-20 -mx-4 mt-6 bg-[#2a1d12] px-4 pt-2 pb-3 shadow-[0_10px_24px_-14px_rgb(0_0_0/0.6)] lg:hidden">
          <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-white/80">
            <span className="rounded-[3px] bg-live px-1 py-px text-[10px] font-extrabold tracking-wide text-white">LIVE</span>
            Ton bandeau à l&apos;écran, en direct
          </p>
          <div className="relative overflow-hidden">
            {draft.photo && <img src={draft.photo} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
            <LowerThird d={preview} className="relative" />
          </div>
        </div>

        {errList.length > 0 && (
          <div id="error-summary" tabIndex={-1} role="alert" className="mt-6 border-l-4 border-danger bg-danger-soft px-4 py-3 outline-none">
            <p className="text-[15px] font-bold text-ink">
              {errList.length === 1 ? "Une information est à corriger" : `${errList.length} informations sont à corriger`}
            </p>
            <ul className="mt-1.5 grid gap-1">
              {errList.slice(0, 3).map(([k, v]) => (
                <li key={k}>
                  <a
                    href={`#${k}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(k);
                      el?.scrollIntoView({ block: "center", behavior: "smooth" });
                      el?.focus({ preventScroll: true });
                    }}
                    className="text-[14px] text-danger underline underline-offset-2"
                  >
                    {v}
                  </a>
                </li>
              ))}
            </ul>
            {errList.length > 3 && <p className="mt-1.5 text-[14px] text-ink-2">Et {errList.length - 3} autre{errList.length - 3 > 1 ? "s" : ""}, signalée{errList.length - 3 > 1 ? "s" : ""} en rouge plus bas.</p>}
          </div>
        )}

        {/* ───── Ton business ───── */}
        <fieldset className="mt-8">
          <legend className="display text-[24px]">Ton business</legend>
          <div className="mt-5 grid gap-5">
            <Field id="business.name" label="Nom de ta boutique ou de ta marque" error={errors["business.name"]}>
              <input
                id="business.name"
                value={b.name}
                onChange={(e) => setB({ name: e.target.value })}
                maxLength={60}
                autoComplete="organization"
                placeholder="Ex : Afi Wax Couture"
                aria-invalid={!!errors["business.name"]}
                aria-describedby={describedBy("business.name")}
                className={inputClass}
              />
            </Field>

            <div id="business.category" tabIndex={-1} className="outline-none">
              <p className="text-[15px] font-semibold">Ce que tu vends</p>
              <div role="radiogroup" aria-label="Catégorie" className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = b.category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setB({ category: c })}
                      className={cn(
                        "chamfer-sm h-11 px-3.5 text-[14.5px] font-semibold transition-colors duration-150",
                        on ? "bg-ink text-paper" : "bg-card text-ink ring-[1.5px] ring-line-2 ring-inset hover:ring-ink",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {errors["business.category"] && <p className="mt-1.5 text-[14px] font-medium text-danger">{errors["business.category"]}</p>}
            </div>

            <Field
              id="business.pitch"
              label="Ce que tu vas présenter en live"
              counter={`${b.pitch.length}/140`}
              hint="Une phrase courte et concrète. La régie la lit à l'antenne."
              error={errors["business.pitch"]}
            >
              <textarea
                id="business.pitch"
                value={b.pitch}
                onChange={(e) => setB({ pitch: e.target.value.slice(0, 140) })}
                rows={2}
                placeholder="Ex : Robes et ensembles en wax cousus main, du 36 au 52"
                aria-invalid={!!errors["business.pitch"]}
                aria-describedby={describedBy("business.pitch", true)}
                className={cn(inputClass, "resize-none")}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
              <Field id="business.priceHint" label="Prix de départ" optional hint="Affiché à côté de ton nom.">
                <input
                  id="business.priceHint"
                  value={b.priceHint}
                  onChange={(e) => setB({ priceHint: e.target.value })}
                  maxLength={24}
                  placeholder="Ex : dès 5 000 F"
                  aria-describedby="business.priceHint-hint"
                  className={inputClass}
                />
              </Field>
              <PhotoInput photo={draft.photo} onChange={(photo) => setDraft({ photo })} />
            </div>
          </div>
        </fieldset>

        {/* ───── Où tes clients te trouvent ───── */}
        <fieldset className="mt-10">
          <legend className="display text-[24px]">Où tes clients te trouvent</legend>
          <div className="mt-5 grid gap-5">
            <PhoneField
              id="business.displayPhone"
              label="Numéro WhatsApp affiché pendant le live"
              hint="Les clients t'écriront directement sur ce numéro."
              dial={draft.displayDial}
              local={draft.displayLocal}
              onDial={(displayDial) => setDraft({ displayDial })}
              onLocal={(displayLocal) => setDraft({ displayLocal })}
              error={errors["business.displayPhone"]}
            />
            <Field id="business.address" label="Ton adresse" hint="Au moins le quartier et la ville." error={errors["business.address"]}>
              <input
                id="business.address"
                value={b.address}
                onChange={(e) => setB({ address: e.target.value })}
                maxLength={120}
                autoComplete="street-address"
                placeholder={draft.mode === "studio" ? "Ex : Bè-Kpota, Lomé" : "Ex : Akwa, Douala"}
                aria-invalid={!!errors["business.address"]}
                aria-describedby={describedBy("business.address", true)}
                className={inputClass}
              />
            </Field>
            <Toggle checked={b.delivers} onChange={(delivers) => setB({ delivers })} label="Je livre ou j'expédie" hint="On l'affiche dans ton bandeau." />
            <Field id="business.social" label="Ton TikTok, Instagram ou Facebook" optional>
              <input
                id="business.social"
                value={b.social}
                onChange={(e) => setB({ social: e.target.value })}
                maxLength={80}
                placeholder="@taboutique"
                autoCapitalize="none"
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        {/* ───── Toi ───── */}
        <fieldset className="mt-10">
          <legend className="display text-[24px]">Toi</legend>
          <div className="mt-5 grid gap-5">
            <Field id="contact.fullName" label="Ton prénom et ton nom" error={errors["contact.fullName"]}>
              <input
                id="contact.fullName"
                value={draft.contact.fullName}
                onChange={(e) => setC({ fullName: e.target.value })}
                maxLength={80}
                autoComplete="name"
                placeholder="Ex : Afi Mensah"
                aria-invalid={!!errors["contact.fullName"]}
                aria-describedby={describedBy("contact.fullName")}
                className={inputClass}
              />
            </Field>
            <Toggle
              checked={draft.sameNumber}
              onChange={(sameNumber) => setDraft({ sameNumber })}
              label="On te joint sur le même numéro"
              hint="Pour la confirmation et le jour J."
            />
            {!draft.sameNumber && (
              <PhoneField
                id="contact.phone"
                label="Ton numéro WhatsApp personnel"
                dial={draft.contactDial}
                local={draft.contactLocal}
                onDial={(contactDial) => setDraft({ contactDial })}
                onLocal={(contactLocal) => setDraft({ contactLocal })}
                error={errors["contact.phone"]}
              />
            )}
            <Field id="contact.email" label="E-mail" optional hint="Pour recevoir ton pass aussi par e-mail." error={errors["contact.email"]}>
              <input
                id="contact.email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={draft.contact.email}
                onChange={(e) => setC({ email: e.target.value })}
                placeholder="toi@exemple.com"
                aria-invalid={!!errors["contact.email"]}
                aria-describedby={describedBy("contact.email", true)}
                className={inputClass}
              />
            </Field>
          </div>
        </fieldset>

        {/* ───── Accords ───── */}
        <fieldset className="mt-10 grid gap-3 border-t border-line pt-6">
          <legend className="sr-only">Accords</legend>
          <Checkbox id="consentImage" checked={draft.consentImage} onChange={(consentImage) => setDraft({ consentImage })} error={errors.consentImage}>
            J&apos;accepte d&apos;être filmé(e) et diffusé(e) en direct sur le compte {BRAND.liveAccount}.
          </Checkbox>
          <Checkbox id="consentRules" checked={draft.consentRules} onChange={(consentRules) => setDraft({ consentRules })} error={errors.consentRules}>
            Mon produit respecte les règles du live (TikTok et loi togolaise).
          </Checkbox>
          <details className="group ml-9 -mt-1">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1 text-[14px] font-semibold text-orange-ink underline underline-offset-4">
              Ce qui ne peut pas passer en live
            </summary>
            <ul className="mt-1 grid gap-1 text-[14px] text-ink-2">
              {FORBIDDEN.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </details>
        </fieldset>
      </div>

      {/* Aperçu téléphone (grand écran) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-center text-[13.5px] font-semibold text-ink-2">Ce que verront tes clients</p>
          <PhonePreview d={preview} />
        </div>
      </aside>
    </div>
  );
}

function PhoneField({
  id,
  label,
  hint,
  dial,
  local,
  onDial,
  onLocal,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  dial: string;
  local: string;
  onDial: (v: string) => void;
  onLocal: (v: string) => void;
  error?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className="flex items-stretch">
        <div className="relative shrink-0 border-r border-line">
          <select
            aria-label="Indicatif du pays"
            value={dial}
            onChange={(e) => onDial(e.target.value)}
            className="tabular h-full appearance-none bg-transparent py-3.5 pr-8 pl-4 text-[16px] font-semibold outline-none"
          >
            {DIALS.map((c) => (
              <option key={c.dial} value={c.dial}>
                +{c.dial}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={local}
          onChange={(e) => onLocal(e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder="90 12 34 56"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(inputClass, "tabular")}
        />
      </div>
    </Field>
  );
}

function PhotoInput({ photo, onChange }: { photo: string | null; onChange: (p: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <p className="text-[15px] font-semibold">
        Photo de ton produit <span className="ml-1 text-[13px] font-normal text-ink-3">facultatif</span>
      </p>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="sr-only"
        id="photo"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setErr(null);
          try {
            onChange(await compressImage(f));
          } catch {
            setErr("Cette image n'a pas pu être lue. Essaie une photo JPG ou PNG.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {photo ? (
        <div className="mt-1.5 flex items-center gap-3">
          <img src={photo} alt="Ta photo produit" className="chamfer-sm size-[52px] object-cover" />
          <button type="button" onClick={() => ref.current?.click()} className="h-11 text-[14.5px] font-semibold text-orange-ink underline underline-offset-4">
            Changer
          </button>
          <button type="button" onClick={() => onChange(null)} aria-label="Retirer la photo" className="grid size-11 place-items-center text-ink-3 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="photo"
          className="mt-1.5 flex h-[52px] items-center justify-center gap-2 border-[1.5px] border-dashed border-line-2 bg-card text-[14.5px] font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          {busy ? "Préparation…" : "Ajouter une photo"}
        </label>
      )}
      {err && <p className="mt-1.5 text-[14px] font-medium text-danger">{err}</p>}
    </div>
  );
}
