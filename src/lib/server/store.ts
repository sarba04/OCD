import "server-only";
import type { Interval } from "../schedule";
import type { Booking, BookingStatus } from "../types";
import type { LiveEntry, LiveStatus, Seller } from "../lives";

export class ConflictError extends Error {
  constructor(message = "Ce créneau vient d'être réservé.") {
    super(message);
  }
}

export interface Application {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  city: string;
  why: string;
  link: string;
}

export interface Store {
  readonly kind: "postgres" | "memory";
  listBusy(from: string, to: string): Promise<Interval[]>;
  /** Doit lever ConflictError si un des créneaux (sessions + installation) chevauche un live existant. */
  createBooking(b: Booking, busySlots: Interval[]): Promise<Booking>;
  listBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | null>;
  updateStatus(id: string, status: BookingStatus): Promise<Booking | null>;
  createApplication(a: Application): Promise<void>;
  listApplications(): Promise<Application[]>;
  /* Annuaire des lives */
  createLive(e: LiveEntry, photo: string | null): Promise<void>;
  /** La photo d'un live (data URL ou chemin /media/… en démo) et son statut. */
  getLivePhoto(id: string): Promise<{ status: LiveStatus; photo: string } | null>;
  listLives(opts?: { day?: string; status?: LiveStatus; since?: string }): Promise<LiveEntry[]>;
  updateLive(id: string, status: LiveStatus): Promise<LiveEntry | null>;
  getSeller(phone: string): Promise<Seller | null>;
  /** Ajoute `days` jours d'abonnement (à partir d'aujourd'hui ou de la fin de l'abonnement en cours). */
  extendSeller(phone: string, name: string, days: number): Promise<Seller>;
  /** Ferme les connexions (on jette un stockage dont la connexion est morte). */
  close(): Promise<void>;
}

const g = globalThis as unknown as { __ocdStore?: Promise<Store> };

/** Lectures sans effet de bord : on peut les relancer sans risque sur une connexion neuve. */
const READS = new Set(["listBusy", "listBookings", "getBooking", "listApplications", "listLives", "getSeller", "getLivePhoto"]);

/**
 * Sur Vercel, l'instance est mise en pause entre deux visites ; pendant la pause, le pooler de la base peut couper
 * la connexion sans prévenir, et une requête envoyée dessus attendrait pour toujours.
 * Donc : chaque appel a 8 s maximum ; au-delà, on jette ce stockage (et ses connexions) et, pour une lecture,
 * on relance une fois sur un stockage neuf.
 */
function withTimeouts(store: Store): Store {
  return new Proxy(store, {
    get(target, key, recv) {
      const v = Reflect.get(target, key, recv);
      if (typeof v !== "function" || key === "close") return v;
      return async (...args: unknown[]) => {
        try {
          return await race(v.apply(target, args), String(key));
        } catch (e) {
          if (!(e instanceof TimeoutError)) throw e;
          drop(target);
          if (!READS.has(String(key))) throw e;
          const fresh = await getStore();
          return race((fresh as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[String(key)](...args), String(key));
        }
      };
    },
  });
}

class TimeoutError extends Error {}

function race<T>(p: Promise<T>, what: string): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new TimeoutError(`Base de données : « ${what} » sans réponse.`)), 8_000);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

function drop(raw: Store) {
  // tout de suite (pas après une promesse) : la relance doit obtenir un stockage neuf
  g.__ocdStore = undefined;
  raw.close().catch(() => {});
}

/**
 * Le stockage, créé une fois par instance. S'il échoue ou met plus de 20 s à démarrer (base injoignable,
 * verrou), on oublie la tentative : la requête suivante réessaie au lieu de rester bloquée pour toujours.
 */
export function getStore(): Promise<Store> {
  if (!g.__ocdStore) {
    const start = process.env.DATABASE_URL
      ? import("./store-postgres").then((m) => m.createPostgresStore(process.env.DATABASE_URL!))
      : import("./store-memory").then((m) => m.createMemoryStore());
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Base de données trop lente à répondre.")), 20_000));
    const p = Promise.race([start, timeout]).then(withTimeouts);
    g.__ocdStore = p;
    p.catch((e) => {
      console.error("[OCD Live] stockage", e);
      if (g.__ocdStore === p) g.__ocdStore = undefined;
    });
  }
  return g.__ocdStore;
}

export const isDemo = () => !process.env.DATABASE_URL;
