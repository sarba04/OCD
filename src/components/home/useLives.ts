"use client";
import { useCallback, useEffect, useState } from "react";
import type { PublicLive } from "@/lib/lives";

export interface LivesState {
  now: string;
  demo: boolean;
  testMode?: boolean;
  session: { id: string; start: string; end: string; endsAt: string | null } | null;
  next: { id: string; start: string; end: string; at: string };
  lives: PublicLive[];
}

/** Les lives validés, rafraîchis toutes les 30 secondes. */
export function useLives() {
  const [data, setData] = useState<LivesState | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/lives", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error();
      setData(await r.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);
  return { data, error, reload: load };
}

/** « dans 2 h 14 » / « dans 12 min » */
export function untilLabel(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60000));
  if (m < 60) return `dans ${m} min`;
  const h = Math.floor(m / 60);
  return `dans ${h} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}`;
}
