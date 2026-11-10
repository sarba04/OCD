import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OverlayCard } from "@/components/flow/OverlayCard";
import { checkOverlayToken } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const metadata: Metadata = { title: "Bandeau · OCD Live", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Bandeau d'incrustation pour la régie : à ajouter comme « source navigateur » dans OBS ou TikTok LIVE Studio.
 * Fond transparent, format vertical 1080×1920 : une carte flottante en bas, avec la photo du produit.
 */
export default async function Bandeau({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const { id } = await params;
  const { t } = await searchParams;
  if (!t || !checkOverlayToken(id, t)) notFound();
  const b = await (await getStore()).getBooking(id);
  if (!b) notFound();
  return (
    <>
      <style>{`html,body{background:transparent!important}`}</style>
      <div className="flex min-h-dvh items-end justify-center p-[4vw]">
        <div className="w-full max-w-[1000px] text-[3.6vw]">
          <OverlayCard
            d={{
              name: b.business.name,
              pitch: b.business.pitch,
              phone: b.business.displayPhone,
              address: b.business.address,
              delivers: b.business.delivers,
              priceHint: b.business.priceHint,
              photo: b.photo,
            }}
          />
        </div>
      </div>
    </>
  );
}
