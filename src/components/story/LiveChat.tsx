import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

type C = [user: string, city: string, text: string];

const ROW1: C[] = [
  ["kafui", "Lomé", "vous livrez à Kara ?"],
  ["mel.yde", "Yaoundé", "dispo en 42 ?"],
  ["awa_sn", "Dakar", "je prends 2 🔥"],
  ["kossi", "Kpalimé", "c'est combien la rouge ?"],
  ["ines", "Douala", "trop belle 😍"],
  ["yao.k", "Abidjan", "vous envoyez à Bouaké ?"],
  ["fatime", "N'Djamena", "le modèle bleu existe ?"],
];
const ROW2: C[] = [
  ["ama", "Lomé", "je passe ce soir à Bè"],
  ["sika", "Cotonou", "livraison à Calavi ?"],
  ["dela", "Paris", "vous expédiez en France ?"],
  ["mimi", "Libreville", "envoyez le numéro svp"],
  ["sena_b", "Aného", "commande validée ✅"],
  ["junior", "Ouaga", "prix pour 3 ?"],
  ["akos", "Bruxelles", "je veux la même 🙏"],
];
const HUES = ["#f16903", "#17704a", "#2563eb", "#b34a00", "#7c3aed", "#e5262b", "#0e7490"];

function Bubble({ c, k }: { c: C; k: number }) {
  return (
    <span className="mr-3 inline-flex shrink-0 items-center gap-2.5 rounded-full bg-card py-1.5 pr-4 pl-1.5 shadow-[0_6px_20px_-12px_rgb(22_18_14/0.4)] ring-1 ring-black/5">
      <span className="grid size-8 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: HUES[k % HUES.length] }}>
        {c[0][0].toUpperCase()}
      </span>
      <span className="text-[14px] whitespace-nowrap sm:text-[15px]">
        <b className="font-semibold">{c[0]}</b> <span className="text-ink-3">· {c[1]}</span> <span className="text-ink">{c[2]}</span>
      </span>
      {k % 3 === 1 && <Heart className="size-4 fill-live text-live" aria-hidden />}
    </span>
  );
}

function Row({ items, rev, offset = 0 }: { items: C[]; rev?: boolean; offset?: number }) {
  const row = items.map((c, i) => <Bubble key={c[0]} c={c} k={i + offset} />);
  return (
    <div className="chat-mask overflow-hidden py-1.5">
      <div className={cn("chat-track flex w-max", rev && "rev")}>
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}

/** Le public d'un live : des commentaires de toute l'Afrique et de la diaspora, qui défilent. */
export function LiveChat() {
  return (
    <section aria-labelledby="public-titre" className="overflow-hidden bg-paper py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="public-titre" className="display max-w-[14ch] text-[clamp(40px,7vw,80px)]">
          Ton public est partout.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          Pendant ton live, ils commentent depuis Lomé, Douala, Dakar ou Paris. Ils demandent, ils commandent, et ils notent ton numéro.
        </p>
      </div>
      <div aria-hidden className="mt-10 grid gap-1 sm:mt-14">
        <Row items={ROW1} />
        <Row items={ROW2} rev offset={3} />
      </div>
    </section>
  );
}
