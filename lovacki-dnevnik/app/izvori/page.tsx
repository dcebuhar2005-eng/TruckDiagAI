import type { Metadata } from "next";
import Stranica from "@/components/Stranica";
import Izvori from "./Izvori";

export const metadata: Metadata = { title: "Izvori i licence" };

export default function Page() {
  return (
    <Stranica>
      <Izvori />
    </Stranica>
  );
}
