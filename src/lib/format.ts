import { EUR_RATE } from "./config";

const nf = new Intl.NumberFormat("fr-FR");

/** 15000 → « 15 000 F » */
export const fcfa = (n: number) => `${nf.format(n)} F`;

/** 15000 → « ≈ 22,87 € » */
export const eur = (n: number) =>
  `≈ ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n / EUR_RATE)}`;

export const initials = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Garde les chiffres et formate par paires : « 90123456 » → « 90 12 34 56 ». */
export function prettyPhone(dial: string, local: string) {
  const digits = local.replace(/\D/g, "");
  const grouped = digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return `+${dial} ${grouped}`.trim();
}

export const waLink = (phoneIntl: string, text?: string) => {
  const n = phoneIntl.replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};
