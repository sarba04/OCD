import type { Metadata } from "next";
import { GoLive } from "@/components/home/GoLive";

export const metadata: Metadata = {
  title: "Je suis en live · OCD Live",
  description: "Tu vends en live sur TikTok ? Envoie ton lien : OCD Live te montre aux acheteurs de ton pays.",
};

export default function Page() {
  return <GoLive />;
}
