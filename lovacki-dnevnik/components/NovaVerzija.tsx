"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Ikona from "./Ikona";
import { opruga } from "./ui";

/**
 * Aplikacija dodana na početni zaslon (osobito na iPhoneu) ostaje otvorena u pozadini danima
 * i ne učitava se ponovno, pa ne bi vidjela novu verziju. Zato pri povratku u aplikaciju
 * provjerava je li objavljena nova verzija i osvježi se.
 */

const MOJA = process.env.NEXT_PUBLIC_VERZIJA ?? "";
const RAZMAK_MS = 60_000;
/** Nakon ovoliko vremena u pozadini aplikacija se osvježi sama (ako nije otvoren obrazac). */
const DUGO_U_POZADINI_MS = 5 * 60_000;

async function objavljenaVerzija(): Promise<string | null> {
  const r = await fetch(`/?provjera=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
  if (!r.ok) return null;
  const m = (await r.text()).match(/name="crolovac-verzija"\s+content="([^"]*)"/);
  return m?.[1] || null;
}

const otvorenObrazac = () => Boolean(document.querySelector(".fixed.inset-0.z-\\[2000\\]"));

function osvjezi() {
  navigator.serviceWorker
    ?.getRegistration()
    .then((reg) => reg?.update())
    .catch(() => {})
    .finally(() => window.location.reload());
}

export default function NovaVerzija() {
  const [nova, setNova] = useState(false);

  useEffect(() => {
    if (!MOJA || process.env.NODE_ENV !== "production") return;
    let zadnja = 0;
    let skriveno = 0;
    let ziv = true;

    const provjeri = async (nakonPozadine: number) => {
      if (!navigator.onLine || Date.now() - zadnja < RAZMAK_MS) return;
      zadnja = Date.now();
      try {
        const v = await objavljenaVerzija();
        if (!ziv || !v || v === MOJA) return;
        if (nakonPozadine >= DUGO_U_POZADINI_MS && !otvorenObrazac()) osvjezi();
        else setNova(true);
      } catch {}
    };

    const vidljivost = () => {
      if (document.visibilityState === "hidden") skriveno = Date.now();
      else provjeri(skriveno ? Date.now() - skriveno : 0);
    };
    const t = setTimeout(() => provjeri(0), 8000);
    const i = setInterval(() => document.visibilityState === "visible" && provjeri(0), 30 * 60_000);
    document.addEventListener("visibilitychange", vidljivost);
    const naMrezi = () => provjeri(0);
    window.addEventListener("online", naMrezi);
    return () => {
      window.removeEventListener("online", naMrezi);
      ziv = false;
      clearTimeout(t);
      clearInterval(i);
      document.removeEventListener("visibilitychange", vidljivost);
    };
  }, []);

  return (
    <AnimatePresence>
      {nova && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={opruga}
          className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[3000] px-3 lg:bottom-6"
        >
          <div className="kartica mx-auto flex max-w-md items-center gap-3 border-naglasak/40 p-3 pl-4 shadow-jaka">
            <Ikona ime="preuzmi" className="shrink-0 text-naglasak" />
            <div className="min-w-0 flex-1 text-[14px] leading-snug">
              <div className="font-semibold">Nova verzija CroLovca</div>
              <div className="text-tekst-2">Vaši podaci ostaju sačuvani.</div>
            </div>
            <button
              onClick={osvjezi}
              className="shrink-0 rounded-xl bg-naglasak px-3.5 py-2 text-[13.5px] font-semibold text-[#0b100c]"
            >
              Osvježi
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
