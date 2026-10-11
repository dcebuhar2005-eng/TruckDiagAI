import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Lovci from "./Lovci";

export const metadata: Metadata = { title: "Lovci" };

export default function Page() {
  return (
    <Stranica>
      <Lovci />
    </Stranica>
  );
}
