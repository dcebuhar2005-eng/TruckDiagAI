import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Postavke from "./Postavke";

export const metadata: Metadata = { title: "Postavke" };

export default function Page() {
  return (
    <Stranica>
      <Postavke />
    </Stranica>
  );
}
