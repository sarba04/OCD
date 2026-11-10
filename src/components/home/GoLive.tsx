"use client";
import { ArrowLeft, Camera, Check, ClipboardPaste, Clock, Copy, LoaderCircle, MessageCircle, Share2, Smartphone, X } from "lucide-react";
import { compressImage } from "@/lib/client/image";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/config";
import { COUNTRIES, getCountry, guessCountry } from "@/lib/countries";
import { fcfa, prettyPhone, waLink } from "@/lib/format";
import { LIVE_CATEGORIES, LIVE_PASS, LIVE_SESSIONS, getCategory, isTikTokUrl } from "@/lib/lives";
import { Flag } from "@/components/ui/Flag";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/cn";
import { haptic, inputClass } from "@/components/ui/kit";
import { untilLabel, useLives } from "./useLives";

const KEY = "ocd-golive-v1";
interface Form {
  step: 0 | 1 | 2;
  country: string;
  category: string;
  name: string;
  local: string;
  url: string;
  shortUrl: string;
  photo: string | null;
}
const EMPTY: Form = { step: 0, country: "", category: "", name: "", local: "", url: "", shortUrl: "", photo: null };

/**
 * « Je suis en live » : trois écrans, une question par écran, de grandes cibles.
 * 1. Ton pays. 2. Ce que tu vends. 3. Ton nom, ton WhatsApp, le lien de ton live. Puis l'équipe valide.
 */
