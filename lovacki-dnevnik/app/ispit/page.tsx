import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Ispit from "./Ispit";

export const metadata: Metadata = { title: "Lovački ispit" };

export default function Page() {
  return (
    <Stranica>
      <Ispit />
    </Stranica>
  );
}
