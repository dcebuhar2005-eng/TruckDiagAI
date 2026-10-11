import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Statistika from "./Statistika";

export const metadata: Metadata = { title: "Statistika" };

export default function Page() {
  return (
    <Stranica>
      <Statistika />
    </Stranica>
  );
}
