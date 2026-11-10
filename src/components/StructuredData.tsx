import { BRAND, PACKS } from "@/lib/config";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

/** Données structurées (schema.org) : Google comprend qu'OCD Live est un studio de live à Lomé, avec ses offres et ses prix. */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${SITE}/#studio`,
        name: "OCD Live",
        alternateName: ["OCD Live Lomé", "Studio OCD Live"],
        description:
          "Studio de lives à Lomé : réserve un live au studio ou à distance pour présenter ton produit, ton numéro et ton adresse en direct sur House of Challenge.",
        url: SITE,
        image: `${SITE}/og.jpg`,
        logo: `${SITE}/brand/ocd-logo.svg`,
        address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
        areaServed: [{ "@type": "Continent", name: "Afrique" }, { "@type": "Country", name: "Togo" }],
        priceRange: "15 000 F – 120 000 F CFA",
        currenciesAccepted: "XOF",
        paymentAccepted: "Flooz, Mixx by Yas, espèces",
        ...(BRAND.whatsapp ? { telephone: `+${BRAND.whatsapp}` } : {}),
      },
      {
        "@type": "Service",
        name: "Réservation de live OCD Live",
        serviceType: "Live shopping et promotion de produits en direct",
        provider: { "@id": `${SITE}/#studio` },
        areaServed: { "@type": "Continent", name: "Afrique" },
        offers: PACKS.map((p) => ({
          "@type": "Offer",
          name: `Pack ${p.name}`,
          description: p.includes.join(". "),
          price: p.price,
          priceCurrency: "XOF",
          availability: "https://schema.org/InStock",
          url: SITE,
        })),
      },
      {
        "@type": "WebSite",
        name: "OCD Live",
        url: SITE,
        inLanguage: "fr",
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
