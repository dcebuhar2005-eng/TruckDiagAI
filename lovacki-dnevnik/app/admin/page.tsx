import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Admin from "./Admin";

export const metadata: Metadata = { title: "Administracija", robots: { index: false } };

export default function Page() {
  return (
    <Stranica>
      <Admin />
    </Stranica>
  );
}
