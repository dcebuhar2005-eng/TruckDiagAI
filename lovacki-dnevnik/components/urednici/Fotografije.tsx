"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { smanjiSliku } from "@/lib/foto";
import Ikona from "../Ikona";
import { obavijest } from "../ui";

export interface Slika {
  /** Postojeća fotografija u IndexedDB-u; nova još nema id. */
  id?: string;
  url: string;
}

export const MAKS_SLIKA = 10;

export default function Fotografije({ slike, promjena }: { slike: Slika[]; promjena: (s: Slika[]) => void }) {
  const kamera = useRef<HTMLInputElement>(null);
  const galerija = useRef<HTMLInputElement>(null);

  const dodaj = async (datoteke: FileList | null) => {
    if (!datoteke?.length) return;
    const slobodno = MAKS_SLIKA - slike.length;
    if (slobodno <= 0) return obavijest(`Najviše ${MAKS_SLIKA} fotografija`, "info");
    const nove: Slika[] = [];
    for (const f of Array.from(datoteke).slice(0, slobodno)) {
      try {
        nove.push({ url: await smanjiSliku(f) });
      } catch {
        obavijest("Jedna fotografija se ne može učitati", "greska");
      }
    }
    if (datoteke.length > slobodno) obavijest(`Dodano ${slobodno} – najviše ${MAKS_SLIKA} fotografija`, "info");
    promjena([...slike, ...nove]);
  };

  const ulazi = (
    <>
      <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (dodaj(e.target.files), (e.target.value = ""))} />
      <input ref={galerija} type="file" accept="image/*" multiple hidden onChange={(e) => (dodaj(e.target.files), (e.target.value = ""))} />
    </>
  );

  if (!slike.length) {
    return (
      <div className="overflow-hidden rounded-3xl border-2 border-dashed border-rub-jaki bg-povrsina-2/60">
        {ulazi}
        <div className="flex flex-col items-center px-4 pt-6 pb-4 text-center">
          <div className="mb-2 grid size-14 place-items-center rounded-2xl bg-naglasak-meki text-naglasak">
            <Ikona ime="kamera" velicina={26} />
          </div>
          <div className="font-medium">Fotografije odstrela</div>
          <div className="text-[13px] text-tekst-3">Do {MAKS_SLIKA} slika – trofej, mjesto, markica</div>
        </div>
        <div className="grid grid-cols-2 border-t border-rub">
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => kamera.current?.click()} className="flex items-center justify-center gap-2 py-3.5 text-[14.5px] font-medium text-naglasak">
            <Ikona ime="kamera" velicina={18} /> Fotografiraj
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => galerija.current?.click()} className="flex items-center justify-center gap-2 border-l border-rub py-3.5 text-[14.5px] font-medium text-naglasak">
            <Ikona ime="slojevi" velicina={18} /> Iz galerije
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {ulazi}
      <div className="skriven-klizac -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
        <AnimatePresence initial={false}>
          {slike.map((s, i) => (
            <motion.div
              key={s.id ?? s.url.slice(-40)}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="relative size-32 shrink-0 snap-start overflow-hidden rounded-2xl border border-rub"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={`Fotografija ${i + 1}`} className="size-full object-cover" />
              {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium text-white">Naslovna</span>}
              <button
                type="button"
                aria-label="Ukloni fotografiju"
                onClick={() => promjena(slike.filter((_, j) => j !== i))}
                className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
              >
                <Ikona ime="x" velicina={14} debljina={2.4} />
              </button>
              {i > 0 && (
                <button
                  type="button"
                  aria-label="Postavi kao naslovnu"
                  onClick={() => promjena([s, ...slike.filter((_, j) => j !== i)])}
                  title="Postavi kao naslovnu"
                  className="absolute bottom-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white/85 backdrop-blur"
                >
                  <Ikona ime="zvijezda" velicina={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {slike.length < MAKS_SLIKA && (
          <div className="flex size-32 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-2 border-dashed border-rub-jaki">
            <button type="button" onClick={() => kamera.current?.click()} className="flex flex-1 items-center justify-center gap-1.5 text-[13px] text-naglasak">
              <Ikona ime="kamera" velicina={16} /> Kamera
            </button>
            <button type="button" onClick={() => galerija.current?.click()} className="flex flex-1 items-center justify-center gap-1.5 border-t border-rub text-[13px] text-naglasak">
              <Ikona ime="plus" velicina={16} /> Galerija
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[12px] text-tekst-3">
        {slike.length}/{MAKS_SLIKA} fotografija · zvjezdica postavlja naslovnu
      </p>
    </div>
  );
}
