import type { Interval } from "./schedule";

export type Mode = "studio" | "remote";

export type BookingStatus = "pending" | "paid" | "confirmed" | "done" | "no_show" | "cancelled";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Paiement en attente",
  paid: "Payé",
  confirmed: "Confirmé",
  done: "Live fait",
  no_show: "Absent",
  cancelled: "Annulé",
};

export interface BusinessInfo {
  name: string;
  category: string;
  pitch: string;
  priceHint: string;
  /** Numéro affiché à l'écran pendant le live (international, ex : +228 90 12 34 56). */
  displayPhone: string;
  address: string;
  delivers: boolean;
  social: string;
}

export interface ContactInfo {
  fullName: string;
  phone: string;
  email: string;
}

/** Ce que le client envoie. Le prix et les sessions sont recalculés côté serveur. */
export interface BookingInput {
  mode: Mode;
  country: string;
  packId: string;
  day: string;
  time: string;
  business: BusinessInfo;
  contact: ContactInfo;
  paymentMethod: string;
  photo?: string | null;
  consentImage: boolean;
  consentRules: boolean;
  /** Pot de miel anti-robots : doit rester vide. */
  website?: string;
}

export interface Booking {
  id: string;
  ref: string;
  createdAt: string;
  status: BookingStatus;
  mode: Mode;
  country: string;
  timezone: string;
  packId: string;
  packName: string;
  price: number;
  sessions: Interval[];
  business: BusinessInfo;
  contact: ContactInfo;
  paymentMethod: string;
  photo: string | null;
  demo?: boolean;
}

/** Version publique renvoyée au client après réservation. */
export type PublicBooking = Omit<Booking, "photo" | "demo">;
