/**
 * Configuration métier d'OCD Live.
 * Tout ce qu'OCD voudra ajuster (prix, packs, horaires, numéros) est ici ou dans les variables d'environnement.
 */

export const BRAND = {
  name: "OCD Live",
  founder: process.env.NEXT_PUBLIC_FOUNDER_NAME || "Boovan",
  liveAccount: process.env.NEXT_PUBLIC_LIVE_ACCOUNT || "House of Challenge",
  studioCity: "Lomé",
  studioAddress:
    process.env.NEXT_PUBLIC_STUDIO_ADDRESS || "Studio OCD Live, Lomé (adresse exacte envoyée sur WhatsApp)",
  /** Numéro WhatsApp de l'équipe, format international sans + ni espaces (ex : 22890000000). */
  whatsapp: (process.env.NEXT_PUBLIC_OCD_WHATSAPP || "").replace(/\D/g, ""),
  payFlooz: process.env.NEXT_PUBLIC_PAY_FLOOZ || "",
  payMixx: process.env.NEXT_PUBLIC_PAY_MIXX || "",
} as const;

/** Lomé vit à l'heure GMT toute l'année (pas d'heure d'été) : heure de Lomé = UTC. */
export const STUDIO_TZ = "Africa/Lome";

export const SCHEDULE = {
  /** Période ouverte à la réservation (incluse). */
  windowStart: "2026-12-01",
  windowEnd: "2026-12-31",
  /** Heures de début possibles (heure de Lomé). */
  startTimes: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
  /** Durée d'un live standard. */
  baseMinutes: 90,
  /** Temps d'installation / rangement entre deux lives. */
  bufferMinutes: 30,
  /** Heure de fin maximale d'un live. */
  closeTime: "22:00",
  /** Créneaux du soir, quand l'audience est la plus forte. */
  primeTimes: ["18:00", "20:00"],
  /** Jours fermés (AAAA-MM-JJ) et jours de semaine fermés (0 = dimanche). */
  closedDates: [] as string[],
  closedWeekdays: [] as number[],
  /** Délai minimum entre la réservation et le début du live. */
  minLeadHours: 12,
} as const;

export type PackPattern = "single" | "consecutive" | "weekly";

export interface Pack {
  id: string;
  name: string;
  tagline: string;
  /** Nombre de lives inclus. */
  sessions: number;
  /** Durée de chaque live en minutes. */
  minutes: number;
  pattern: PackPattern;
  price: number;
  /** Prix barré (prix normal hors lancement). */
  regular?: number;
  /** Ce qui est inclus, en clair. */
  includes: string[];
  /** Mise en avant. */
  badge?: string;
  /** Illustration en tête de carte. */
  image?: { src: string; alt: string };
  /** Délai minimum spécifique (préparation d'un teaser, annonce…). */
  minLeadHours?: number;
  /** Afficher le prix à l'heure (pertinent quand le pack est « que du live »). */
  showHourly?: boolean;
  /** Pack haut de gamme : carte sombre et lumineuse. */
  premium?: boolean;
}

export const PACKS: Pack[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Ton premier live, sans prise de tête.",
    sessions: 1,
    minutes: 90,
    pattern: "single",
    price: 15000,
    regular: 20000,
    showHourly: true,
    includes: [
      `Diffusé en direct sur le compte ${BRAND.liveAccount}`,
      "Une régie qui dirige ton live du début à la fin",
      "Ton numéro et ton adresse affichés à l'écran",
    ],
  },
  {
    id: "marathon",
    name: "Marathon",
    tagline: "4 heures pour tout montrer et répondre à tout le monde.",
    sessions: 1,
    minutes: 240,
    pattern: "single",
    price: 35000,
    showHourly: true,
    includes: [
      "L'heure la moins chère de tous les packs",
      "Le temps de répondre à chaque question",
      "Une pause de 10 min prévue avec la régie",
    ],
  },
  {
    id: "vitrine",
    name: "Vitrine",
    tagline: "On fait monter l'envie avant ton live.",
    sessions: 1,
    minutes: 90,
    pattern: "single",
    price: 30000,
    badge: "Le plus choisi",
    image: { src: "pack-vitrine", alt: "Un vidéaste filme des sandales en cuir pour le teaser" },
    minLeadHours: 48,
    includes: [
      "Une vidéo teaser tournée et montée par l'équipe",
      "Le teaser publié avant ton live pour attirer ton audience",
    ],
  },
  {
    id: "serie",
    name: "Série",
    tagline: "3 jours d'affilée : ton audience sait où te retrouver.",
    sessions: 3,
    minutes: 90,
    pattern: "consecutive",
    price: 50000,
    showHourly: true,
    includes: [
      "Même heure chaque jour",
      "Tes clients reviennent, ta confiance monte",
    ],
  },
  {
    id: "spotlight",
    name: `Spotlight ${BRAND.founder}`,
    tagline: `${BRAND.founder} te présente à sa communauté.`,
    sessions: 1,
    minutes: 90,
    pattern: "single",
    price: 75000,
    minLeadHours: 72,
    premium: true,
    image: { src: "pack-spotlight", alt: "Un live sur téléphone, plein de cœurs" },
    includes: [
      `${BRAND.founder} publie ta vidéo sur son compte`,
      "Il annonce ton live à sa communauté",
      "Puis tu passes en live 1h30",
    ],
  },
  {
    id: "mois",
    name: "Mois OCD",
    tagline: "Un rendez-vous chaque semaine, tout le mois.",
    sessions: 4,
    minutes: 90,
    pattern: "weekly",
    price: 120000,
    showHourly: false,
    premium: true,
    includes: [
      "Le même jour et la même heure chaque semaine",
      `1 annonce par ${BRAND.founder}`,
      "Priorité sur les créneaux du soir",
    ],
  },
];

export const getPack = (id: string | null | undefined) => PACKS.find((p) => p.id === id) || null;

export const CATEGORIES = [
  "Mode",
  "Pagnes & wax",
  "Beauté",
  "Cheveux & perruques",
  "Food & boissons",
  "Tech & téléphones",
  "Maison & déco",
  "Bijoux & accessoires",
  "Produits locaux",
  "Artisanat",
  "Services",
  "Autre",
] as const;

/** Ce qui ne peut pas passer en live (règles TikTok LIVE + bon sens). */
export const FORBIDDEN = [
  "Médicaments et produits « miracles »",
  "Armes, munitions, objets dangereux",
  "Contrefaçons et copies de marques",
  "Alcool, tabac, chicha, vape",
  "Animaux vivants",
  "Tout produit illégal au Togo ou dans ton pays",
];

export const PAYMENT_METHODS = [
  { id: "flooz", label: "Flooz", hint: "Moov Africa", modes: ["studio", "remote"] },
  { id: "mixx", label: "Mixx by Yas", hint: "ex-T-Money", modes: ["studio", "remote"] },
  { id: "cash", label: "Espèces au studio", hint: "Le jour J, avant ton live", modes: ["studio"] },
  { id: "later", label: "L'équipe me contacte", hint: "Wave, transfert, carte…", modes: ["studio", "remote"] },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

/** Parité fixe FCFA / euro. */
export const EUR_RATE = 655.957;
