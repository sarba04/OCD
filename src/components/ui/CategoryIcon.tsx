import { Gem, Layers, Leaf, Scissors, Shirt, Smartphone, Sofa, Sparkles, UtensilsCrossed, Wrench, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  mode: Shirt,
  wax: Layers,
  beaute: Sparkles,
  cheveux: Scissors,
  tech: Smartphone,
  maison: Sofa,
  bijoux: Gem,
  local: Leaf,
  services: Wrench,
};

/** L'icône d'un rayon, au trait, dans le même style partout. */
export function CategoryIcon({ id, className, strokeWidth = 1.8 }: { id: string; className?: string; strokeWidth?: number }) {
  const I = ICONS[id] ?? Sparkles;
  return <I className={className} strokeWidth={strokeWidth} aria-hidden />;
}
