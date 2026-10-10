import { ViewTransition, type ReactNode } from "react";

/** Omotač svake stranice – smjerni prijelaz pri navigaciji. */
export default function Stranica({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ naprijed: "naprijed", natrag: "natrag", default: "izblijedi" }}
      exit={{ naprijed: "naprijed", natrag: "natrag", default: "izblijedi" }}
      default="none"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 md:px-8 md:pt-10 lg:pb-16">
        {children}
      </div>
    </ViewTransition>
  );
}
