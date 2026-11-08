import type { BusinessInfo, ContactInfo } from "./types";

export type FieldErrors = Partial<Record<string, string>>;

const digits = (s: string) => s.replace(/\D/g, "");

export function validPhone(intl: string) {
  const d = digits(intl);
  return d.length >= 9 && d.length <= 15;
}

export function validateBusiness(b: BusinessInfo, c: ContactInfo, consents: { image: boolean; rules: boolean }) {
  const e: FieldErrors = {};
  if (b.name.trim().length < 2) e["business.name"] = "Donne le nom de ta boutique ou de ta marque.";
  if (!b.category) e["business.category"] = "Choisis ce qui décrit le mieux ton business.";
  if (b.pitch.trim().length < 8) e["business.pitch"] = "Dis en une phrase ce que tu vas présenter (8 caractères minimum).";
  if (b.pitch.length > 140) e["business.pitch"] = "140 caractères maximum : la régie doit pouvoir le lire d'un coup d'œil.";
  if (!validPhone(b.displayPhone)) e["business.displayPhone"] = "Ce numéro semble incomplet. Vérifie les chiffres.";
  if (b.address.trim().length < 3) e["business.address"] = "Indique au moins ton quartier et ta ville.";
  if (c.fullName.trim().split(/\s+/).length < 2 || c.fullName.trim().length < 4)
    e["contact.fullName"] = "Ton prénom et ton nom, pour qu'on sache qui accueillir.";
  if (!validPhone(c.phone)) e["contact.phone"] = "Ce numéro semble incomplet. Vérifie les chiffres.";
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) e["contact.email"] = "Cette adresse e-mail n'est pas valide.";
  if (!consents.image) e["consentImage"] = "On a besoin de ton accord pour te diffuser en live.";
  if (!consents.rules) e["consentRules"] = "Confirme que ton produit respecte les règles du live.";
  return e;
}
