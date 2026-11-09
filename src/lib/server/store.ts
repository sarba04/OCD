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

export function getStore(): Promise<Store> {
  if (!g.__ocdStore) {
    g.__ocdStore = process.env.DATABASE_URL
      ? import("./store-postgres").then((m) => m.createPostgresStore(process.env.DATABASE_URL!))
      : import("./store-memory").then((m) => m.createMemoryStore());
  }
  return g.__ocdStore;
}

export const isDemo = () => !process.env.DATABASE_URL;
