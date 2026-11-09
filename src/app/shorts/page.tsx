import type { Metadata } from "next";
import { Shorts } from "@/components/home/Shorts";

export const metadata: Metadata = {
  title: "Shorts OCD · OCD Live",
  description: "Les vidéos courtes des vendeurs OCD Live : regarde, puis rejoins leur live.",
};

export default function Page() {
  return <Shorts />;
}
