import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Dozvole from "./Dozvole";

export const metadata: Metadata = { title: "Dozvole" };

export default function Page() {
  return (
    <Stranica>
      <Dozvole />
    </Stranica>
  );
}
