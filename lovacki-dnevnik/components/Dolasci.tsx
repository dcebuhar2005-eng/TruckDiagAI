"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Ikona from "./Ikona";
import { Cipovi, Gumb, Ploca, Polje, obavijest } from "./ui";
import { OdabirVrste, broj, tekst } from "./urednici/zajednicko";
import { datumKratki, isoDatum, isoVrijeme } from "@/lib/format";
import { db, noviId } from "@/lib/store";
import type { Dolazak, Tocka } from "@/lib/types";

const dvije = (n: number) => String(n).padStart(2, "0");

/** Novije prvo (datum, pa vrijeme). */
export const poRedu = (d: Dolazak[]) => [...d].sort((a, b) => `${b.datum} ${b.vrijeme}`.localeCompare(`${a.datum} ${a.vrijeme}`));

/**
 * Po vrsti: koliko puta je dolazila, zadnji dolazak i sat u kojem najčešće dolazi
 * (dvosatni prozor s najviše dolazaka; preko ponoći se računa kao jedan dan).
 */
export function sazetakDolazaka(dolasci: Dolazak[]) {
  const vrste = new Map<string, Dolazak[]>();
  for (const d of dolasci) vrste.set(d.vrsta, [...(vrste.get(d.vrsta) ?? []), d]);
  return [...vrste]
    .map(([vrsta, d]) => {
      const sati = Array<number>(24).fill(0);
      for (const x of d) sati[Number(x.vrijeme.slice(0, 2)) % 24]++;
      let od = 0;
      for (let h = 1; h < 24; h++) if (sati[h] + sati[(h + 1) % 24] > sati[od] + sati[(od + 1) % 24]) od = h;
      return { vrsta, puta: d.length, zadnji: poRedu(d)[0], prozor: d.length > 1 ? `${dvije(od)}–${dvije((od + 2) % 24)} h` : undefined };
    })
    .sort((a, b) => b.puta - a.puta);
}

/** Ploča s dolascima divljači na točku: upis novog, popis i kad koja divljač najčešće dolazi. */
export function DolasciPloca({ tocka, otvorena, zatvori }: { tocka: Tocka; otvorena: boolean; zatvori: () => void }) {
  const dolasci = tocka.dolasci ?? [];
  const zadnjaVrsta = poRedu(dolasci)[0]?.vrsta ?? "Divlja svinja";
  const [vrsta, setVrsta] = useState(zadnjaVrsta);
  const [kom, setKom] = useState("");
  const [datum, setDatum] = useState(() => isoDatum());
  const [vrijeme, setVrijeme] = useState(() => isoVrijeme());
  const [izvor, setIzvor] = useState<"kamera" | "uzivo">(tocka.tip === "kamera" || tocka.dodatno?.includes("kamera") ? "kamera" : "uzivo");
  const [napomena, setNapomena] = useState("");

  const spremi = () => {
    if (!datum || !vrijeme) return;
    const novi: Dolazak = { id: noviId(), vrsta, broj: broj(kom), datum, vrijeme, izvor, napomena: tekst(napomena) };
    db.uredi("tocke", tocka.id, { dolasci: [...dolasci, novi] });
    obavijest(`Zapisano: ${vrsta.toLowerCase()} ${datumKratki(datum)} u ${vrijeme}`);
    setKom("");
    setNapomena("");
  };
  const obrisi = (d: Dolazak) => {
    db.uredi("tocke", tocka.id, { dolasci: dolasci.filter((x) => x.id !== d.id) });
    obavijest("Dolazak je obrisan", "info", { oznaka: "Poništi", radnja: () => db.uredi("tocke", tocka.id, { dolasci: [...(db.dohvati().tocke.find((t) => t.id === tocka.id)?.dolasci ?? []), d] }) });
  };
  const sazetak = sazetakDolazaka(dolasci);

  return (
    <Ploca otvorena={otvorena} zatvori={zatvori} naslov="Dolasci divljači" podnaslov={`${tocka.naziv} – kad divljač dolazi (kamera ili uživo)`} sirina={480}>
      <div className="grid gap-4 pb-2">
        <div className="grid gap-3 rounded-2xl border border-rub bg-povrsina-2 p-4">
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Polje oznaka="Divljač">
              <OdabirVrste vrijednost={vrsta} promjena={setVrsta} />
            </Polje>
            <Polje oznaka="Komada">
              <input className="unos brojke" inputMode="numeric" placeholder="?" value={kom} onChange={(e) => setKom(e.target.value)} />
            </Polje>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Polje oznaka="Datum">
              <input type="date" className="unos" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </Polje>
            <Polje oznaka="Vrijeme">
              <input type="time" className="unos" value={vrijeme} onChange={(e) => setVrijeme(e.target.value)} />
            </Polje>
          </div>
          <Cipovi
            opcije={[
              { vrijednost: "kamera", oznaka: "📷 S kamere" },
              { vrijednost: "uzivo", oznaka: "👁 Vidio uživo" },
            ]}
            odabrano={izvor}
            promjena={(v) => setIzvor(v as "kamera" | "uzivo")}
          />
          <input className="unos" placeholder="Napomena (npr. krmača s prascima)" value={napomena} onChange={(e) => setNapomena(e.target.value)} />
          <Gumb vrsta="primarni" ikona="plus" onClick={spremi} disabled={!datum || !vrijeme}>
            Zapiši dolazak
          </Gumb>
        </div>

        {sazetak.length > 0 && (
          <div className="grid gap-1.5">
            <h3 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Kad dolaze</h3>
            {sazetak.map((s) => (
              <div key={s.vrsta} className="rounded-xl bg-povrsina-2 px-3.5 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 font-medium">{s.vrsta}</span>
                  <span className="brojke text-[13px] text-tekst-3">{s.puta}×</span>
                </div>
                <div className="text-[13px] text-tekst-2">
                  {s.prozor ? `Najčešće ${s.prozor} · ` : ""}zadnji put {datumKratki(s.zadnji.datum)} u {s.zadnji.vrijeme}
                </div>
              </div>
            ))}
          </div>
        )}

        {dolasci.length > 0 && (
          <div className="grid gap-1.5">
            <h3 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Zapisano</h3>
            <AnimatePresence initial={false}>
              {poRedu(dolasci).map((d) => (
                <motion.div key={d.id} layout exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-xl border border-rub px-3.5 py-2">
                  <span className="brojke w-[86px] shrink-0 text-[13px] text-tekst-2">
                    {datumKratki(d.datum)}
                    <span className="block font-semibold text-tekst">{d.vrijeme}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px]">
                      {d.vrsta}
                      {d.broj ? ` · ${d.broj} kom` : ""}
                    </span>
                    <span className="block truncate text-[12.5px] text-tekst-3">
                      {d.izvor === "kamera" ? "s kamere" : "uživo"}
                      {d.napomena ? ` · ${d.napomena}` : ""}
                    </span>
                  </span>
                  <button className="grid size-9 place-items-center rounded-lg text-tekst-3 hover:text-opasnost" onClick={() => obrisi(d)} aria-label="Obriši dolazak">
                    <Ikona ime="x" velicina={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Ploca>
  );
}
