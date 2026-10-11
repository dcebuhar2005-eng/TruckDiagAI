"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { demoBaza } from "@/lib/demo";
import { db } from "@/lib/store";
import Ikona, { type ImeIkone } from "./Ikona";
import { OdabirNaKarti } from "./lokacija/PoljeLokacije";
import { Znak } from "./Navigacija";
import { Gumb, Polje, cx, obavijest } from "./ui";

const ZNACAJKE: { ikona: ImeIkone; naslov: string; opis: string }[] = [
  { ikona: "dnevnik", naslov: "Dnevnik izlazaka", opis: "Svaki izlazak s vremenom, vjetrom i opažanjima." },
  { ikona: "meta", naslov: "Evidencija odstrela", opis: "Vrsta, spol, masa, trofej, markica i fotografija." },
  { ikona: "karta", naslov: "Karta lovišta", opis: "Granice, čeke, hranilišta i zona mirisa po vjetru." },
  { ikona: "dozvola", naslov: "Dozvole i kvote", opis: "Rokovi valjanosti i iskorištenost kvota." },
];

export default function Uvod() {
  const [korak, setKorak] = useState(0);
  const [smjer, setSmjer] = useState(1);
  const [ime, setIme] = useState("");
  const [drustvo, setDrustvo] = useState("");
  const [lokacija, setLokacija] = useState<{ lat: number; lng: number } | null>(null);
  const [trazim, setTrazim] = useState(false);
  const [karta, setKarta] = useState(false);

  const idi = (k: number) => {
    setSmjer(k > korak ? 1 : -1);
    setKorak(k);
  };

  const gps = () => {
    if (!navigator.geolocation) return obavijest("Uređaj ne podržava lokaciju", "greska");
    setTrazim(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLokacija({ lat: p.coords.latitude, lng: p.coords.longitude });
        setTrazim(false);
      },
      () => {
        setTrazim(false);
        obavijest("Lokacija nije dostupna", "greska");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const zavrsi = (primjer: boolean) => {
    if (primjer) {
      db.zamijeni(demoBaza(ime.trim()));
      if (lokacija) db.postavke({ lokacija, lokacijaNaziv: "Područje lova" });
      obavijest("Učitani su primjeri podataka");
    } else {
      db.postavke({
        ime: ime.trim() || "Lovac",
        drustvo: drustvo.trim() || undefined,
        ...(lokacija ? { lokacija, lokacijaNaziv: "Područje lova" } : {}),
        dovrsenUvod: true,
      });
      obavijest("Dobrodošli u Lovački dnevnik");
    }
  };

  const varijante = {
    ulaz: (s: number) => ({ x: s * 60, opacity: 0, filter: "blur(4px)" }),
    sredina: { x: 0, opacity: 1, filter: "blur(0px)" },
    izlaz: (s: number) => ({ x: s * -60, opacity: 0, filter: "blur(4px)" }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-[2500] overflow-y-auto bg-pozadina"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Pozadina />
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-10 flex items-center justify-between">
          <motion.div
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
          >
            <Znak velicina={48} />
          </motion.div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ width: i === korak ? 28 : 8, opacity: i <= korak ? 1 : 0.35 }}
                className="h-2 rounded-full bg-naglasak"
              />
            ))}
          </div>
        </div>

        <div className="relative flex-1">
          <AnimatePresence mode="wait" custom={smjer}>
            <motion.div
              key={korak}
              custom={smjer}
              variants={varijante}
              initial="ulaz"
              animate="sredina"
              exit="izlaz"
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {korak === 0 && (
                <div>
                  <p className="mb-3 text-[12px] font-semibold tracking-[0.2em] text-naglasak uppercase">
                    Lovački dnevnik
                  </p>
                  <h1 className="font-display text-[40px] leading-[1.02] font-semibold tracking-tight">
                    Svaki izlazak.
                    <br />
                    <span className="text-tekst-2">Svaki trag.</span>
                  </h1>
                  <p className="mt-4 text-[16px] text-tekst-2">
                    Vodite evidenciju izlazaka, odstrela, lovišta i dozvola na jednom mjestu – uz
                    prognozu vjetra, solunarni kalendar i kartu s točkama u lovištu.
                  </p>
                  <div className="mt-8 grid gap-3">
                    {ZNACAJKE.map((z, i) => (
                      <motion.div
                        key={z.naslov}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center gap-4 rounded-2xl border border-rub bg-povrsina/70 p-4 backdrop-blur"
                      >
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
                          <Ikona ime={z.ikona} velicina={21} />
                        </div>
                        <div>
                          <div className="font-medium">{z.naslov}</div>
                          <div className="text-[13.5px] text-tekst-2">{z.opis}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {korak === 1 && (
                <div>
                  <h2 className="font-display text-[32px] leading-tight font-semibold tracking-tight">
                    Tko lovi?
                  </h2>
                  <p className="mt-2 text-tekst-2">
                    Podaci ostaju samo na vašem uređaju. Možete ih izvesti u bilo kojem trenutku.
                  </p>
                  <div className="mt-8 grid gap-4">
                    <Polje oznaka="Ime i prezime">
                      <input
                        autoFocus
                        className="unos"
                        value={ime}
                        onChange={(e) => setIme(e.target.value)}
                        placeholder="npr. Ivan Horvat"
                      />
                    </Polje>
                    <Polje oznaka="Lovačko društvo" pomoc="Neobavezno">
                      <input
                        className="unos"
                        value={drustvo}
                        onChange={(e) => setDrustvo(e.target.value)}
                        placeholder="npr. LD Fazan"
                      />
                    </Polje>
                  </div>
                </div>
              )}

              {korak === 2 && (
                <div>
                  <h2 className="font-display text-[32px] leading-tight font-semibold tracking-tight">
                    Gdje lovite?
                  </h2>
                  <p className="mt-2 text-tekst-2">
                    Lokacija služi za izračun izlaska i zalaska Sunca, solunarnih razdoblja i prognozu
                    vjetra.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={gps}
                    className={cx(
                      "mt-8 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                      lokacija ? "border-mahovina bg-mahovina-meka" : "border-rub bg-povrsina",
                    )}
                  >
                    <div
                      className={cx(
                        "relative grid size-11 place-items-center rounded-xl",
                        lokacija ? "bg-mahovina text-white" : "bg-naglasak-meki text-naglasak",
                      )}
                    >
                      <Ikona ime={lokacija ? "kvacica" : "gps"} velicina={21} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {lokacija ? "Lokacija postavljena" : trazim ? "Tražim lokaciju…" : "Koristi trenutnu lokaciju"}
                      </div>
                      <div className="text-[13.5px] text-tekst-2 brojke">
                        {lokacija
                          ? `${lokacija.lat.toFixed(4)}°, ${lokacija.lng.toFixed(4)}°`
                          : "Ili preskočite – zadano je središte Hrvatske"}
                      </div>
                    </div>
                  </motion.button>
                  <button
                    onClick={() => setKarta(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rub bg-povrsina p-3.5 text-[14.5px] font-medium text-tekst-2 transition-colors hover:border-naglasak hover:text-tekst"
                  >
                    <Ikona ime="karta" velicina={18} /> Odaberi područje lova na karti
                  </button>
                  <OdabirNaKarti
                    otvoren={karta}
                    pocetak={lokacija ?? undefined}
                    naslov="Gdje najčešće lovite?"
                    potvrdi={setLokacija}
                    zatvori={() => setKarta(false)}
                  />

                  <div className="mt-8 grid gap-3">
                    <button
                      onClick={() => zavrsi(true)}
                      className="group flex items-center gap-4 rounded-2xl border border-rub bg-povrsina p-4 text-left transition-colors hover:border-naglasak"
                    >
                      <div className="grid size-11 place-items-center rounded-xl bg-povrsina-3 text-tekst-2 group-hover:text-naglasak">
                        <Ikona ime="slojevi" velicina={21} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Isprobaj s primjerima</div>
                        <div className="text-[13.5px] text-tekst-2">
                          Učitaj primjer lovišta, izlazaka i odstrela
                        </div>
                      </div>
                      <Ikona ime="desno" className="text-tekst-3" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex gap-3">
          {korak > 0 && (
            <Gumb velicina="lg" vrsta="tihi" onClick={() => idi(korak - 1)}>
              Natrag
            </Gumb>
          )}
          <Gumb
            velicina="lg"
            vrsta="primarni"
            className="flex-1"
            onClick={() => (korak < 2 ? idi(korak + 1) : zavrsi(false))}
          >
            {korak === 0 ? "Započni" : korak === 1 ? "Dalje" : "Kreni s praznim dnevnikom"}
          </Gumb>
        </div>
      </div>
    </motion.div>
  );
}

function Pozadina() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -right-40 size-[520px] rounded-full bg-naglasak opacity-[0.12] blur-[100px]"
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-mahovina opacity-[0.12] blur-[100px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="absolute right-0 bottom-0 left-0 w-full text-povrsina-3 opacity-60" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden>
        <path
          fill="currentColor"
          d="M0 220V150l40-30 30 20 40-60 35 40 45-70 40 55 30-25 50 65 40-45 45 55 35-30 50 50 40-80 45 70 35-20 45 40 40-60 50 60 30-25 45 45 40-70 45 60 35-15 50 30 40-55 45 50 35-20 45 35V220z"
        />
      </svg>
    </div>
  );
}
