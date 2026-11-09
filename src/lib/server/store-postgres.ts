import "server-only";
import postgres from "postgres";
import type { Interval } from "../schedule";
import type { Booking, BookingStatus } from "../types";
import type { LiveEntry, Seller } from "../lives";
import { ConflictError, type Application, type Store } from "./store";

/**
 * Stockage Postgres (Supabase, Neon, Vercel Postgres… n'importe quel Postgres ≥ 13).
 * Les tables sont créées automatiquement au premier appel.
 * La contrainte d'exclusion garantit qu'aucun live ne peut en chevaucher un autre, même en cas de clics simultanés.
 */
const SCHEMA = `
create table if not exists ocd_bookings (
  id uuid primary key,
  ref text unique not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','paid','confirmed','done','no_show','cancelled')),
  mode text not null check (mode in ('studio','remote')),
  country text not null,
  timezone text not null,
  pack_id text not null,
  pack_name text not null,
  price integer not null,
  sessions jsonb not null,
  business jsonb not null,
  contact jsonb not null,
  payment_method text not null,
  photo text
);
create table if not exists ocd_slots (
  booking_id uuid not null references ocd_bookings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  constraint ocd_slots_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (active)
);
create index if not exists ocd_slots_booking_idx on ocd_slots (booking_id);
create table if not exists ocd_applications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text not null,
  city text not null,
  why text not null,
  link text not null default ''
);
create table if not exists ocd_lives (
  id uuid primary key,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  day date not null,
  session text not null,
  name text not null,
  country text not null,
  category text not null,
  url text not null,
  short_url text not null default '',
  phone text not null,
  reviewed_at timestamptz,
  subscribed boolean not null default false
);
create index if not exists ocd_lives_day_idx on ocd_lives (day, status);
create table if not exists ocd_live_sellers (
  phone text primary key,
  name text not null,
  paid_until date
);
`;

/** Clé du verrou applicatif qui sérialise les écritures de créneaux. */
const LOCK = 7_042_026;

type Row = {
  id: string;
  ref: string;
  created_at: Date;
  status: BookingStatus;
  mode: Booking["mode"];
  country: string;
  timezone: string;
  pack_id: string;
  pack_name: string;
  price: number;
  sessions: Interval[];
  business: Booking["business"];
  contact: Booking["contact"];
  payment_method: string;
  photo: string | null;
};

const toBooking = (r: Row): Booking => ({
  id: r.id,
  ref: r.ref,
  createdAt: new Date(r.created_at).toISOString(),
  status: r.status,
  mode: r.mode,
  country: r.country,
  timezone: r.timezone,
  packId: r.pack_id,
  packName: r.pack_name,
  price: r.price,
  sessions: r.sessions,
  business: r.business,
  contact: r.contact,
  paymentMethod: r.payment_method,
  photo: r.photo,
});

