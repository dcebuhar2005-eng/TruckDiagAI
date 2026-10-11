"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { naAlarm } from "@/lib/blizina";
import Ikona from "./Ikona";
import { opruga } from "./ui";

/** Crvena traka preko cijele aplikacije kad se prijatelj u lovu približi. */
export default function AlarmBlizine() {
  const [poruka, setPoruka] = useState<{ tekst: string; k: number } | null>(null);

  useEffect(() => {
    naAlarm((tekst) => setPoruka({ tekst, k: Date.now() }));
    return () => naAlarm(() => {});
  }, []);

  useEffect(() => {
    if (!poruka) return;
    const t = setTimeout(() => setPoruka(null), 25000);
    return () => clearTimeout(t);
  }, [poruka]);

  const [naslov, ...ostalo] = poruka?.tekst.split(": ") ?? [];
  return (
    <AnimatePresence>
      {poruka && (
        <motion.div
          key={poruka.k}
          role="alert"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={opruga}
          className="fixed inset-x-0 top-0 z-[3500] p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div className="mx-auto flex max-w-lg items-start gap-3 rounded-3xl border border-white/20 bg-[#b3261e] p-4 text-white shadow-jaka">
            <motion.span
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20"
            >
              <Ikona ime="upozorenje" velicina={24} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-bold">{naslov}</div>
              <div className="mt-0.5 text-[14px] text-white/90">{ostalo.join(": ")}</div>
            </div>
            <button
              onClick={() => setPoruka(null)}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-[#b3261e]"
            >
              U redu
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
