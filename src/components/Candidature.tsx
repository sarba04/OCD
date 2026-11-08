"use client";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Field, PrimaryButton, inputClass } from "@/components/ui/kit";
import { cn } from "@/lib/cn";

export function Candidature() {
  const [f, setF] = useState({ fullName: "", phone: "+228 ", city: "Lomé", why: "", link: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/candidature", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }).catch(() => null);
    const j = await r?.json().catch(() => ({}));
    setBusy(false);
    if (r?.ok) return setDone(true);
    setErrors(j?.errors ?? {});
    setMsg(j?.message ?? "Connexion perdue. Réessaie.");
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-5 sm:px-8">
        <a href="/" aria-label="OCD Live, accueil">
          <Logo size={24} />
        </a>
        <a href="/" className="inline-flex h-11 items-center gap-1.5 text-[14px] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Réserver un live
        </a>
      </header>
      <main className="mx-auto max-w-3xl px-5 pt-10 pb-20 sm:px-8">
        <p className="eyebrow text-orange-ink">On recrute à Lomé · temps plein</p>
        <h1 className="display mt-3 text-[40px] sm:text-[60px]">
          Tu sais parler.
          <br />
          Tu sais vendre.
        </h1>
        <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">
          Pendant qu&apos;un vendeur du Cameroun, du Tchad ou de Centrafrique fait son live depuis sa boutique, toi, au studio à Lomé, tu
          l&apos;accompagnes en direct&nbsp;: tu animes, tu relances, tu fais vendre. Pas de diplôme demandé. On cherche de l&apos;éloquence, du sérieux, et
          l&apos;envie d&apos;apprendre.
        </p>

        {done ? (
          <div className="animate-rise mt-10 border-l-4 border-ok bg-ok-soft px-5 py-5">
            <p className="flex items-center gap-2 text-[18px] font-bold text-ink">
              <Check className="size-5 text-ok" strokeWidth={3} aria-hidden /> Candidature reçue
            </p>
            <p className="mt-1.5 text-[15.5px] text-ink-2">L&apos;équipe OCD t&apos;écrit sur WhatsApp pour la suite. Prépare-toi à nous montrer comment tu vends.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-10 grid gap-5">
            <input name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="fullName" label="Prénom et nom" error={errors.fullName}>
                <input id="fullName" value={f.fullName} onChange={set("fullName")} autoComplete="name" className={inputClass} />
              </Field>
              <Field id="phone" label="WhatsApp" error={errors.phone}>
                <input id="phone" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" className={cn(inputClass, "tabular")} />
              </Field>
            </div>
            <Field id="city" label="Ta ville" error={errors.city}>
              <input id="city" value={f.city} onChange={set("city")} className={inputClass} />
            </Field>
            <Field id="why" label="Pourquoi toi ?" hint="Raconte une vente dont tu es fier ou fière. Quelques lignes suffisent." error={errors.why}>
              <textarea id="why" rows={4} value={f.why} onChange={set("why")} className={cn(inputClass, "resize-none")} />
            </Field>
            <Field id="link" label="Lien vers une vidéo ou un vocal de toi qui vends" optional hint="TikTok, Google Drive, YouTube… 60 secondes suffisent.">
              <input id="link" type="url" inputMode="url" value={f.link} onChange={set("link")} placeholder="https://" className={inputClass} />
            </Field>
            {msg && (
              <p role="alert" className="text-[14.5px] font-medium text-danger">
                {msg}
              </p>
            )}
            <PrimaryButton type="submit" loading={busy} className="justify-self-start">
              Envoyer ma candidature
            </PrimaryButton>
          </form>
        )}
      </main>
    </div>
  );
}