export async function createPostgresStore(url: string): Promise<Store> {
  const local = /localhost|127\.0\.0\.1|sslmode=disable/.test(url);
  const sql = postgres(url, {
    prepare: false, // compatible avec les poolers (Supabase port 6543, PgBouncer)
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: local ? false : "require",
    onnotice: () => {},
  });

  /*
   * Création des tables : seulement si l'une d'elles manque (pas de verrou pris à chaque démarrage),
   * et jamais plus de quelques secondes d'attente sur un verrou : sinon on échoue proprement et on réessaie
   * à la requête suivante, au lieu de bloquer tout le site.
   */
  const [{ ok }] = await sql<{ ok: boolean }[]>`
    select (to_regclass('public.ocd_bookings') is not null and to_regclass('public.ocd_slots') is not null
      and to_regclass('public.ocd_applications') is not null and to_regclass('public.ocd_lives') is not null
      and to_regclass('public.ocd_live_sellers') is not null) as ok`;
  if (!ok) {
    await sql.begin(async (tx) => {
      await tx.unsafe("set local lock_timeout = '5s'; set local statement_timeout = '30s'");
      await tx.unsafe(SCHEMA);
    });
  }

  const COLS = sql`id, ref, created_at, status, mode, country, timezone, pack_id, pack_name, price, sessions, business, contact, payment_method`;

  return {
    kind: "postgres",

    async listBusy(from, to) {
      const rows = await sql<{ starts_at: Date; ends_at: Date }[]>`
        select starts_at, ends_at from ocd_slots
        where active and ends_at > ${from} and starts_at < ${to}`;
      return rows.map((r) => ({ start: new Date(r.starts_at).toISOString(), end: new Date(r.ends_at).toISOString() }));
    },

    async createBooking(b, busySlots) {
      try {
        await sql.begin(async (tx) => {
          // une réservation à la fois : évite les verrous croisés quand plusieurs personnes cliquent en même temps
          await tx`select pg_advisory_xact_lock(${LOCK})`;
          await tx`
            insert into ocd_bookings (id, ref, created_at, status, mode, country, timezone, pack_id, pack_name, price,
              sessions, business, contact, payment_method, photo)
            values (${b.id}, ${b.ref}, ${b.createdAt}, ${b.status}, ${b.mode}, ${b.country}, ${b.timezone}, ${b.packId},
              ${b.packName}, ${b.price}, ${tx.json(b.sessions as never)}, ${tx.json(b.business as never)},
              ${tx.json(b.contact as never)}, ${b.paymentMethod}, ${b.photo})`;
          for (const s of busySlots) {
            await tx`insert into ocd_slots (booking_id, starts_at, ends_at) values (${b.id}, ${s.start}, ${s.end})`;
          }
        });
      } catch (e) {
        if (["23P01", "40P01"].includes((e as { code?: string }).code ?? "")) throw new ConflictError();
        throw e;
      }
      return b;
    },

    async listBookings() {
      const rows = await sql<Row[]>`select ${COLS}, photo from ocd_bookings order by (sessions->0->>'start') asc`;
      return rows.map(toBooking);
    },

    async getBooking(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const rows = await sql<Row[]>`select ${COLS}, photo from ocd_bookings where id = ${id}`;
      return rows[0] ? toBooking(rows[0]) : null;
    },

    async updateStatus(id, status) {
      try {
        const rows = await sql.begin(async (tx) => {
          await tx`select pg_advisory_xact_lock(${LOCK})`;
          const r = await tx<Row[]>`update ocd_bookings set status = ${status} where id = ${id} returning ${COLS}, photo`;
          await tx`update ocd_slots set active = ${status !== "cancelled"} where booking_id = ${id}`;
          return r;
        });
        return rows[0] ? toBooking(rows[0] as Row) : null;
      } catch (e) {
        if ((e as { code?: string }).code === "23P01")
          throw new ConflictError("Impossible de réactiver : le créneau a été repris entre-temps.");
        throw e;
      }
    },

    async createApplication(a) {
      await sql`insert into ocd_applications (id, created_at, full_name, phone, city, why, link)
        values (${a.id}, ${a.createdAt}, ${a.fullName}, ${a.phone}, ${a.city}, ${a.why}, ${a.link})`;
    },

    async listApplications() {
      const rows = await sql<
        { id: string; created_at: Date; full_name: string; phone: string; city: string; why: string; link: string }[]
      >`select * from ocd_applications order by created_at desc`;
      return rows.map((r) => ({
        id: r.id,
        createdAt: new Date(r.created_at).toISOString(),
        fullName: r.full_name,
        phone: r.phone,
        city: r.city,
        why: r.why,
        link: r.link,
      }));
    },

    async createLive(e) {
      await sql`insert into ocd_lives (id, created_at, status, day, session, name, country, category, url, short_url, phone, reviewed_at, subscribed)
        values (${e.id}, ${e.createdAt}, ${e.status}, ${e.day}, ${e.session}, ${e.name}, ${e.country}, ${e.category}, ${e.url},
          ${e.shortUrl}, ${e.phone}, ${e.reviewedAt}, ${e.subscribed})`;
    },

    async listLives(opts = {}) {
      const rows = await sql<LiveRow[]>`select * from ocd_lives
        where true
        ${opts.day ? sql`and day = ${opts.day}` : sql``}
        ${opts.status ? sql`and status = ${opts.status}` : sql``}
        ${opts.since ? sql`and created_at >= ${opts.since}` : sql``}
        order by created_at desc limit 500`;
      return rows.map(toLive);
    },

    async updateLive(id, status) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const rows = await sql<LiveRow[]>`update ocd_lives set status = ${status}, reviewed_at = now() where id = ${id} returning *`;
      return rows[0] ? toLive(rows[0]) : null;
    },

    async getSeller(phone) {
      const rows = await sql<{ phone: string; name: string; paid_until: Date | string | null }[]>`select * from ocd_live_sellers where phone = ${phone}`;
      return rows[0] ? toSeller(rows[0]) : null;
    },

    async extendSeller(phone, name, days) {
      const rows = await sql<{ phone: string; name: string; paid_until: Date | string | null }[]>`
        insert into ocd_live_sellers (phone, name, paid_until) values (${phone}, ${name}, current_date + ${days}::int)
        on conflict (phone) do update set name = excluded.name,
          paid_until = greatest(coalesce(ocd_live_sellers.paid_until, current_date), current_date) + ${days}::int
        returning *`;
      return toSeller(rows[0]);
    },
  };
}

type LiveRow = {
  id: string;
  created_at: Date;
  status: LiveEntry["status"];
  day: Date | string;
  session: LiveEntry["session"];
  name: string;
  country: string;
  category: LiveEntry["category"];
  url: string;
  short_url: string;
  phone: string;
  reviewed_at: Date | null;
  subscribed: boolean;
};

const isoDay = (d: Date | string) => (typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));

const toLive = (r: LiveRow): LiveEntry => ({
  id: r.id,
  createdAt: new Date(r.created_at).toISOString(),
  status: r.status,
  day: isoDay(r.day),
  session: r.session,
  name: r.name,
  country: r.country,
  category: r.category,
  url: r.url,
  shortUrl: r.short_url,
  phone: r.phone,
  reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
  subscribed: r.subscribed,
});

const toSeller = (r: { phone: string; name: string; paid_until: Date | string | null }): Seller => ({
  phone: r.phone,
  name: r.name,
  paidUntil: r.paid_until ? isoDay(r.paid_until) : null,
});
