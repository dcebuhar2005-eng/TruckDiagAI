"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { konfigurirano, pokreniDrustvo, useDrustvo } from "@/lib/drustvo";
import { pokreniSinkronizaciju, useSinkronizacija } from "@/lib/sinkronizacija";
import { automatskaKopija } from "@/lib/kopije";
import { registrirajSW } from "@/lib/offline";
import { useBaza } from "@/lib/store";
import AlarmBlizine from "./AlarmBlizine";
import Navigacija from "./Navigacija";
import PrijavaZaslon from "./PrijavaZaslon";
import Uvod from "./Uvod";
import Urednici from "./urednici/Urednici";
import { Obavijesti } from "./ui";

export default function Ljuska({ children }: { children: ReactNode }) {
  const baza = useBaza();
  const tema = baza?.postavke.tema;

  useEffect(() => {
    pokreniDrustvo();
    registrirajSW();
  }, []);

  // Dnevnik prijavljenog korisnika: sinkronizacija s njegovim privatnim zapisom i mjesečna kopija.
  const drustvo = useDrustvo();
  const sinkronizacija = useSinkronizacija();
  const prijavljen = drustvo.sesija?.user.id;
  useEffect(() => {
    if (!konfigurirano || !drustvo.spremno) return;
    pokreniSinkronizaciju(prijavljen ?? null);
    if (prijavljen) automatskaKopija();
  }, [prijavljen, drustvo.spremno]);
  const trebaPrijava = konfigurirano && drustvo.spremno && !drustvo.sesija;
  const spremnoZaUvod = !konfigurirano || sinkronizacija.spremno;

  useEffect(() => {
    if (!tema) return;
    const primijeni = () => {
      const t =
        tema === "auto"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "tamna"
            : "svijetla"
          : tema;
      document.documentElement.dataset.tema = t;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", t === "tamna" ? "#0b100c" : "#f2f0e8");
    };
    primijeni();
    if (tema !== "auto") return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    m.addEventListener("change", primijeni);
    return () => m.removeEventListener("change", primijeni);
  }, [tema]);

  return (
    <>
      {!trebaPrijava && (
        <>
          <Navigacija />
          <main className="relative z-10 min-h-dvh lg:pl-[248px]">{children}</main>
        </>
      )}
      <AnimatePresence>{trebaPrijava && <PrijavaZaslon key="prijava" />}</AnimatePresence>
      <AnimatePresence>{baza && spremnoZaUvod && !baza.postavke.dovrsenUvod && <Uvod key="uvod" />}</AnimatePresence>
      <Urednici />
      <Obavijesti />
      <AlarmBlizine />
    </>
  );
}
