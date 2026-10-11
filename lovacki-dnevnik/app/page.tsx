import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Pregled from "./Pregled";

export const metadata: Metadata = { title: "Pregled" };

export default function Page() {
  return (
    <Stranica>
      <Pregled />
    </Stranica>
  );
}
