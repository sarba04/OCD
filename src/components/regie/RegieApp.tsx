"use client";
import { CalendarDays, Download, Radio, List as ListIcon, LogOut, Search, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { SCHEDULE } from "@/lib/config";
import { getCountry } from "@/lib/countries";
import { fcfa } from "@/lib/format";
import { daySlots, formatDay, formatTime, windowDays } from "@/lib/schedule";
import { STATUS_LABEL, type Booking, type BookingStatus } from "@/lib/types";
import type { Application } from "@/lib/server/store";
import { cn } from "@/lib/cn";
import { Fiche } from "./Fiche";
import { RegieLives } from "./RegieLives";

export type Row = Omit<Booking, "photo"> & { hasPhoto: boolean };

export const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-[#3a2a0c] text-[#ffc65c] ring-1 ring-inset ring-[#6b4d12]",
  paid: "bg-[#3d1f08] text-night-orange ring-1 ring-inset ring-[#7a3a0c]",
  confirmed: "bg-[#0f2e20] text-[#5fd39a] ring-1 ring-inset ring-[#1d5a3e]",
  done: "bg-night-3 text-night-ink-2 ring-1 ring-inset ring-night-line",
  no_show: "bg-[#3a1210] text-[#ff8a7a] ring-1 ring-inset ring-[#6e211c]",
  cancelled: "bg-night-2 text-night-ink-2/70 line-through ring-1 ring-inset ring-night-line",
};

export const BLOCK_STYLE: Record<BookingStatus, string> = {
  pending: "bg-[#ffc65c] text-ink",
  paid: "bg-orange text-ink",
  confirmed: "bg-[#5fd39a] text-ink",
  done: "bg-night-line text-night-ink",
  no_show: "bg-[#ff8a7a] text-ink",
  cancelled: "hidden",
};

export function StatusChip({ s }: { s: BookingStatus }) {
  return <span className={cn("inline-flex h-6 shrink-0 items-center px-2 text-[12px] font-semibold whitespace-nowrap", STATUS_STYLE[s])}>{s === "pending" ? "À payer" : STATUS_LABEL[s]}</span>;
}

type Tab = "lives" | "planning" | "liste" | "candidatures";

export function RegieApp() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [demo, setDemo] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState<Tab>("planning");
  useEffect(() => {
    if (new URLSearchParams(location.search).get("vue") === "lives") setTab("lives");
  }, []);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all" | "active">("active");
  const [mode, setMode] = useState<"all" | "studio" | "remote">("all");
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/regie/bookings", { cache: "no-store" }).catch(() => null);
    if (!r) return;
    if (r.status === 401) return location.reload();
    const j = await r.json();
    const list: Row[] = j.bookings;
    if (known.current) {
      const fresh = list.filter((b) => !known.current!.has(b.id));
      if (fresh.length) setToast(`Nouvelle réservation : ${fresh[0].business.name} (${fresh[0].contact.fullName})`);
    }
    known.current = new Set(list.map((b) => b.id));
    setRows(list);
    setApps(j.applications);
    setDemo(j.demo);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    const c = setInterval(() => setNow(new Date()), 30_000);
    // ?fiche=<id> (lien de la notification) ou ?ref=<réf> (QR du Pass Live scanné à l'arrivée)
    const sp = new URLSearchParams(location.search);
    if (sp.get("fiche")) setOpen(sp.get("fiche"));
    return () => {
      clearInterval(t);
      clearInterval(c);
    };
  }, [load]);

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref && rows) {
      const b = rows.find((x) => x.ref === ref);
      if (b) setOpen(b.id);
    }
  }, [rows]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const active = useMemo(() => (rows ?? []).filter((b) => b.status !== "cancelled"), [rows]);
  const stats = useMemo(() => {
    const cashed = active.filter((b) => ["paid", "confirmed", "done"].includes(b.status)).reduce((n, b) => n + b.price, 0);
    const pending = active.filter((b) => b.status === "pending");
    const busy = active.flatMap((b) => b.sessions.map((s) => ({ start: s.start, end: new Date(new Date(s.end).getTime() + SCHEDULE.bufferMinutes * 60000).toISOString() })));
    const all = windowDays().flatMap((d) => daySlots(d, busy, new Date(0)));
    const taken = all.filter((s) => s.reason === "taken").length;
    return { count: active.length, cashed, pendingN: pending.length, pendingSum: pending.reduce((n, b) => n + b.price, 0), fill: all.length ? Math.round((taken / all.length) * 100) : 0, taken, total: all.length };
  }, [active]);

  const next = useMemo(
    () =>
      active
        .flatMap((b) => b.sessions.map((s) => ({ b, s })))
        .filter(({ s }) => new Date(s.end) > now)
        .sort((a, z) => a.s.start.localeCompare(z.s.start))[0],
    [active, now],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (b) =>
        (status === "all" ? true : status === "active" ? b.status !== "cancelled" : b.status === status) &&
        (mode === "all" || b.mode === mode) &&
        (!t || [b.ref, b.business.name, b.contact.fullName, b.contact.phone, b.business.category, b.business.address].join(" ").toLowerCase().includes(t)),
    );
  }, [rows, q, status, mode]);

  const onChanged = (b: Row) => setRows((rs) => (rs ? rs.map((x) => (x.id === b.id ? b : x)) : rs));

  return (
    <div className="pb-16">
      {/* ───── Barre du haut ───── */}
      <header className="sticky top-0 z-30 border-b border-night-line bg-night/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo tone="white" size={22} />
          <span className="chamfer-sm bg-night-orange px-2 py-0.5 text-[11px] font-extrabold tracking-[0.12em] text-ink uppercase">Régie</span>
          {demo && <span className="hidden text-[12px] text-night-ink-2 sm:inline">Mode démo · données fictives marquées</span>}
          <span className="tabular ml-auto hidden text-[13px] text-night-ink-2 sm:inline">
            Lomé {formatTime(now.toISOString())} · {formatDay(now.toISOString().slice(0, 10), "short")}
          </span>
          <a href="/api/regie/export" aria-label="Export Excel" className="inline-flex h-10 items-center gap-2 px-3 text-[14px] font-semibold text-night-ink ring-1 ring-night-line ring-inset hover:bg-night-2 sm:ml-2">
            <Download className="size-4" aria-hidden /> <span className="hidden sm:inline">Export Excel</span>
          </a>
          <button
            onClick={async () => {
              await fetch("/api/regie/logout", { method: "POST" });
              location.reload();
            }}
            aria-label="Se déconnecter"
            className="grid size-10 place-items-center text-night-ink-2 hover:text-night-ink"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <h1 className="sr-only">Régie OCD Live</h1>
        {/* ───── Chiffres ───── */}
        <section className="grid grid-cols-2 gap-px overflow-hidden bg-night-line lg:grid-cols-4" aria-label="Chiffres clés">
          <Kpi label="Réservations" value={rows ? String(stats.count) : "—"} sub={`${stats.taken} créneaux occupés`} />
          <Kpi label="Encaissé" value={rows ? fcfa(stats.cashed) : "—"} sub="payé, confirmé ou fait" accent />
          <Kpi label="À encaisser" value={rows ? fcfa(stats.pendingSum) : "—"} sub={`${stats.pendingN} en attente de paiement`} />
          <Kpi label="Remplissage décembre" value={rows ? `${stats.fill} %` : "—"} sub={`${stats.taken} / ${stats.total} créneaux de 1h30`} bar={stats.fill} />
        </section>

        {/* ───── Prochain live ───── */}
        {next && (
          <button onClick={() => setOpen(next.b.id)} className="mt-4 flex w-full flex-wrap items-center gap-x-5 gap-y-2 bg-night-2 px-5 py-4 text-left ring-1 ring-night-line ring-inset hover:ring-night-orange">
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-night-orange">
              <span className="live-dot" aria-hidden /> Prochain live
            </span>
            <span className="tabular text-[15px] font-semibold">
              {formatDay(next.s.start.slice(0, 10), "short")} · {formatTime(next.s.start)}–{formatTime(next.s.end)}
            </span>
            <span className="w-full min-w-0 truncate text-[15px] sm:w-auto sm:flex-1">
              <b className="font-bold">{next.b.business.name}</b> <span className="text-night-ink-2">· {next.b.business.pitch}</span>
            </span>
            <span className="text-[13px] text-night-ink-2">{next.b.mode === "studio" ? "Au studio" : `À distance · ${getCountry(next.b.country)?.name}`}</span>
            <StatusChip s={next.b.status} />
          </button>
        )}

        {/* ───── Onglets ───── */}
        <div className="mt-8 flex items-center gap-1 overflow-x-auto border-b border-night-line" role="tablist">
          <TabBtn on={tab === "lives"} onClick={() => setTab("lives")} icon={<Radio className="size-4" />}>
            Lives à valider
          </TabBtn>
          <TabBtn on={tab === "planning"} onClick={() => setTab("planning")} icon={<CalendarDays className="size-4" />}>
            Planning
          </TabBtn>
          <TabBtn on={tab === "liste"} onClick={() => setTab("liste")} icon={<ListIcon className="size-4" />}>
            Fiches
          </TabBtn>
          <TabBtn on={tab === "candidatures"} onClick={() => setTab("candidatures")} icon={<Users className="size-4" />}>
            Animatrices{apps.length ? ` (${apps.length})` : ""}
          </TabBtn>
        </div>

        {tab === "lives" ? (
          <RegieLives onToast={setToast} />
        ) : !rows ? (
          <div className="mt-6 grid gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse bg-night-2" />
            ))}
          </div>
        ) : tab === "planning" ? (
          <Planning rows={active} onOpen={setOpen} now={now} />
        ) : tab === "liste" ? (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 bg-night-2 px-3 ring-1 ring-night-line ring-inset focus-within:ring-night-orange sm:max-w-sm">
                <Search className="size-4 shrink-0 text-night-ink-2" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, business, téléphone, réf…" aria-label="Rechercher" className="w-full bg-transparent text-[15px] outline-none placeholder:text-night-ink-2/70" />
              </div>
              <Select value={status} onChange={(v) => setStatus(v as typeof status)} label="Statut" options={[["active", "Toutes (hors annulées)"], ["all", "Toutes"], ...Object.entries(STATUS_LABEL)]} />
              <Select value={mode} onChange={(v) => setMode(v as typeof mode)} label="Format" options={[["all", "Studio et distance"], ["studio", "Au studio"], ["remote", "À distance"]]} />
            </div>
            <p className="mt-3 text-[13px] text-night-ink-2">
              {filtered.length} réservation{filtered.length > 1 ? "s" : ""}
            </p>
            <FicheList rows={filtered} onOpen={setOpen} />
          </div>
        ) : (
          <Applications apps={apps} />
        )}
      </main>

      {open && <Fiche id={open} onClose={() => setOpen(null)} onChanged={onChanged} />}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,460px)] -translate-x-1/2 items-center gap-3 bg-night-orange px-4 py-3 text-[14.5px] font-semibold text-ink shadow-2xl">
          <span className="live-dot" aria-hidden />
          <span className="min-w-0 flex-1">{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Fermer" className="grid size-8 place-items-center">
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent, bar }: { label: string; value: string; sub: string; accent?: boolean; bar?: number }) {
  return (
    <div className="bg-night-2 px-4 py-4 sm:px-5">
      <p className="text-[12.5px] font-semibold text-night-ink-2">{label}</p>
      <p className={cn("tabular display mt-2 text-[clamp(19px,6vw,26px)] whitespace-nowrap sm:text-[32px]", accent && "text-night-orange")}>{value}</p>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 bg-night-line" aria-hidden>
          <div className="h-full bg-night-orange transition-[width] duration-700" style={{ width: `${bar}%` }} />
        </div>
      )}
      <p className="mt-1.5 text-[12.5px] text-night-ink-2">{sub}</p>
    </div>
  );
}

