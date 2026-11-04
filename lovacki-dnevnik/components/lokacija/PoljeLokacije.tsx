"use client";

import { AnimatePresence } from "framer-motion";
import Animacija from "../Animacija";
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ZADANE_POSTAVKE, useBaza } from "@/lib/store";
import type { Tocka2D } from "@/lib/types";
import Ikona from "../Ikona";
import { Gumb, obavijest } from "../ui";
import ZalijepiLokaciju from "./ZalijepiLokaciju";
import { preciznaLokacija, upozoriAkoGruba } from "@/lib/gps";

const KartaOdabira = dynamic(() => import("./KartaOdabira"), { ssr: false });

const useNaKlijentu = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

/** Karta za odabir lokacije kao prekrivni sloj preko cijele aplikacije. */
export function OdabirNaKarti({
  otvoren,
  pocetak,
  naslov,
  potvrdi,
  zatvori,
  mojaLokacija,
}: {
  otvoren: boolean;
  pocetak?: Tocka2D;
  naslov: string;
  potvrdi: (t: Tocka2D) => void;
  zatvori: () => void;
  mojaLokacija?: number;
}) {
  const klijent = useNaKlijentu();
  const baza = useBaza();
  if (!klijent) return null;
  return createPortal(
    <AnimatePresence>
      {otvoren && (
        <KartaOdabira
          pocetak={pocetak ?? baza?.postavke.lokacija ?? ZADANE_POSTAVKE.lokacija}
          naslov={naslov}
          mojaLokacija={mojaLokacija}
          odustani={zatvori}
          potvrdi={(t) => {
            potvrdi(t);
            zatvori();
          }}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Polje obrasca: prikaz koordinata + odabir na karti ili GPS-om. */
export default function PoljeLokacije({
  vrijednost,
  promjena,
  naslov = "Lokacija",
  naslovKarte,
  prazno = "Nije odabrano",
  obavezno,
  sredina,
}: {
  vrijednost?: Tocka2D;
  promjena: (t: Tocka2D | undefined) => void;
  naslov?: string;
  naslovKarte?: string;
  prazno?: string;
  obavezno?: boolean;
  /** Gdje se karta otvara dok lokacija nije odabrana (npr. središte lovišta). */
  sredina?: Tocka2D;
}) {
  const [karta, setKarta] = useState(false);
  const [trazim, setTrazim] = useState(false);
  const [tocnost, setTocnost] = useState<number | null>(null);

  const gps = () => {
    setTrazim(true);
    setTocnost(null);
    preciznaLokacija({ napredak: (f) => setTocnost(f.tocnost) })
      .then((f) => {
        promjena({ lat: f.lat, lng: f.lng });
        upozoriAkoGruba(f);
        if (f.tocnost <= 30) obavijest(`Lokacija spremljena (±${Math.round(f.tocnost)} m)`);
      })
      .catch((e: Error) => obavijest(e.message, "greska"))
      .finally(() => setTrazim(false));
  };

  return (
    <div className="rounded-2xl border border-rub bg-povrsina-2 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
          {trazim ? <Animacija ime="lokacija" className="size-9" /> : <Ikona ime="lokacija" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{naslov}</div>
          <div className="brojke truncate text-[12.5px] text-tekst-2">
            {vrijednost ? `${vrijednost.lat.toFixed(5)}°, ${vrijednost.lng.toFixed(5)}°` : prazno}
          </div>
        </div>
        {vrijednost && !obavezno && (
          <button className="p-2 text-tekst-3 hover:text-opasnost" onClick={() => promjena(undefined)} aria-label="Ukloni lokaciju">
            <Ikona ime="x" velicina={16} />
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Gumb velicina="sm" vrsta="primarni" ikona="karta" onClick={() => setKarta(true)}>
          Na karti
        </Gumb>
        <Gumb velicina="sm" ikona="gps" onClick={gps} disabled={trazim}>
          {trazim ? (tocnost != null ? `±${Math.round(tocnost)} m…` : "Tražim GPS…") : "Moja lokacija"}
        </Gumb>
      </div>
      <ZalijepiLokaciju className="mt-2" primijeni={promjena} />
      <OdabirNaKarti
        otvoren={karta}
        pocetak={vrijednost ?? sredina}
        naslov={naslovKarte ?? naslov}
        // Bez odabrane lokacije karta skoči na vas – u lovištu (do 5 km od središta) ili bilo gdje ako lovište nema granicu.
        mojaLokacija={vrijednost ? undefined : sredina ? 5000 : Infinity}
        potvrdi={promjena}
        zatvori={() => setKarta(false)}
      />
    </div>
  );
}
