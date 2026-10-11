import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Lov from "./Lov";

export const metadata: Metadata = { title: "Lov" };

export default function Page() {
  return (
    <Stranica>
      <Lov />
    </Stranica>
  );
}
