"use client";

import { useState } from "react";
import { useBaza } from "@/lib/store";
import { IzlazakDetalj, OdstrelDetalj } from "./Detalji";
import IzlazakUrednik from "./IzlazakUrednik";
import { useZahtjev } from "./kontroler";
import OdstrelUrednik from "./OdstrelUrednik";
import { DozvolaUrednik, LovisteUrednik, TockaUrednik } from "./OstaliUrednici";

/** Jedno mjesto koje prikazuje sve obrasce i detalje kao klizne ploče. */
export default function Urednici() {
  const baza = useBaza();
  const z = useZahtjev();
  // Pamtimo zadnji zahtjev kako bi ploča mogla animirano nestati nakon zatvaranja.
  const [zadnji, setZadnji] = useState(z);
  if (z && z !== zadnji) setZadnji(z);
  if (!baza || !zadnji) return null;

  const o = !!z && z.kljuc === zadnji.kljuc;
  const k = zadnji.kljuc;
  switch (zadnji.tip) {
    case "izlazak":
      return <IzlazakUrednik key={k} baza={baza} otvorena={o} id={zadnji.id} pocetno={zadnji.pocetno} />;
    case "odstrel":
      return <OdstrelUrednik key={k} baza={baza} otvorena={o} id={zadnji.id} pocetno={zadnji.pocetno} />;
    case "loviste":
      return <LovisteUrednik key={k} baza={baza} otvorena={o} id={zadnji.id} />;
    case "dozvola":
      return <DozvolaUrednik key={k} baza={baza} otvorena={o} id={zadnji.id} />;
    case "tocka":
      return <TockaUrednik key={k} baza={baza} otvorena={o} id={zadnji.id} pocetno={zadnji.pocetno} />;
    case "detalj-izlazak":
      return <IzlazakDetalj key={k} baza={baza} otvorena={o} id={zadnji.id} />;
    case "detalj-odstrel":
      return <OdstrelDetalj key={k} baza={baza} otvorena={o} id={zadnji.id} />;
  }
}
