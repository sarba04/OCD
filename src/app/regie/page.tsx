import type { Metadata } from "next";
import { isAdmin } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/store";
import { RegieApp } from "@/components/regie/RegieApp";
import { RegieLogin } from "@/components/regie/RegieLogin";

export const metadata: Metadata = { title: "Régie · OCD Live", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RegiePage() {
  const ok = await isAdmin();
  return <div className="min-h-dvh bg-night text-night-ink">{ok ? <RegieApp /> : <RegieLogin demo={isDemo()} />}</div>;
}
