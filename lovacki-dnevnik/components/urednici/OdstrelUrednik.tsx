"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DOBNI_RAZREDI, nazivSpola, vrsta as nadiVrstu } from "@/lib/katalog";
import { datumKratki, isoDatum, isoVrijeme } from "@/lib/format";
import { dohvatiFoto, obrisiFoto, smanjiSliku, spremiFoto } from "@/lib/foto";
import { db, noviId } from "@/lib/store";
import type { Baza, Odstrel, Spol } from "@/lib/types";
import Ikona from "../Ikona";
import { Gumb, Ploca, Polje, Segmenti, obavijest, usePotvrda } from "../ui";
import { zatvori } from "./kontroler";
import { OdabirLovista, OdabirVrste, Odjeljak, PodnozjeObrasca, Red, broj, tekst } from "./zajednicko";

export default function OdstrelUrednik({
  baza,
  otvorena,
  id,
  pocetno,
}: {
  baza: Baza;
  otvorena: boolean;
  id?: string;
  pocetno?: Partial<Odstrel>;
}) {
  const postojeci = baza.odstrel.find((o) => o.id === id);
  const zadnji = baza.odstrel[0];
  const p: Partial<Odstrel> = postojeci ?? {
    datum: isoDatum(),
    vrijeme: isoVrijeme(),
    vrsta: "Divlja svinja",
    spol: "m",
    lovisteId: zadnji?.lovisteId ?? baza.lovista[0]?.id,
    oruzje: zadnji?.oruzje,
    kalibar: zadnji?.kalibar,
    ...pocetno,
  };

  const [v, setV] = useState({
    datum: p.datum ?? isoDatum(),
    vrijeme: p.vrijeme ?? isoVrijeme(),
    vrsta: p.vrsta ?? "Divlja svinja",
    spol: (p.spol ?? "m") as Spol,
    dob: p.dob ?? "",
    masa: p.masa?.toString() ?? "",
    trofejCic: p.trofejCic?.toString() ?? "",
    trofejOpis: p.trofejOpis ?? "",
    lovisteId: p.lovisteId,
    izlazakId: p.izlazakId,
    udaljenost: p.udaljenost?.toString() ?? "",
    oruzje: p.oruzje ?? "",
    kalibar: p.kalibar ?? "",
    markica: p.markica ?? "",
    napomena: p.napomena ?? "",
  });
  const [lok, setLok] = useState<{ lat: number; lng: number } | undefined>(
    p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : undefined,
  );
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoPromijenjena, setFotoPromijenjena] = useState(false);
  const [trazim, setTrazim] = useState(false);
  const datoteka = useRef<HTMLInputElement>(null);
  const potvrda = usePotvrda();
  const postaviV = <K extends keyof typeof v>(k: K, x: (typeof v)[K]) => setV((s) => ({ ...s, [k]: x }));

  useEffect(() => {
    if (p.fotoId) dohvatiFoto(p.fotoId).then((f) => f && setFoto(f));
  }, [p.fotoId]);

  const krupna = nadiVrstu(v.vrsta)?.skupina === "krupna";
  const izlasciDana = baza.izlasci.filter((i) => i.datum === v.datum);

  const gps = () => {
    setTrazim(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLok({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setTrazim(false);
      },
      () => {
        setTrazim(false);
        obavijest("Lokacija nije dostupna", "greska");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const odaberiFoto = async (f?: File) => {
    if (!f) return;
    try {
      setFoto(await smanjiSliku(f));
      setFotoPromijenjena(true);
    } catch {
      obavijest("Fotografija se ne može učitati", "greska");
    }
  };

  const spremi = async () => {
    let fotoId = p.fotoId;
    if (fotoPromijenjena) {
      if (fotoId) await obrisiFoto(fotoId).catch(() => {});
      fotoId = undefined;
      if (foto) {
        fotoId = noviId();
        try {
          await spremiFoto(fotoId, foto);
        } catch {
          fotoId = undefined;
          obavijest("Fotografija nije spremljena", "greska");
        }
      }
    }
    const podaci = {
      datum: v.datum,
      vrijeme: v.vrijeme,
      vrsta: v.vrsta,
      spol: v.spol,
      dob: tekst(v.dob),
      masa: broj(v.masa),
      trofejCic: broj(v.trofejCic),
      trofejOpis: tekst(v.trofejOpis),
      lovisteId: v.lovisteId,
      izlazakId: v.izlazakId,
      udaljenost: broj(v.udaljenost),
      oruzje: tekst(v.oruzje),
      kalibar: tekst(v.kalibar),
      markica: tekst(v.markica),
      napomena: tekst(v.napomena),
      lat: lok?.lat,
      lng: lok?.lng,
      fotoId,
    };
    if (postojeci) {
      db.uredi("odstrel", postojeci.id, podaci);
      obavijest("Odstrel je ažuriran");
    } else {
      db.dodaj("odstrel", podaci);
      obavijest(`Lovu blagoslov! ${v.vrsta} je upisan.`);
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj("Obrisati odstrel?", "Zapis o odstrelu bit će trajno uklonjen iz evidencije.", () => {
      db.obrisi("odstrel", postojeci!.id);
      zatvori();
      obavijest("Odstrel je obrisan", "info", {
        oznaka: "Poništi",
        radnja: () => db.vrati("odstrel", postojeci!),
      });
    });

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={postojeci ? "Uredi odstrel" : "Upiši odstrel"}
        podnaslov="Evidencija odstrijeljene divljači"
        podnozje={
          <PodnozjeObrasca onSpremi={spremi} onOdustani={zatvori} onObrisi={postojeci ? obrisi : undefined} />
        }
      >
        <Odjeljak naslov="Divljač">
          <Polje oznaka="Vrsta">
            <OdabirVrste vrijednost={v.vrsta} promjena={(x) => postaviV("vrsta", x)} />
          </Polje>
          <Polje oznaka="Spol">
            <Segmenti
              vrijednost={v.spol}
              promjena={(x) => postaviV("spol", x)}
              opcije={(["m", "z", "n"] as Spol[]).map((s) => ({
                vrijednost: s,
                oznaka: nazivSpola(v.vrsta, s).replace(/^./, (c) => c.toUpperCase()),
              }))}
            />
          </Polje>
          <Red>
            <Polje oznaka="Dob">
              <select className="unos" value={v.dob} onChange={(e) => postaviV("dob", e.target.value)}>
                <option value="">–</option>
                {DOBNI_RAZREDI.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Polje>
            <Polje oznaka="Masa (kg)">
              <input inputMode="decimal" className="unos brojke" value={v.masa} onChange={(e) => postaviV("masa", e.target.value)} placeholder="u kožu / perju" />
            </Polje>
          </Red>
          <AnimatePresence initial={false}>
            {krupna && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Red>
                  <Polje oznaka="Trofej (CIC točke)">
                    <input inputMode="decimal" className="unos brojke" value={v.trofejCic} onChange={(e) => postaviV("trofejCic", e.target.value)} />
                  </Polje>
                  <Polje oznaka="Opis trofeja">
                    <input className="unos" value={v.trofejOpis} onChange={(e) => postaviV("trofejOpis", e.target.value)} placeholder="npr. šesterac" />
                  </Polje>
                </Red>
              </motion.div>
            )}
          </AnimatePresence>
          <Polje oznaka="Broj markice / evidencijski broj">
            <input className="unos brojke uppercase" value={v.markica} onChange={(e) => postaviV("markica", e.target.value)} placeholder="npr. HR-DS-001234" />
          </Polje>
        </Odjeljak>

        <Odjeljak naslov="Kada i gdje">
          <Red>
            <Polje oznaka="Datum">
              <input type="date" className="unos" value={v.datum} onChange={(e) => postaviV("datum", e.target.value)} />
            </Polje>
            <Polje oznaka="Vrijeme">
              <input type="time" className="unos" value={v.vrijeme} onChange={(e) => postaviV("vrijeme", e.target.value)} />
            </Polje>
          </Red>
          <Red>
            <Polje oznaka="Lovište">
              <OdabirLovista baza={baza} vrijednost={v.lovisteId} promjena={(x) => postaviV("lovisteId", x)} />
            </Polje>
            <Polje oznaka="Izlazak">
              <select className="unos" value={v.izlazakId ?? ""} onChange={(e) => postaviV("izlazakId", e.target.value || undefined)}>
                <option value="">— Bez povezivanja —</option>
                {izlasciDana.map((i) => (
                  <option key={i.id} value={i.id}>
                    {datumKratki(i.datum)} · {i.od}
                    {i.do ? `–${i.do}` : ""}
                  </option>
                ))}
              </select>
            </Polje>
          </Red>
          <div className="flex items-center gap-3 rounded-2xl border border-rub bg-povrsina-2 p-3">
            <div className="grid size-10 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
              <Ikona ime="lokacija" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Mjesto odstrela</div>
              <div className="brojke truncate text-[12.5px] text-tekst-2">
                {lok ? `${lok.lat.toFixed(5)}°, ${lok.lng.toFixed(5)}°` : "Nije zabilježeno"}
              </div>
            </div>
            {lok && (
              <button className="p-2 text-tekst-3 hover:text-opasnost" onClick={() => setLok(undefined)} aria-label="Ukloni lokaciju">
                <Ikona ime="x" velicina={16} />
              </button>
            )}
            <Gumb velicina="sm" ikona="gps" onClick={gps} disabled={trazim}>
              {trazim ? "…" : "GPS"}
            </Gumb>
          </div>
        </Odjeljak>

        <Odjeljak naslov="Hitac">
          <Red stupci={3}>
            <Polje oznaka="Oružje">
              <input className="unos" value={v.oruzje} onChange={(e) => postaviV("oruzje", e.target.value)} />
            </Polje>
            <Polje oznaka="Kalibar">
              <input className="unos" value={v.kalibar} onChange={(e) => postaviV("kalibar", e.target.value)} />
            </Polje>
            <Polje oznaka="Udalj. (m)">
              <input inputMode="numeric" className="unos brojke" value={v.udaljenost} onChange={(e) => postaviV("udaljenost", e.target.value)} />
            </Polje>
          </Red>
        </Odjeljak>

        <Odjeljak naslov="Fotografija i bilješka">
          <input ref={datoteka} type="file" accept="image/*" hidden onChange={(e) => odaberiFoto(e.target.files?.[0])} />
          <AnimatePresence mode="wait">
            {foto ? (
              <motion.div
                key="foto"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="group relative overflow-hidden rounded-2xl border border-rub"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="Fotografija odstrela" className="max-h-72 w-full object-cover" />
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <Gumb velicina="sm" ikona="kamera" onClick={() => datoteka.current?.click()} className="bg-black/60 text-white backdrop-blur border-white/10">
                    Zamijeni
                  </Gumb>
                  <Gumb
                    velicina="sm"
                    vrsta="opasni"
                    ikona="smece"
                    onClick={() => {
                      setFoto(null);
                      setFotoPromijenjena(true);
                    }}
                    className="backdrop-blur"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="prazno"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => datoteka.current?.click()}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rub-jaki text-tekst-3 transition-colors hover:border-naglasak hover:text-naglasak"
              >
                <Ikona ime="kamera" velicina={26} />
                <span className="text-sm">Dodaj fotografiju</span>
              </motion.button>
            )}
          </AnimatePresence>
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-20" value={v.napomena} onChange={(e) => postaviV("napomena", e.target.value)} placeholder="Pogodak, reakcija, potraga…" />
          </Polje>
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}
