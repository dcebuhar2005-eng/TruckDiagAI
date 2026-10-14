import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Privatnost from "./Privatnost";

export const metadata: Metadata = { title: "Pravila privatnosti" };

export default function Page() {
  return (
    <Stranica>
      <Privatnost />
    </Stranica>
  );
}
