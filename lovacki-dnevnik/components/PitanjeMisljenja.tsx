"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { konfigurirano } from "@/lib/drustvo";
import { dodajVrijeme, odgodi, posaljiMisljenje, posaljiNaCekanju, trebaPitati, vecOdgovorio } from "@/lib/misljenje";
import Ikona from "./Ikona";
import { cx, opruga } from "./ui";

const KORAK_MS = 15_000;
const otvorenObrazac = () => Boolean(document.querySelector(".fixed.inset-0.z-\\[2000\\]"));

/** Jednom nakon sat vremena korištenja pita korisnika za mišljenje. Nikad usred upisa ili lova. */
export default function PitanjeMisljenja({ korisnik, zauzet }: { korisnik?: string; zauzet: boolean }) {
  const [faza, setFaza] = useState<"skriveno" | "pitanje" | "tekst" | "hvala">("skriveno");
  const [ocjena, setOcjena] = useState<1 | -1>(1);
  const [tekst, setTekst] = useState("");
  const putanja = usePathname();
  const blokirano = useRef(zauzet);
  useEffect(() => {
    blokirano.current = zauzet || putanja === "/lov" || putanja.startsWith("/admin");
  }, [zauzet, putanja]);

  useEffect(() => {
    if (!konfigurirano || !korisnik) return;
    posaljiNaCekanju().catch(() => {});
    // Odmah provjeri na poslužitelju – tko je već odgovorio (i na drugom uređaju), više se ne pita.
    vecOdgovorio(korisnik).catch(() => {});
    let zadnje = Date.now();
    const otkucaj = () => {
      try {
        const sada = Date.now();
        const vidljivo = document.visibilityState === "visible";
        const s = vidljivo ? dodajVrijeme(korisnik, sada - zadnje) : null;
        zadnje = sada;
        if (s && trebaPitati(s) && !blokirano.current && !otvorenObrazac()) {
          // Pita se samo kad poslužitelj potvrdi da odgovora još nema (bez veze se ne pita).
          vecOdgovorio(korisnik).then((vec) => {
            if (vec === false && !blokirano.current && !otvorenObrazac()) setFaza((f) => (f === "skriveno" ? "pitanje" : f));
          });
        }
      } catch {}
    };
    const vidljivost = () => {
      zadnje = Date.now();
    };
    const naMrezi = () => posaljiNaCekanju().catch(() => {});
    const i = setInterval(otkucaj, KORAK_MS);
    document.addEventListener("visibilitychange", vidljivost);
    window.addEventListener("online", naMrezi);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", vidljivost);
      window.removeEventListener("online", naMrezi);
    };
  }, [korisnik]);

  useEffect(() => {
    if (faza !== "hvala") return;
    const t = setTimeout(() => setFaza("skriveno"), 3500);
    return () => clearTimeout(t);
  }, [faza]);

  if (!korisnik) return null;

  const kasnije = () => {
    odgodi(korisnik);
    setFaza("skriveno");
  };
  const odaberi = (o: 1 | -1) => {
    setOcjena(o);
    setFaza("tekst");
  };
  const posalji = () => {
    posaljiMisljenje(korisnik, ocjena, tekst).catch(() => {});
    setFaza("hvala");
  };

  return (
    <AnimatePresence>
      {faza !== "skriveno" && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={opruga}
          role="dialog"
          aria-label="Vaše mišljenje"
          className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[1900] px-3 lg:bottom-6"
        >
          <div className="kartica relative mx-auto max-w-md border-naglasak/40 p-4 shadow-jaka">
            {faza !== "hvala" && (
              <button onClick={faza === "tekst" ? posalji : kasnije} aria-label="Zatvori" className="absolute top-3 right-3 rounded-lg p-1 text-tekst-3 hover:text-tekst">
                <Ikona ime="x" velicina={18} />
              </button>
            )}
            {faza === "pitanje" && (
              <>
                <div className="pr-8 font-display text-[18px] font-semibold">Kako vam se sviđa CroLovac?</div>
                <p className="mt-1 text-[13.5px] text-tekst-2">Aplikaciju radi jedan lovac – svaki odgovor čitam osobno.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => odaberi(1)} className="rounded-xl border border-rub bg-povrsina-2 py-3 text-[15px] font-semibold hover:border-naglasak">
                    👍 Sviđa mi se
                  </button>
                  <button onClick={() => odaberi(-1)} className="rounded-xl border border-rub bg-povrsina-2 py-3 text-[15px] font-semibold hover:border-naglasak">
                    👎 Ne baš
                  </button>
                </div>
                <button onClick={kasnije} className="mt-2 w-full py-1.5 text-[13px] text-tekst-3">
                  Pitaj me kasnije
                </button>
              </>
            )}
            {faza === "tekst" && (
              <>
                <div className="pr-8 font-display text-[17px] font-semibold">
                  {ocjena === 1 ? "Hvala! Što bi bilo još bolje?" : "Žao mi je. Što vam smeta ili fali?"}
                </div>
                <textarea
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value.slice(0, 2000))}
                  placeholder="Napišite što vam fali, ne radi ili biste promijenili (neobavezno)"
                  className="unos mt-3 min-h-24 w-full text-[16px]"
                />
                <div className="mt-3 flex gap-2">
                  <button onClick={posalji} className="flex-1 rounded-xl py-2.5 text-[14px] text-tekst-2">
                    Preskoči
                  </button>
                  <button
                    onClick={posalji}
                    className={cx("flex-[2] rounded-xl bg-naglasak py-2.5 text-[14.5px] font-semibold text-[#0b100c]", !tekst.trim() && "opacity-70")}
                  >
                    Pošalji
                  </button>
                </div>
              </>
            )}
            {faza === "hvala" && (
              <div className="flex items-center gap-3">
                <Ikona ime="kvacica" className="shrink-0 text-naglasak" />
                <div className="text-[14.5px]">
                  <b>Hvala vam!</b> Vaš odgovor pomaže da CroLovac bude bolji.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
