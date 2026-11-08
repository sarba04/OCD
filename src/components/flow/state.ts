import type { BookingInput, BusinessInfo, ContactInfo, Mode } from "@/lib/types";
import { validateBusiness } from "@/lib/validate";
import { prettyPhone } from "@/lib/format";
import { getCountry } from "@/lib/countries";

export type Step = "scene" | "when" | "pack" | "business" | "review" | "done";
export const FLOW: Step[] = ["scene", "when", "pack", "business", "review"];
export const STEP_PARAM: Record<Step, string> = {
  scene: "",
  when: "quand",
  pack: "pack",
  business: "infos",
  review: "recap",
  done: "confirme",
};
export const STEP_LABEL: Record<Step, string> = {
  scene: "Ta scène",
  when: "Ton jour et ton heure",
  pack: "Ton pack",
  business: "Ton business",
  review: "Vérifie et confirme",
  done: "Réservé",
};

export const stepFromParam = (p: string | null): Step =>
  (Object.entries(STEP_PARAM).find(([, v]) => v === (p ?? ""))?.[0] as Step) || "scene";

export interface Draft {
  mode: Mode | null;
  country: string | null;
  day: string | null;
  time: string | null;
  packId: string | null;
  business: Omit<BusinessInfo, "displayPhone">;
  displayDial: string;
  displayLocal: string;
  contact: Omit<ContactInfo, "phone">;
  sameNumber: boolean;
  contactDial: string;
  contactLocal: string;
  photo: string | null;
  consentImage: boolean;
  consentRules: boolean;
  paymentMethod: string | null;
}

export const EMPTY: Draft = {
  mode: null,
  country: null,
  day: null,
  time: null,
  packId: null,
  business: { name: "", category: "", pitch: "", priceHint: "", address: "", delivers: false, social: "" },
  displayDial: "228",
  displayLocal: "",
  contact: { fullName: "", email: "" },
  sameNumber: true,
  contactDial: "228",
  contactLocal: "",
  photo: null,
  consentImage: false,
  consentRules: false,
  paymentMethod: null,
};

export const countryOf = (d: Draft) => getCountry(d.mode === "studio" ? "TG" : d.country);

export const displayPhone = (d: Draft) => (d.displayLocal.replace(/\D/g, "") ? prettyPhone(d.displayDial, d.displayLocal) : "");
export const contactPhone = (d: Draft) =>
  d.sameNumber ? displayPhone(d) : d.contactLocal.replace(/\D/g, "") ? prettyPhone(d.contactDial, d.contactLocal) : "";

export function businessErrors(d: Draft) {
  const e = validateBusiness(
    { ...d.business, displayPhone: displayPhone(d) },
    { ...d.contact, phone: contactPhone(d) },
    { image: d.consentImage, rules: d.consentRules },
  );
  // même numéro : une seule erreur, sur le champ visible
  if (d.sameNumber) delete e["contact.phone"];
  return e;
}

/** Première étape incomplète : sert à empêcher d'arriver au milieu du parcours sans les infos nécessaires. */
export function firstIncomplete(d: Draft): Step {
  if (!d.mode) return "scene";
  if (!d.day || !d.time || (d.mode === "remote" && !d.country)) return "when";
  if (!d.packId) return "pack";
  if (Object.keys(businessErrors(d)).length) return "business";
  return "review";
}

export function toInput(d: Draft): BookingInput {
  return {
    mode: d.mode!,
    country: d.mode === "studio" ? "TG" : d.country!,
    packId: d.packId!,
    day: d.day!,
    time: d.time!,
    business: { ...d.business, displayPhone: displayPhone(d) },
    contact: { ...d.contact, phone: contactPhone(d) },
    paymentMethod: d.paymentMethod!,
    photo: d.photo,
    consentImage: d.consentImage,
    consentRules: d.consentRules,
  };
}
