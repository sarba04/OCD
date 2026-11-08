"use client";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";

export function RegieLogin({ demo }: { demo: boolean }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/regie/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) }).catch(() => null);
    if (r?.ok) location.reload();
    else {
      setErr((await r?.json().catch(() => null))?.message || "Connexion impossible. Vérifie ton réseau.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <Logo tone="white" size={30} />
        <h1 className="display mt-8 text-[40px]">La Régie</h1>
        <p className="mt-2 text-[15.5px] text-night-ink-2">Toutes les réservations, les fiches vendeurs et le planning du studio.</p>
        <label htmlFor="pw" className="mt-8 block text-[14px] font-semibold">
          Mot de passe
        </label>
        <div className="mt-2 flex items-center border-[1.5px] border-night-line bg-night-2 focus-within:border-night-orange">
          <input
            id="pw"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-13 w-full bg-transparent px-4 text-[16px] outline-none"
            autoFocus
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="grid size-12 place-items-center text-night-ink-2 hover:text-night-ink">
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {err && (
          <p role="alert" className="mt-2 text-[14px] font-medium text-[#ff8a7a]">
            {err}
          </p>
        )}
        {demo && <p className="mt-3 text-[13px] text-night-ink-2">Démo : le mot de passe est « regie2026 ».</p>}
        <button disabled={busy || !pw} className="group relative mt-6 inline-flex h-14 w-full items-center justify-center gap-2 text-[17px] font-bold text-ink disabled:opacity-50">
          <span aria-hidden className="chamfer-sm absolute inset-0 bg-orange group-hover:bg-[#ff7714]" />
          <span className="relative">Entrer en régie</span>
          {busy ? <LoaderCircle className="relative size-5 animate-spin" /> : <ArrowRight className="relative size-5" strokeWidth={2.5} />}
        </button>
        <a href="/" className="mt-6 inline-flex h-10 items-center text-[14px] text-night-ink-2 hover:text-night-ink">
          ← Retour au site
        </a>
      </form>
    </main>
  );
}
