/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";

/**
 * L'objet d'un rayon (marmite, robe, pagnes…), détouré, en image : public/cat/{id}.webp (512 px)
 * et {id}-s.webp (160 px) pour les petites pastilles.
 */
export function CategoryArt({ id, small, className }: { id: string; small?: boolean; className?: string }) {
  return (
    <img
      src={`/cat/${id}${small ? "-s" : ""}.webp`}
      alt=""
      width={small ? 160 : 512}
      height={small ? 160 : 512}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.18)]", className)}
    />
  );
}
