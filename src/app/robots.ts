import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ocd-live.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/regie", "/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
