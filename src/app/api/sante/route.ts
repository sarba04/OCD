import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Diagnostic : la base répond-elle ? Teste une connexion directe (sans le cache du stockage), avec un délai court,
 * et renvoie l'erreur exacte (jamais le mot de passe). Utile pour comprendre un site qui « charge sans fin ».
 */
export async function GET() {
  const url = process.env.DATABASE_URL;
  const region = process.env.VERCEL_REGION ?? "local";
  if (!url) return NextResponse.json({ region, db: "absente (mode démo)" });
  let host = "?";
  let port = "?";
  try {
    const u = new URL(url);
    host = u.hostname;
    port = u.port;
  } catch {
    return NextResponse.json({ region, db: "erreur", message: "DATABASE_URL n'est pas une adresse valide." });
  }
  const t0 = Date.now();
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 8, idle_timeout: 1, ssl: /localhost|127\.0\.0\.1/.test(host) ? false : "require", onnotice: () => {} });
  try {
    const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error("Pas de réponse de la base en 10 s.")), 10_000));
    const rows = await Promise.race([
      sql<{ tables: number }[]>`select count(*)::int as tables from pg_tables where tablename like 'ocd_%'`,
      timeout,
    ]);
    return NextResponse.json({ region, host, port, db: "ok", ms: Date.now() - t0, tables: rows[0].tables }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return NextResponse.json(
      { region, host, port, db: "erreur", ms: Date.now() - t0, code: err.code ?? null, message: (err.message ?? String(e)).replace(url, "[DATABASE_URL]").slice(0, 300) },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  } finally {
    sql.end({ timeout: 1 }).catch(() => {});
  }
}
