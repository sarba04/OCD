"use client";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";

/** Le film « Le samedi d'Afi » : il démarre en silence quand il arrive à l'écran ; on touche pour le son. */
export function FilmSection() {
  const v = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !reduced) el.play().catch(() => {});
        else if (!e.isIntersecting) el.pause();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="film-titre" className="grain-anim relative overflow-hidden bg-[#0a0807] text-night-ink">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgb(241_105_3/0.22),transparent_70%)]" />
      <Reveal className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div>
          <h2 data-r style={{ ["--i" as string]: 0 }} id="film-titre" className="display text-[clamp(44px,9vw,96px)]">
            Le samedi d&apos;Afi.
          </h2>
          <p data-r style={{ ["--i" as string]: 1 }} className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-night-ink-2 sm:text-[19px]">
            Afi coud 40 robes. Personne ne les voit. Puis elle passe en live sur OCD. 46 secondes, avec le son.
          </p>
        </div>
        <div data-r style={{ ["--i" as string]: 2 }} className="relative mx-auto w-[min(78vw,360px)]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] bg-black shadow-[0_60px_120px_-40px_rgb(241_105_3/0.45),0_0_0_1px_rgb(255_255_255/0.08)]">
            <video
              ref={v}
              src="/media/film-720.mp4"
              poster="/media/film-poster.webp"
              muted={muted}
              loop
              playsInline
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              aria-label="Film de présentation d'OCD Live : le samedi d'Afi, couturière à Lomé"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => (v.current?.paused ? v.current.play() : v.current?.pause())}
                aria-label={playing ? "Mettre en pause" : "Lire le film"}
                className="grid size-11 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
              >
                {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = v.current;
                  if (!el) return;
                  el.muted = !muted;
                  setMuted(!muted);
                  if (el.paused) el.play().catch(() => {});
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white/90 px-4 text-[14px] font-semibold text-ink backdrop-blur transition-colors hover:bg-white"
              >
                {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
                {muted ? "Activer le son" : "Couper le son"}
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
