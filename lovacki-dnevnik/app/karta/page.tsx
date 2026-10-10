import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";
import Karta from "./Karta";

export const metadata: Metadata = { title: "Karta" };

export default function Page() {
  return (
    <ViewTransition
      enter={{ naprijed: "naprijed", natrag: "natrag", default: "izblijedi" }}
      exit={{ naprijed: "naprijed", natrag: "natrag", default: "izblijedi" }}
      default="none"
    >
      <div className="fixed inset-0 lg:left-[248px]">
        <Suspense>
          <Karta />
        </Suspense>
      </div>
    </ViewTransition>
  );
}
