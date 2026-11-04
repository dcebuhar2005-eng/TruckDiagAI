"use client";

import { AnimatePresence, motion } from "framer-motion";
import { dodir } from "@/lib/nativno";
import { useEffect, useState } from "react";
import Animacija from "./Animacija";

type Vrsta = "spremljeno" | "konfete";
const slusaci = new Set<(v: Vrsta) => void>();

/** Kratka animacija preko ekrana: kvačica nakon spremanja ili konfete (prvi odstrel…). */
export function slavi(v: Vrsta) {
  dodir("uspjeh");
  slusaci.forEach((f) => f(v));
}

export default function Slavlje() {
  const [v, setV] = useState<{ vrsta: Vrsta; k: number } | null>(null);
  useEffect(() => {
    const f = (vrsta: Vrsta) => setV({ vrsta, k: Date.now() });
    slusaci.add(f);
    return () => void slusaci.delete(f);
  }, []);

  return (
    <AnimatePresence>
      {v && (
        <motion.div
          key={v.k}
          className="pointer-events-none fixed inset-0 z-[3000] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {v.vrsta === "spremljeno" ? (
            <Animacija ime="spremljeno" ponavljaj={false} brzina={1.2} className="size-40 drop-shadow-[0_10px_30px_rgba(0,0,0,.5)]" gotovo={() => setV(null)} />
          ) : (
            <Animacija ime="konfete" ponavljaj={false} className="absolute inset-0 h-full w-full" gotovo={() => setV(null)} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
