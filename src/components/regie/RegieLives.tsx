"use client";
import { Check, Clapperboard, ExternalLink, RotateCcw, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getCountry } from "@/lib/countries";
import { LIVE_PASS, LIVE_SESSIONS, LIVE_TEST_MODE, getCategory, type LiveEntry } from "@/lib/lives";
import { Flag } from "@/components/ui/Flag";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { fcfa } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Onglet « Lives » : valider en un geste les lives envoyés, et activer les abonnements payés. */
export function RegieLives({ onToast }: { onToast: (s: string) => void }) {
  const [lives, setLives] = useState<LiveEntry[] | null>(null);
  const [sellers, setSellers] = useState<Record<string, string | null>>({});
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/regie/lives", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    setLives(j.lives);
    setSellers(j.sellers);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(l: LiveEntry, status: LiveEntry["status"]) {
    setBusy(l.id);
    const r = await fetch(`/api/regie/lives/${l.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (r.ok) {
      onToast(status === "approved" ? `${l.name} est en ligne sur le site` : status === "rejected" ? `${l.name} refusé` : "Remis en attente");
      load();
    }
  }

  async function pay(l: LiveEntry) {
    setBusy(l.id);
    const r = await fetch("/api/regie/sellers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone: l.phone, name: l.name }) });
    setBusy(null);
    if (r.ok) {
      const j = await r.json();
      onToast(`Abonnement actif jusqu'au ${new Date(`${j.seller.paidUntil}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`);
      load();
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const shown = (lives ?? []).filter((l) => (filter === "all" ? true : l.status === filter));
  const pendingN = (lives ?? []).filter((l) => l.status === "pending").length;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["pending", `À valider${pendingN ? ` (${pendingN})` : ""}`],
            ["approved", "En ligne"],
            ["all", "Tous"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn("h-10 px-4 text-[14px] font-semibold ring-1 ring-inset", filter === k ? "bg-night-orange text-ink ring-night-orange" : "text-night-ink-2 ring-night-line hover:text-night-ink")}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[13px] text-night-ink-2">
          {LIVE_TEST_MODE ? "Mode test : ouvert à toute heure" : `Sessions : ${LIVE_SESSIONS.map((s) => `${s.start}–${s.end}`).join(" et ")}`} · abonnement {fcfa(LIVE_PASS.price)} / mois
        </span>
      </div>

      {!lives ? (
        <div className="mt-5 grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse bg-night-2" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-8 text-[15px] text-night-ink-2">{filter === "pending" ? "Aucun live à valider pour l'instant." : "Rien ici."}</p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {shown.map((l) => {
            const cat = getCategory(l.category);
            const c = getCountry(l.country);
            const paid = sellers[l.phone];
            const active = !!paid && paid >= today;
            return (
              <li key={l.id} className="grid gap-3 bg-night-2 p-4 ring-1 ring-night-line sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full text-white" style={{ background: cat.color }} aria-hidden>
                    <CategoryIcon id={cat.id} className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold">{l.name}</p>
                    <p className="truncate text-[13.5px] text-night-ink-2">
                      <Flag code={l.country} className="mr-1 inline-block w-5 align-[-2px]" /> {c?.name} · {cat.label} · {l.session === "matin" ? "session du matin" : "session du soir"}{l.day === today ? "" : ` du ${l.day}`}
                    </p>
                    <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="tabular mt-0.5 inline-block text-[13.5px] font-semibold text-night-orange">
                      WhatsApp {l.phone}
                    </a>
                    <p className="mt-1 text-[12.5px]">
                      <span className={cn("font-semibold", active ? "text-[#5fd39a]" : "text-[#ffc65c]")}>
                        {active ? `Abonné jusqu'au ${paid}` : "Abonnement à payer"}
                      </span>
                      {l.status !== "pending" && <span className="text-night-ink-2"> · {l.status === "approved" ? "en ligne" : "refusé"}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={l.url} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 bg-night-3 px-4 text-[14px] font-semibold ring-1 ring-night-line hover:ring-night-orange">
                    <ExternalLink className="size-4" aria-hidden /> Ouvrir le live
                  </a>
                  {l.shortUrl && (
                    <a href={l.shortUrl} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 bg-night-3 px-4 text-[14px] font-semibold ring-1 ring-night-line hover:ring-night-orange">
                      <Clapperboard className="size-4" aria-hidden /> Vidéo Shorts
                    </a>
                  )}
                  {!active && (
                    <button disabled={busy === l.id} onClick={() => pay(l)} className="inline-flex h-11 items-center gap-2 bg-night-3 px-4 text-[14px] font-semibold text-[#ffc65c] ring-1 ring-night-line hover:ring-[#ffc65c]">
                      <Wallet className="size-4" aria-hidden /> Payé (+{LIVE_PASS.days} j)
                    </button>
                  )}
                  {l.status === "pending" ? (
                    <>
                      <button disabled={busy === l.id} onClick={() => setStatus(l, "approved")} className="inline-flex h-11 items-center gap-2 bg-[#5fd39a] px-4 text-[14px] font-bold text-ink">
                        <Check className="size-4" strokeWidth={3} aria-hidden /> Valider
                      </button>
                      <button disabled={busy === l.id} onClick={() => setStatus(l, "rejected")} aria-label={`Refuser ${l.name}`} className="grid size-11 place-items-center bg-night-3 text-[#ff8a7a] ring-1 ring-night-line">
                        <X className="size-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <button disabled={busy === l.id} onClick={() => setStatus(l, "pending")} aria-label="Remettre en attente" className="grid size-11 place-items-center bg-night-3 text-night-ink-2 ring-1 ring-night-line">
                      <RotateCcw className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
