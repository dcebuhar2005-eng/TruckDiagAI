"use client";

import { motion } from "framer-motion";
import Ikona from "@/components/Ikona";
import { Naslov, djeteListe, roditeljListe } from "@/components/ui";
import { IZVORI } from "@/lib/izvori";

export default function Izvori() {
  return (
    <div>
      <Naslov
        natpis="O aplikaciji"
        naslov="Izvori i licence"
        opis="Karte, podaci i servisi koje Huntora koristi, uz uvjete korištenja. Aplikacija ih koristi umjereno: prognoza se sprema 15 minuta, a šumski putevi 14 dana."
      />
      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-6">
        {IZVORI.map((s) => (
          <motion.section key={s.naslov} variants={djeteListe}>
            <h2 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">{s.naslov}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {s.izvori.map((i) => (
                <article key={i.naziv} className="kartica p-4">
                  <h3 className="font-display text-[17px] leading-snug font-semibold">{i.naziv}</h3>
                  <p className="mt-0.5 text-[13px] text-tekst-3">{i.za}</p>
                  <dl className="mt-3 grid gap-2 text-[13.5px]">
                    <div>
                      <dt className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Licenca</dt>
                      <dd>{i.licenca}</dd>
                    </div>
                    <div>
                      <dt className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Uvjeti</dt>
                      <dd className="text-tekst-2">{i.uvjeti}</dd>
                    </div>
                    <div>
                      <dt className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Ako aplikacija naraste</dt>
                      <dd className="text-tekst-2">{i.kadNaraste}</dd>
                    </div>
                  </dl>
                  <a
                    href={i.poveznica}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-naglasak"
                  >
                    Uvjeti i izvor <Ikona ime="desno" velicina={14} />
                  </a>
                </article>
              ))}
            </div>
          </motion.section>
        ))}
      </motion.div>
      <p className="mt-8 flex items-start gap-2 text-[12.5px] text-tekst-3">
        <Ikona ime="upozorenje" velicina={14} className="mt-0.5 shrink-0" />
        Sažetak uvjeta služi za snalaženje i nije pravni savjet. Prije komercijalne upotrebe provjerite važeće uvjete svakog pružatelja.
      </p>
    </div>
  );
}
