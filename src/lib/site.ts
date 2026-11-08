/**
 * Adresse publique du site (aperçus WhatsApp, Google, sitemap).
 * 1. NEXT_PUBLIC_SITE_URL si elle est définie (domaine personnalisé, par exemple) ;
 * 2. sinon l'adresse de production que Vercel fournit automatiquement (ex : ocd-pi.vercel.app,
 *    ou le domaine personnalisé dès qu'il est ajouté) ;
 * 3. sinon l'adresse locale de développement.
 */
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
