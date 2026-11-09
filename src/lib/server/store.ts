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
  createLive(e: LiveEntry): Promise<void>;
  listLives(opts?: { day?: string; status?: LiveStatus; since?: string }): Promise<LiveEntry[]>;
  updateLive(id: string, status: LiveStatus): Promise<LiveEntry | null>;
  getSeller(phone: string): Promise<Seller | null>;
  /** Ajoute `days` jours d'abonnement (à partir d'aujourd'hui ou de la fin de l'abonnement en cours). */
  extendSeller(phone: string, name: string, days: number): Promise<Seller>;
}

const g = globalThis as unknown as { __ocdStore?: Promise<Store> };

/** Chaque appel à la base a 12 s maximum : au-delà, on renvoie une erreur au lieu de laisser la page tourner. */
function withTimeouts(store: Store): Store {
  return new Proxy(store, {
    get(target, key, recv) {
      const v = Reflect.get(target, key, recv);
      if (typeof v !== "function") return v;
      return (...args: unknown[]) => {
        let t: ReturnType<typeof setTimeout>;
        const timeout = new Promise<never>((_, reject) => {
          t = setTimeout(() => reject(new Error(`Base de données : « ${String(key)} » trop lent.`)), 12_000);
        });
        return Promise.race([v.apply(target, args), timeout]).finally(() => clearTimeout(t));
      };
    },
  });
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
