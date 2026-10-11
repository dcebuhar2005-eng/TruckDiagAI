import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Lovista from "./Lovista";

export const metadata: Metadata = { title: "Lovišta" };

export default function Page() {
  return (
    <Stranica>
      <Lovista />
    </Stranica>
  );
}
