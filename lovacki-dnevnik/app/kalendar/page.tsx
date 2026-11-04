import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import LovniKalendar from "./LovniKalendar";

export const metadata: Metadata = { title: "Lovni kalendar" };

export default function Page() {
  return (
    <Stranica>
      <LovniKalendar />
    </Stranica>
  );
}
