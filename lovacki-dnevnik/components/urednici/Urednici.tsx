"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useBaza } from "@/lib/store";
import { useZahtjev } from "./kontroler";

// Obrasci se učitavaju zasebno (manje JavaScripta pri pokretanju – brže na slabijim mobitelima);
// odmah nakon učitavanja stranice predučitaju se u pozadini da se otvaraju bez čekanja.
const ucitajDetalje = () => import("./Detalji");
const ucitajOstale = () => import("./OstaliUrednici");
const ucitajIzlazak = () => import("./IzlazakUrednik");
const ucitajOdstrel = () => import("./OdstrelUrednik");
const IzlazakUrednik = dynamic(ucitajIzlazak);
const OdstrelUrednik = dynamic(ucitajOdstrel);
const IzlazakDetalj = dynamic(() => ucitajDetalje().then((m) => m.IzlazakDetalj));
const OdstrelDetalj = dynamic(() => ucitajDetalje().then((m) => m.OdstrelDetalj));
const DozvolaUrednik = dynamic(() => ucitajOstale().then((m) => m.DozvolaUrednik));
const LovisteUrednik = dynamic(() => ucitajOstale().then((m) => m.LovisteUrednik));
const TockaUrednik = dynamic(() => ucitajOstale().then((m) => m.TockaUrednik));

/** Jedno mjesto koje prikazuje sve obrasce i detalje kao klizne ploče. */
export default function Urednici() {
  const baza = useBaza();
  const z = useZahtjev();
  useEffect(() => {
    const t = setTimeout(() => {
      for (const f of [ucitajDetalje, ucitajIzlazak, ucitajOdstrel, ucitajOstale]) f().catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, []);
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
