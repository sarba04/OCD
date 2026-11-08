import type { Metadata } from "next";
import { Candidature } from "@/components/Candidature";

export const metadata: Metadata = {
  title: "Deviens animatrice · OCD Live",
  description: "Tu sais parler, tu sais vendre ? OCD Live recrute à Lomé pour accompagner les vendeurs en live partout en Afrique. Pas de diplôme demandé.",
};

export default function Page() {
  return <Candidature />;
}