export function GoLive() {
  const { data } = useLives();
  const [f, setF] = useState<Form>(EMPTY);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ subscribed: boolean; again?: boolean } | null>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let saved: Form | null = null;
    try {
      saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch {}
    setF(saved ? { ...EMPTY, ...saved } : { ...EMPTY, country: guessCountry()?.code ?? "" });
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(f));
    } catch {}
  }, [f, ready]);
  useEffect(() => {
    if (ready) title.current?.focus({ preventScroll: true });
  }, [f.step, done, ready]);

  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const go = (step: Form["step"]) => {
    haptic();
    set({ step });
    window.scrollTo({ top: 0 });
  };
  const country = getCountry(f.country);
  const phone = country ? prettyPhone(country.dial, f.local) : "";
  const closed = data && !data.session && !data.demo;

  async function paste() {
    try {
      const t = (await navigator.clipboard.readText()).trim();
      if (t) set({ url: t });
    } catch {
      document.getElementById("url")?.focus();
    }
  }

  async function send() {
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = "Écris ton nom ou le nom de ta boutique.";
    if (f.local.replace(/\D/g, "").length < 8) errs.local = "Ton numéro WhatsApp.";
    if (!isTikTokUrl(f.url)) errs.url = "Colle le lien de ton live TikTok.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    setMessage(null);
    try {
      const r = await fetch("/api/lives", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.name, country: f.country, category: f.category, url: f.url, shortUrl: f.shortUrl, phone, photo: f.photo }),
        signal: AbortSignal.timeout(20000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        haptic(20);
        setDone({ subscribed: !!j.subscribed, again: j.again });
        window.scrollTo({ top: 0 });
      } else if (r.status === 400 && j.errors) {
        setErrors({ ...j.errors, local: j.errors.phone });
        if (j.errors.photo) setMessage(j.errors.photo);
      } else setMessage(j.message || "Une erreur est survenue. Réessaie.");
    } catch {
      setMessage("Le serveur met trop de temps à répondre. Appuie encore sur « Envoyer mon live » : si c'était déjà parti, il ne sera pas compté deux fois.");
    } finally {
      setSending(false);
    }
  }

  const sessionsLabel = LIVE_SESSIONS.map((s) => `${s.start.replace(":00", "h")}–${s.end.replace(":00", "h")}`).join(" et ");

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-2xl items-center gap-2 px-3 pt-3 sm:px-6">
        {f.step > 0 && !done ? (
          <button onClick={() => go((f.step - 1) as Form["step"])} aria-label="Retour" className="grid size-12 place-items-center rounded-full hover:bg-paper-2">
            <ArrowLeft className="size-6" aria-hidden />
          </button>
        ) : (
          <a href="/" aria-label="Retour à l'accueil" className="grid size-12 place-items-center rounded-full hover:bg-paper-2">
            <ArrowLeft className="size-6" aria-hidden />
          </a>
        )}
        <a href="/" aria-label="OCD Live, accueil">
          <Logo size={22} />
        </a>
        {!done && !closed && (
          <span className="ml-auto flex gap-1.5 pr-2" aria-label={`Étape ${f.step + 1} sur 3`} role="img">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all duration-300", i === f.step ? "w-7 bg-orange" : i < f.step ? "w-2 bg-ink" : "w-2 bg-line-2")} />
            ))}
          </span>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-6 sm:pt-10">
        {!ready ? null : closed ? (
          <div className="animate-rise text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-paper-2 text-ink" aria-hidden>
              <Clock className="size-10" strokeWidth={1.8} />
            </span>
            <h1 ref={title} tabIndex={-1} className="display mt-3 text-[40px] outline-none sm:text-[52px]">
              Reviens à {data!.next.start.replace(":00", "h")}.
            </h1>
            <p className="mt-3 text-[17px] text-ink-2">
              L&apos;équipe valide les lives de {sessionsLabel}. Prochaine session {untilLabel(data!.next.at, new Date(data!.now).getTime())}.
            </p>
            <div className="mt-8 grid gap-3">
              <a href="/" className="inline-flex h-14 items-center justify-center rounded-full bg-ink text-[17px] font-bold text-paper">
                Voir les lives
              </a>
            </div>
          </div>
        ) : done ? (
          <div className="animate-rise">
            <span className="grid size-16 place-items-center rounded-full bg-ok text-white">
              <Check className="size-9" strokeWidth={3} aria-hidden />
            </span>
            <h1 ref={title} tabIndex={-1} className="display mt-5 text-[40px] outline-none sm:text-[52px]">
              {done.again ? "Déjà envoyé." : "C'est envoyé !"}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
              L&apos;équipe regarde ton live. Dès qu&apos;elle valide, tu apparais dans <Flag code={f.country} className="mx-0.5 inline-block w-5 align-[-2px]" /> {country?.name}, rayon {getCategory(f.category).label}.
            </p>
            {!done.subscribed && (
              <div className="mt-7 rounded-3xl bg-orange-soft p-5">
                <p className="text-[19px] font-bold">Active ton abonnement</p>
                <p className="mt-1 text-[15px] text-ink-2">
                  {fcfa(LIVE_PASS.price)} pour {LIVE_PASS.days} jours. Tu peux envoyer ton live à chaque session, {sessionsLabel}.
                </p>
                <a
                  href={waLink(BRAND.whatsapp || "", `Bonjour OCD Live, je veux activer mon abonnement live (${fcfa(LIVE_PASS.price)}). Boutique : ${f.name}. Mon numéro : ${phone}`)}
                  target="_blank"
                  rel="noopener"
                  className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] text-[17px] font-bold text-ink"
                >
                  <MessageCircle className="size-5" aria-hidden /> Payer sur WhatsApp
                </a>
              </div>
            )}
            <div className="mt-6 grid gap-3">
              <a href="/" className="inline-flex h-14 items-center justify-center rounded-full bg-ink text-[17px] font-bold text-paper">
                Voir les lives
              </a>
              <button
                onClick={() => {
                  setDone(null);
                  set({ step: 2, url: "", shortUrl: "", photo: null });
                }}
                className="h-12 text-[15px] font-semibold text-ink-2 underline underline-offset-4"
              >
                Envoyer un autre lien
              </button>
            </div>
          </div>
        ) : f.step === 0 ? (
          <div className="animate-rise">
            <h1 ref={title} tabIndex={-1} className="display text-[38px] outline-none sm:text-[52px]">
              Tu es où ?
            </h1>
            <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {COUNTRIES.filter((c) => c.tz.startsWith("Africa")).map((c) => (
                <li key={c.code}>
                  <Pick on={f.country === c.code} onClick={() => (set({ country: c.code }), go(1))}>
                    <Flag code={c.code} className="w-9" />
                    <span className="min-w-0 truncate text-[16px] font-semibold">{c.name}</span>
                  </Pick>
                </li>
              ))}
            </ul>
            <details className="mt-4">
              <summary className="h-11 text-[15px] font-semibold text-ink-2">Hors d&apos;Afrique ?</summary>
              <ul className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {COUNTRIES.filter((c) => !c.tz.startsWith("Africa")).map((c) => (
                  <li key={c.code}>
                    <Pick on={f.country === c.code} onClick={() => (set({ country: c.code }), go(1))}>
                      <Flag code={c.code} className="w-9" />
                      <span className="min-w-0 truncate text-[16px] font-semibold">{c.name}</span>
                    </Pick>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : f.step === 1 ? (
          <div className="animate-rise">
            <h1 ref={title} tabIndex={-1} className="display text-[38px] outline-none sm:text-[52px]">
              Tu vends quoi ?
            </h1>
            <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LIVE_CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Pick on={f.category === c.id} onClick={() => (set({ category: c.id }), go(2))} tall>
                    <span className="grid size-16 place-items-center rounded-full text-white" style={{ background: c.color }} aria-hidden>
                      <CategoryIcon id={c.id} className="size-8" />
                    </span>
                    <span className="text-[16px] font-semibold">{c.label}</span>
                  </Pick>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="animate-rise">
            <h1 ref={title} tabIndex={-1} className="display text-[38px] outline-none sm:text-[52px]">
              Ton live.
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
              <button onClick={() => go(0)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-paper-2 px-3 font-semibold text-ink">
                <Flag code={f.country} className="w-5" /> {country?.name}
              </button>
              <button onClick={() => go(1)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-paper-2 px-3 font-semibold text-ink">
                <CategoryIcon id={f.category} className="size-4" strokeWidth={2.2} /> {getCategory(f.category).label}
              </button>
            </p>

            <div className="mt-7 grid gap-5">
              <PhotoPick photo={f.photo} onChange={(photo) => set({ photo })} />
              <Field id="name" label="Ton nom ou ta boutique" error={errors.name}>
                <input id="name" value={f.name} maxLength={50} onChange={(e) => set({ name: e.target.value })} autoComplete="organization" className={inputClass} placeholder="Ex. : Mama Rose Cuisine" />
              </Field>
              <Field id="local" label="Ton WhatsApp" error={errors.local}>
                <div className="flex items-center">
                  <span className="tabular shrink-0 pl-4 text-[16px] font-semibold text-ink-2">+{country?.dial}</span>
                  <input id="local" value={f.local} inputMode="tel" autoComplete="tel-national" onChange={(e) => set({ local: e.target.value })} className={inputClass} placeholder="6 12 34 56 78" />
                </div>
              </Field>

              {/* le lien du live : un bouton pour coller, et l'aide en images */}
              <div>
                <Field id="url" label="Le lien de ton live TikTok" error={errors.url}>
                  <div className="flex items-center gap-2 pr-2">
                    <input id="url" value={f.url} inputMode="url" onChange={(e) => set({ url: e.target.value })} className={inputClass} placeholder="https://www.tiktok.com/@…/live" />
                    <button type="button" onClick={paste} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-bold text-paper">
                      <ClipboardPaste className="size-4" aria-hidden /> Coller
                    </button>
                  </div>
                </Field>
                <ol className="mt-3 grid grid-cols-3 gap-2 text-center text-[12.5px] leading-tight text-ink-2" aria-label="Comment copier le lien">
                  {[
                    [<Smartphone key="a" className="size-5" />, "Ouvre ton live sur TikTok"],
                    [<Share2 key="b" className="size-5" />, "Appuie sur Partager"],
                    [<Copy key="c" className="size-5" />, "Copier le lien, puis Coller ici"],
                  ].map(([icon, t], i) => (
                    <li key={i} className="flex flex-col items-center gap-1.5 rounded-2xl bg-paper-2 px-2 py-3">
                      <span className="grid size-9 place-items-center rounded-full bg-card text-ink" aria-hidden>
                        {icon}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              </div>

              <details>
                <summary className="h-11 text-[15px] font-semibold text-ink-2">+ Une vidéo courte pour les Shorts (facultatif)</summary>
                <Field id="shortUrl" label="Lien d'une vidéo TikTok de ton produit" error={errors.shortUrl}>
                  <input id="shortUrl" value={f.shortUrl} inputMode="url" onChange={(e) => set({ shortUrl: e.target.value })} className={inputClass} placeholder="https://www.tiktok.com/@…/video/…" />
                </Field>
              </details>
            </div>

            {message && (
              <p role="alert" className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-[15px] font-medium text-danger">
                {message}
              </p>
            )}
          </div>
        )}
      </main>

      {ready && !done && !closed && f.step === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur safe-bottom">
          <div className="mx-auto max-w-2xl px-4 pt-3 sm:px-6">
            <button onClick={send} disabled={sending} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-live text-[17px] font-bold text-white disabled:opacity-60">
              {sending ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <span className="size-2.5 rounded-full bg-white" aria-hidden />}
              Envoyer mon live
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pick({ on, onClick, children, tall }: { on: boolean; onClick: () => void; children: React.ReactNode; tall?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-card px-4 text-left ring-1 transition-[box-shadow,transform] duration-150 active:scale-[0.98]",
        tall ? "h-auto flex-col justify-center py-5 text-center" : "h-16",
        on ? "ring-2 ring-ink" : "ring-line hover:ring-ink/30",
      )}
    >
      {children}
    </button>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[15px] font-semibold">
        {label}
      </label>
      <div className={cn("rounded-2xl bg-card ring-1 focus-within:ring-2 focus-within:ring-orange", error ? "ring-2 ring-danger" : "ring-line-2")}>{children}</div>
      {error && (
        <p role="alert" className="text-[14px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** La photo du produit : un gros bouton qui ouvre l'appareil photo ou la galerie ; la photo est réduite sur le téléphone. */
function PhotoPick({ photo, onChange }: { photo: string | null; onChange: (p: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <input
        id="live-photo"
        type="file"
        accept="image/*"
        className="peer sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setErr(null);
          try {
            onChange(await compressImage(file, 800, 0.78));
          } catch {
            setErr("Cette photo n'a pas pu être lue. Essaie une autre.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {photo ? (
        <div className="relative overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="La photo de ton produit" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute inset-x-3 bottom-3 flex gap-2">
            <label htmlFor="live-photo" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-[14px] font-bold text-ink shadow">
              <Camera className="size-4" aria-hidden /> Changer
            </label>
            <button type="button" onClick={() => onChange(null)} className="inline-flex h-11 items-center gap-2 rounded-full bg-black/60 px-4 text-[14px] font-bold text-white backdrop-blur">
              <X className="size-4" aria-hidden /> Retirer
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="live-photo"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line-2 bg-card px-4 py-7 text-center transition-colors hover:border-ink/40 peer-focus-visible:outline-3 peer-focus-visible:outline-orange"
        >
          <span className="grid size-14 place-items-center rounded-full bg-orange text-ink" aria-hidden>
            {busy ? <LoaderCircle className="size-6 animate-spin" /> : <Camera className="size-6" />}
          </span>
          <span className="text-[17px] font-bold">{busy ? "Préparation…" : "Photo de ton produit"}</span>
          <span className="text-[14px] text-ink-2">Elle s&apos;affiche sur ta carte. Les acheteurs voient tout de suite ce que tu vends.</span>
        </label>
      )}
      {err && (
        <p role="alert" className="mt-2 text-[14px] font-medium text-danger">
          {err}
        </p>
      )}
    </div>
  );
}
