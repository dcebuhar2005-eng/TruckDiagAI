"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ZADANE_POSTAVKE, useBaza } from "@/lib/store";
import type { Tocka2D } from "@/lib/types";
import Ikona from "../Ikona";
import { Gumb, obavijest } from "../ui";

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
}: {
  otvoren: boolean;
  pocetak?: Tocka2D;
  naslov: string;
  potvrdi: (t: Tocka2D) => void;
  zatvori: () => void;
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

  const gps = () => {
    if (!navigator.geolocation) return obavijest("Lokacija nije podržana", "greska");
    setTrazim(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        promjena({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setTrazim(false);
      },
      () => {
        setTrazim(false);
        obavijest("Lokacija nije dostupna", "greska");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <div className="rounded-2xl border border-rub bg-povrsina-2 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
          <Ikona ime="lokacija" />
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
          {trazim ? "Tražim…" : "Moja lokacija"}
        </Gumb>
      </div>
      <OdabirNaKarti
        otvoren={karta}
        pocetak={vrijednost ?? sredina}
        naslov={naslovKarte ?? naslov}
        potvrdi={promjena}
        zatvori={() => setKarta(false)}
      />
    </div>
  );
}
