import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Pregled from "./Pregled";

export const metadata: Metadata = { title: { absolute: "Huntora" } };

export default function Page() {
  return (
    <Stranica>
      <Pregled />
    </Stranica>
  );
}
