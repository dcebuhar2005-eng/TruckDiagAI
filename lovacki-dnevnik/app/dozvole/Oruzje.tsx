"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Ikona from "@/components/Ikona";
import { PodnozjeObrasca, tekst } from "@/components/urednici/zajednicko";
import { Gumb, Ploca, Polje, djeteListe, obavijest, usePotvrda } from "@/components/ui";
import { db } from "@/lib/store";
import type { Baza, Oruzje } from "@/lib/types";

/** Moje oružje: spremi se jednom, a kod upisa odstrela samo se odabere. */
export default function MojeOruzje({ baza }: { baza: Baza }) {
  const [uredi, setUredi] = useState<Oruzje | "novo" | null>(null);
  const oruzje = baza.oruzje ?? [];
  const brojOdstrela = (o: Oruzje) => baza.odstrel.filter((x) => x.oruzje === o.naziv && !x.tudji).length;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold">Moje oružje</h2>
        <Gumb velicina="sm" ikona="plus" onClick={() => setUredi("novo")}>
          Dodaj oružje
        </Gumb>
      </div>
      {oruzje.length === 0 ? (
        <p className="kartica p-4 text-[14px] text-tekst-2">
          Spremite svoje oružje i kalibar – kod upisa odstrela samo ga odaberete, bez tipkanja.
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {oruzje.map((o) => (
            <motion.button
              key={o.id}
              variants={djeteListe}
              onClick={() => setUredi(o)}
              className="kartica flex items-center gap-3 p-4 text-left hover:bg-povrsina-2"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
                <Ikona ime="nisan" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{o.naziv}</span>
                <span className="block truncate text-[13px] text-tekst-3">
                  {[o.kalibar, o.broj && `br. ${o.broj}`, o.napomena].filter(Boolean).join(" · ") || "Bez kalibra"}
                </span>
              </span>
              <span className="shrink-0 text-right text-[12.5px] text-tekst-3">
                <span className="brojke block text-[16px] font-semibold text-tekst">{brojOdstrela(o)}</span>
                {brojOdstrela(o) % 10 === 1 && brojOdstrela(o) % 100 !== 11 ? "odstrel" : "odstrela"}
              </span>
            </motion.button>
          ))}
        </div>
      )}
      {uredi && <UrediOruzje key={uredi === "novo" ? "novo" : uredi.id} o={uredi === "novo" ? undefined : uredi} zatvori={() => setUredi(null)} />}
    </section>
  );
}

function UrediOruzje({ o, zatvori }: { o?: Oruzje; zatvori: () => void }) {
  const [otvorena, setOtvorena] = useState(true);
  const [naziv, setNaziv] = useState(o?.naziv ?? "");
  const [kalibar, setKalibar] = useState(o?.kalibar ?? "");
  const [broj, setBroj] = useState(o?.broj ?? "");
  const [napomena, setNapomena] = useState(o?.napomena ?? "");
  const potvrda = usePotvrda();
  // Ploča najprije animirano nestane, tek onda se uklanja.
  const zatvoriPlocu = () => {
    setOtvorena(false);
    setTimeout(zatvori, 400);
  };
  const spremi = () => {
    const podaci = { naziv: naziv.trim(), kalibar: tekst(kalibar), broj: tekst(broj), napomena: tekst(napomena) };
    if (o) db.uredi("oruzje", o.id, podaci);
    else db.dodaj("oruzje", podaci);
    obavijest(o ? "Oružje je ažurirano" : "Oružje je spremljeno");
    zatvoriPlocu();
  };
  const obrisi = () =>
    potvrda.pitaj("Obrisati oružje?", "Oružje se uklanja s popisa. Upisani odstreli ostaju kakvi jesu.", () => {
      db.obrisi("oruzje", o!.id);
      obavijest("Oružje je obrisano");
      zatvoriPlocu();
    });
  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvoriPlocu}
        naslov={o ? "Uredi oružje" : "Novo oružje"}
        podnaslov="Odabire se kod upisa odstrela"
        podnozje={<PodnozjeObrasca onSpremi={spremi} onOdustani={zatvoriPlocu} onObrisi={o ? obrisi : undefined} onemoguceno={!naziv.trim()} />}
      >
        <div className="grid gap-3.5">
          <Polje oznaka="Naziv">
            <input className="unos" value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder="npr. Sauer 404" autoFocus={!o} />
          </Polje>
          <Polje oznaka="Kalibar">
            <input className="unos" value={kalibar} onChange={(e) => setKalibar(e.target.value)} placeholder="npr. .308 Win" />
          </Polje>
          <Polje oznaka="Serijski broj" pomoc="Neobavezno – kao u oružnom listu">
            <input className="unos" value={broj} onChange={(e) => setBroj(e.target.value)} />
          </Polje>
          <Polje oznaka="Napomena">
            <input className="unos" value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="npr. optika, sačmarica…" />
          </Polje>
        </div>
      </Ploca>
      {potvrda.element}
    </>
  );
}
