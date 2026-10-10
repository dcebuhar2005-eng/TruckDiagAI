import type { Metadata } from "next";
import { Suspense } from "react";
import { Kostur } from "@/components/Kostur";
import Stranica from "@/components/Stranica";
import Dnevnik from "./Dnevnik";

export const metadata: Metadata = { title: "Dnevnik" };

export default function Page() {
  return (
    <Stranica>
      <Suspense fallback={<Kostur />}>
        <Dnevnik />
      </Suspense>
    </Stranica>
  );
}