function TabBtn({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button role="tab" aria-selected={on} onClick={onClick} className={cn("-mb-px inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-2.5 text-[14.5px] font-semibold transition-colors sm:px-4", on ? "border-night-orange text-night-ink" : "border-transparent text-night-ink-2 hover:text-night-ink")}>
      {icon}
      {children}
    </button>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 bg-night-2 px-3 text-[14.5px] font-semibold text-night-ink ring-1 ring-night-line outline-none ring-inset focus:ring-night-orange">
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

/* ───────── Planning : une ligne par jour, de 8h à 22h ───────── */
function Planning({ rows, onOpen, now }: { rows: Row[]; onOpen: (id: string) => void; now: Date }) {
  const days = windowDays();
  const open = 8 * 60;
  const close = 22 * 60;
  const span = close - open;
  const byDay = useMemo(() => {
    const m = new Map<string, { b: Row; start: string; end: string; i: number }[]>();
    rows.forEach((b) => b.sessions.forEach((s, i) => {
      const d = s.start.slice(0, 10);
      m.set(d, [...(m.get(d) ?? []), { b, start: s.start, end: s.end, i }]);
    }));
    return m;
  }, [rows]);
  const pos = (iso: string) => {
    const d = new Date(iso);
    return ((d.getUTCHours() * 60 + d.getUTCMinutes() - open) / span) * 100;
  };
  const today = now.toISOString().slice(0, 10);

  return (
    <div className="mt-5">
      {/* grand écran : frise horaire */}
      <div className="hidden md:block">
        <div className="sticky top-16 z-10 grid grid-cols-[120px_1fr] bg-night py-2 text-[12px] text-night-ink-2">
          <span />
          <div className="relative h-4">
            {Array.from({ length: 8 }, (_, i) => 8 + i * 2).map((h) => (
              <span key={h} className="tabular absolute -translate-x-1/2" style={{ left: `${((h * 60 - open) / span) * 100}%` }}>
                {String(h).padStart(2, "0")}h
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-px bg-night-line">
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
            return (
              <div key={d} className={cn("grid grid-cols-[120px_1fr] bg-night", (wd === 0 || wd === 6) && "bg-[#14110e]")}>
                <div className={cn("flex items-center gap-2 px-3 py-2 text-[13.5px]", d === today && "text-night-orange")}>
                  <span className="font-semibold first-letter:uppercase">{formatDay(d, "short")}</span>
                  {items.length > 0 && <span className="tabular text-[12px] text-night-ink-2">{items.length}</span>}
                </div>
                <div className="relative h-12 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(100%/7-1px),rgb(52_45_36/0.6)_calc(100%/7-1px),rgb(52_45_36/0.6)_calc(100%/7))]">
                  {items.map(({ b, start, end, i }) => (
                    <button
                      key={`${b.id}-${i}`}
                      onClick={() => onOpen(b.id)}
                      title={`${formatTime(start)}–${formatTime(end)} · ${b.business.name} · ${STATUS_LABEL[b.status]}`}
                      className={cn("chamfer-sm absolute top-1.5 bottom-1.5 min-w-0 overflow-hidden px-2 text-left text-[12px] leading-tight font-semibold transition-transform hover:-translate-y-px", BLOCK_STYLE[b.status])}
                      style={{ left: `${pos(start)}%`, width: `${pos(end) - pos(start)}%` }}
                    >
                      <span className="block truncate font-bold">{b.business.name}</span>
                      <span className="tabular block truncate font-medium">
                        {formatTime(start)} · {b.mode === "studio" ? "studio" : getCountry(b.country)?.code}
                        {b.sessions.length > 1 ? ` · ${i + 1}/${b.sessions.length}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <Legend />
      </div>

      {/* mobile : agenda */}
      <div className="grid gap-5 md:hidden">
        {days
          .filter((d) => byDay.get(d)?.length)
          .map((d) => (
            <section key={d}>
              <h3 className={cn("text-[14px] font-bold first-letter:uppercase", d === today ? "text-night-orange" : "text-night-ink-2")}>{formatDay(d)}</h3>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-px bg-night-line">
                {byDay
                  .get(d)!
                  .sort((a, z) => a.start.localeCompare(z.start))
                  .map(({ b, start, end, i }) => (
                    <button key={`${b.id}-${i}`} onClick={() => onOpen(b.id)} className="flex min-w-0 items-center gap-3 bg-night-2 px-3 py-3 text-left">
                      <span className="tabular w-[52px] shrink-0 text-[14px] font-bold">
                        {formatTime(start)}
                        <span className="block text-[11.5px] font-normal text-night-ink-2">{formatTime(end)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">{b.business.name}</span>
                        <span className="block truncate text-[12.5px] text-night-ink-2">
                          {b.contact.fullName} · {b.mode === "studio" ? "studio" : getCountry(b.country)?.name}
                        </span>
                      </span>
                      <StatusChip s={b.status} />
                    </button>
                  ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-[12.5px] text-night-ink-2">
      {(["pending", "paid", "confirmed", "done", "no_show"] as BookingStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5", BLOCK_STYLE[s])} /> {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}

/* ───────── Liste des fiches ───────── */
function FicheList({ rows, onOpen }: { rows: Row[]; onOpen: (id: string) => void }) {
  if (!rows.length) return <p className="mt-10 text-center text-[15px] text-night-ink-2">Aucune réservation ne correspond.</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-night-line text-[12px] text-night-ink-2">
            {["Date", "Business", "Contact", "Format", "Pack", "Statut"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const s = b.sessions[0];
            return (
              <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer border-b border-night-line/70 hover:bg-night-2">
                <td className="tabular px-3 py-3 whitespace-nowrap">
                  <button onClick={() => onOpen(b.id)} className="text-left font-semibold first-letter:uppercase">
                    {formatDay(s.start.slice(0, 10), "short")}
                    <span className="block text-[12.5px] font-normal text-night-ink-2">
                      {formatTime(s.start)}–{formatTime(s.end)}
                      {b.sessions.length > 1 ? ` · ×${b.sessions.length}` : ""}
                    </span>
                  </button>
                </td>
                <td className="max-w-[260px] px-3 py-3">
                  <span className="block truncate font-semibold">
                    {b.business.name} {b.demo && <span className="ml-1 text-[11px] font-normal text-night-ink-2">démo</span>}
                  </span>
                  <span className="block truncate text-[12.5px] text-night-ink-2">{b.business.category} · {b.business.pitch}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {b.contact.fullName}
                  <span className="tabular block text-[12.5px] text-night-ink-2">{b.contact.phone}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">{b.mode === "studio" ? "Studio" : getCountry(b.country)?.name}</td>
                <td className="tabular px-3 py-3 whitespace-nowrap">
                  {b.packName}
                  <span className="block text-[12.5px] text-night-ink-2">{fcfa(b.price)}</span>
                </td>
                <td className="px-3 py-3">
                  <StatusChip s={b.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Applications({ apps }: { apps: Application[] }) {
  if (!apps.length)
    return (
      <div className="mt-10 text-center">
        <p className="text-[16px] font-semibold">Aucune candidature pour l&apos;instant.</p>
        <p className="mt-1 text-[14px] text-night-ink-2">
          Le formulaire est sur <a className="text-night-orange underline" href="/animatrice">/animatrice</a>.
        </p>
      </div>
    );
  return (
    <div className="mt-5 grid gap-px bg-night-line">
      {apps.map((a) => (
        <article key={a.id} className="bg-night-2 px-4 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[16px] font-bold">
              {a.fullName} <span className="font-normal text-night-ink-2">· {a.city}</span>
            </p>
            <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="tabular text-[14px] font-semibold text-night-orange">
              {a.phone}
            </a>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-night-ink">{a.why}</p>
          {a.link && (
            <a href={a.link} target="_blank" rel="noopener" className="mt-2 inline-block text-[14px] text-night-orange underline">
              Voir la vidéo / écouter le vocal
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
