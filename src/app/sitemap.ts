import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/en-live`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/shorts`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE}/animatrice`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
