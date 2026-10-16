"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { konfigurirano, pokreniDrustvo, useDrustvo } from "@/lib/drustvo";
import { pokreniSinkronizaciju, useSinkronizacija } from "@/lib/sinkronizacija";
import { automatskaKopija, vratiAkoJePrazno } from "@/lib/kopije";
import { registrirajSW } from "@/lib/offline";
import { aktivniLov, uskladiPracenje } from "@/lib/lov";
import { ocistiStaroPracenje, pokreniTipkuNatrag } from "@/lib/nativno";
import { oznaciUvodGotov, useBaza, uvodGotov } from "@/lib/store";
import AlarmBlizine from "./AlarmBlizine";
import Navigacija from "./Navigacija";
import PrijavaZaslon from "./PrijavaZaslon";
import Uvod from "./Uvod";
import Urednici from "./urednici/Urednici";
import { zabiljeziDan, zabiljeziVerziju } from "@/lib/verzija";
import NovaVerzija from "./NovaVerzija";
import PitanjeMisljenja from "./PitanjeMisljenja";
import PozivTesterima from "./PozivTesterima";
import { Obavijesti, obavijest } from "./ui";

export default function Ljuska({ children }: { children: ReactNode }) {
  const baza = useBaza();
  const tema = baza?.postavke.tema;

  useEffect(() => {
    pokreniDrustvo();
    registrirajSW();
    // GPS praćenje ostalo od prethodnog učitavanja stranice (nastavlja se ako je lov u tijeku).
    ocistiStaroPracenje();
    pokreniTipkuNatrag();
  }, []);

  // Dnevnik prijavljenog korisnika: sinkronizacija s njegovim privatnim zapisom i mjesečna kopija.
  const drustvo = useDrustvo();
  const sinkronizacija = useSinkronizacija();
  const prijavljen = drustvo.sesija?.user.id;
  useEffect(() => {
    if (!konfigurirano || !drustvo.spremno) return;
    pokreniSinkronizaciju(prijavljen ?? null);
    if (prijavljen) {
      automatskaKopija();
      zabiljeziVerziju(prijavljen);
    }
  }, [prijavljen, drustvo.spremno]);

  // Dan korištenja – i kad aplikacija ostane otvorena preko noći, bilježi se pri povratku u nju.
  useEffect(() => {
    if (!konfigurirano || !prijavljen) return;
    const zabiljezi = () => document.visibilityState === "visible" && zabiljeziDan(prijavljen);
    zabiljezi();
    document.addEventListener("visibilitychange", zabiljezi);
    return () => document.removeEventListener("visibilitychange", zabiljezi);
  }, [prijavljen]);

  // Prazan dnevnik nakon prijave (npr. nova ikona, novi mobitel): sam vrati zadnju kopiju s podacima.
  const sinkroniziran = sinkronizacija.spremno;
  useEffect(() => {
    if (!konfigurirano || !prijavljen || !sinkroniziran) return;
    vratiAkoJePrazno().then((r) => {
      if (r) obavijest(`Vraćeno iz sigurnosne kopije: ${r.odstrel} odstrela, ${r.izlasci} izlazaka`);
    });
  }, [prijavljen, sinkroniziran]);
  // GPS trag dok je lov u tijeku.
  const lovId = aktivniLov(baza)?.id ?? null;
  useEffect(() => {
    uskladiPracenje(lovId);
  }, [lovId]);
  // Pravila privatnosti moraju se moći pročitati i bez prijave (poveznica iz Google Playa).
  const javno = usePathname() === "/privatnost";
  const trebaPrijava = konfigurirano && drustvo.spremno && !drustvo.sesija && !javno;
  const spremnoZaUvod = !konfigurirano || sinkronizacija.spremno;
  // Uvod samo prvi put: ne za korisnika koji već ima dnevnik u oblaku ni na uređaju gdje je već prošao.
  const [uvodVecProsao] = useState(uvodGotov);
  const uvodZavrsen = baza?.postavke.dovrsenUvod;
  useEffect(() => {
    if (uvodZavrsen) oznaciUvodGotov();
  }, [uvodZavrsen]);
  const prikaziUvod = !javno && !!baza && spremnoZaUvod && !baza.postavke.dovrsenUvod && !sinkronizacija.imaOblak && !uvodVecProsao;

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

  // Ako je u sustavu uključeno „smanji pokrete”, animacije se svode na kratko pojavljivanje.
  return (
    <MotionConfig reducedMotion="user">
      {!trebaPrijava && (
        <>
          <Navigacija />
          <main className="relative z-10 min-h-dvh pt-[env(safe-area-inset-top)] lg:pl-[248px]">{children}</main>
        </>
      )}
      <AnimatePresence>{trebaPrijava && <PrijavaZaslon key="prijava" />}</AnimatePresence>
      <AnimatePresence>{prikaziUvod && <Uvod key="uvod" />}</AnimatePresence>
      <Urednici />
      <Obavijesti />
      <AlarmBlizine />
      <NovaVerzija />
      <PitanjeMisljenja korisnik={prijavljen} zauzet={trebaPrijava || prikaziUvod || Boolean(lovId)} />
      <PozivTesterima korisnik={prijavljen} email={drustvo.sesija?.user.email} zauzet={trebaPrijava || prikaziUvod || Boolean(lovId)} />
    </MotionConfig>
  );
}
