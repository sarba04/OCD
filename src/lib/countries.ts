export interface Country {
  code: string;
  name: string;
  dial: string;
  tz: string;
  /** Ville de référence pour afficher l'heure locale. */
  city: string;
  /** Zone euro : on affiche l'équivalent en euros. */
  euro?: boolean;
}

/** Afrique d'abord (francophone + voisins), puis la diaspora. */
export const COUNTRIES: Country[] = [
  { code: "TG", name: "Togo", dial: "228", tz: "Africa/Lome", city: "Lomé" },
  { code: "BJ", name: "Bénin", dial: "229", tz: "Africa/Porto-Novo", city: "Cotonou" },
  { code: "BF", name: "Burkina Faso", dial: "226", tz: "Africa/Ouagadougou", city: "Ouagadougou" },
  { code: "CM", name: "Cameroun", dial: "237", tz: "Africa/Douala", city: "Douala" },
  { code: "CF", name: "Centrafrique", dial: "236", tz: "Africa/Bangui", city: "Bangui" },
  { code: "CG", name: "Congo-Brazzaville", dial: "242", tz: "Africa/Brazzaville", city: "Brazzaville" },
  { code: "CD", name: "RD Congo", dial: "243", tz: "Africa/Kinshasa", city: "Kinshasa" },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", tz: "Africa/Abidjan", city: "Abidjan" },
  { code: "GA", name: "Gabon", dial: "241", tz: "Africa/Libreville", city: "Libreville" },
  { code: "GH", name: "Ghana", dial: "233", tz: "Africa/Accra", city: "Accra" },
  { code: "GN", name: "Guinée", dial: "224", tz: "Africa/Conakry", city: "Conakry" },
  { code: "ML", name: "Mali", dial: "223", tz: "Africa/Bamako", city: "Bamako" },
  { code: "NE", name: "Niger", dial: "227", tz: "Africa/Niamey", city: "Niamey" },
  { code: "NG", name: "Nigeria", dial: "234", tz: "Africa/Lagos", city: "Lagos" },
  { code: "SN", name: "Sénégal", dial: "221", tz: "Africa/Dakar", city: "Dakar" },
  { code: "TD", name: "Tchad", dial: "235", tz: "Africa/Ndjamena", city: "N'Djamena" },
  { code: "MA", name: "Maroc", dial: "212", tz: "Africa/Casablanca", city: "Casablanca" },
  { code: "FR", name: "France", dial: "33", tz: "Europe/Paris", city: "Paris", euro: true },
  { code: "BE", name: "Belgique", dial: "32", tz: "Europe/Brussels", city: "Bruxelles", euro: true },
  { code: "DE", name: "Allemagne", dial: "49", tz: "Europe/Berlin", city: "Berlin", euro: true },
  { code: "CH", name: "Suisse", dial: "41", tz: "Europe/Zurich", city: "Zurich" },
  { code: "IT", name: "Italie", dial: "39", tz: "Europe/Rome", city: "Rome", euro: true },
  { code: "ES", name: "Espagne", dial: "34", tz: "Europe/Madrid", city: "Madrid", euro: true },
  { code: "GB", name: "Royaume-Uni", dial: "44", tz: "Europe/London", city: "Londres" },
  { code: "CA", name: "Canada", dial: "1", tz: "America/Toronto", city: "Montréal" },
  { code: "US", name: "États-Unis", dial: "1", tz: "America/New_York", city: "New York" },
];

export const getCountry = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code) || null;

/** Devine le pays depuis le fuseau du navigateur (côté client uniquement). */
export function guessCountry(): Country | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const exact = COUNTRIES.find((c) => c.tz === tz);
    if (exact) return exact;
    // Fuseaux africains équivalents non listés : on ne devine pas plutôt que de se tromper.
    return null;
  } catch {
    return null;
  }
}
