"use client";
import { ArrowLeft, ArrowUpRight, Clapperboard, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCountry } from "@/lib/countries";
import { getCategory } from "@/lib/lives";
import { Flag } from "@/components/ui/Flag";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface Short {
  id: string;
  name: string;
  country: string;
  category: string;
  url: string;
  video: string;
}

/** Les Shorts OCD : un fil vertical, une vidéo par écran, comme sur TikTok. */
export function Shorts() {
  const [shorts, setShorts] = useState<Short[] | null>(null);
  useEffect(() => {
    fetch("/api/shorts", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setShorts(j.shorts))
      .catch(() => setShorts([]));
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white">
      <a href="/" aria-label="Retour à l'accueil" className="absolute top-3 left-3 z-20 grid size-12 place-items-center rounded-full bg-black/40 backdrop-blur">
        <ArrowLeft className="size-6" aria-hidden />
      </a>
      <h1 className="absolute top-5 left-1/2 z-20 -translate-x-1/2 text-[16px] font-bold">Shorts OCD</h1>
      <div className="shorts h-full snap-y snap-mandatory overflow-y-auto">
        <FilmShort />
        {(shorts ?? []).map((s) => (
          <TikTokShort key={s.id} s={s} />
        ))}
        <section className="grid h-dvh snap-start place-items-center px-6 text-center">
          <div>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/10" aria-hidden>
              <Clapperboard className="size-8" strokeWidth={1.8} />
            </span>
            <h2 className="display mt-3 text-[34px]">Ta vidéo ici.</h2>
            <p className="mx-auto mt-2 max-w-[30ch] text-[16px] text-white/70">Envoie ton live avec une vidéo courte de ton produit.</p>
            <a href="/en-live" className="mt-6 inline-flex h-14 items-center rounded-full bg-live px-7 text-[17px] font-bold">
              Je suis en live
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Le premier Short : le film OCD Live, qui démarre en silence. */
function FilmShort() {
  const v = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className="relative grid h-dvh snap-start place-items-center">
      <video
        ref={v}
        src="/media/film-720.mp4"
        poster="/media/film-poster.webp"
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label="Film OCD Live : le samedi d'Afi"
        className="h-full w-full max-w-[min(100vw,56.25dvh)] object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[min(100vw,56.25dvh)] items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
        <div>
          <p className="text-[17px] font-bold">OCD Live</p>
          <p className="text-[14px] text-white/75">Le samedi d&apos;Afi</p>
        </div>
        <button
          onClick={() => {
            const el = v.current;
            if (!el) return;
            el.muted = !muted;
            setMuted(!muted);
            el.play().catch(() => {});
          }}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-bold text-ink"
        >
          {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
          {muted ? "Son" : "Couper"}
        </button>
      </div>
    </section>
  );
}

/** Un Short de vendeur : la vidéo TikTok n'est chargée que quand elle arrive à l'écran. */
function TikTokShort({ s }: { s: Short }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const c = getCategory(s.category);
  return (
    <section ref={ref} className="relative grid h-dvh snap-start place-items-center">
      {near ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${s.video}?autoplay=1&loop=1&music_info=1&description=1&rel=0`}
          title={`Vidéo de ${s.name}`}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          className="h-full w-full max-w-[min(100vw,56.25dvh)] border-0"
        />
      ) : (
        <span className="grid size-20 place-items-center rounded-full text-white" style={{ background: c.color }} aria-hidden>
          <CategoryIcon id={c.id} className="size-10" />
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-[min(100vw,56.25dvh)] items-end justify-between gap-3 p-4">
        <p className="rounded-2xl bg-black/60 px-3 py-2 text-[14px] backdrop-blur">
          <b>{s.name}</b>
          <span className="block text-white/75">
            <Flag code={s.country} className="mr-1 inline-block w-5 align-[-2px]" /> {getCountry(s.country)?.name} · {c.label}
          </span>
        </p>
        <a href={s.url} target="_blank" rel="noopener" className="pointer-events-auto inline-flex h-12 items-center gap-1.5 rounded-full bg-live px-4 text-[15px] font-bold">
          Son live <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </section>
  );
}
