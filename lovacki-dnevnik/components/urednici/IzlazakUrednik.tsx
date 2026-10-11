"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { dohvatiFoto, obrisiFoto, spremiFoto } from "@/lib/foto";
import { duljinaTraga } from "@/lib/lov";
import Fotografije, { type Slika } from "./Fotografije";
import { NACINI_LOVA } from "@/lib/katalog";
import { isoDatum, isoVrijeme } from "@/lib/format";
import { db, noviId } from "@/lib/store";
import type { Baza, Izlazak, Opazanje, Tocka2D, VrstaLova, Vrijeme } from "@/lib/types";
import { centarLovista } from "@/lib/upiti";
import { dohvatiPrognozu, opisVremena, smjerVjetra } from "@/lib/vrijeme";
import Ikona from "../Ikona";
import PoljeLokacije from "../lokacija/PoljeLokacije";
import { Cipovi, Gumb, Ploca, Polje, obavijest, usePotvrda } from "../ui";
import { zatvori } from "./kontroler";
import {
  Koracnik,
  OdabirLovista,
  OdabirVrste,
  Odjeljak,
  PodnozjeObrasca,
  Red,
  Zvjezdice,
  broj,
  tekst,
} from "./zajednicko";

const SMJEROVI = Array.from({ length: 16 }, (_, i) => i * 22.5);

export default function IzlazakUrednik({
  baza,
  otvorena,
  id,
  pocetno,
}: {
  baza: Baza;
  otvorena: boolean;
  id?: string;
  pocetno?: Partial<Izlazak>;
}) {
  const postojeci = baza.izlasci.find((i) => i.id === id);
  const zadnji = baza.izlasci[0];
  const p: Partial<Izlazak> = postojeci ?? {
    datum: isoDatum(),
    od: isoVrijeme(),
    nacin: "cekanje",
    lovisteId: zadnji?.lovisteId ?? baza.lovista[0]?.id,
    opazanja: [],
    ...pocetno,
  };

  const [datum, setDatum] = useState(p.datum ?? isoDatum());
  const [od, setOd] = useState(p.od ?? "");
  const [doV, setDo] = useState(p.do ?? "");
  const [lovisteId, setLoviste] = useState(p.lovisteId);
  const [tockaId, setTocka] = useState(p.tockaId);
  const [lok, setLok] = useState<Tocka2D | undefined>(p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : undefined);
  const [nacin, setNacin] = useState<VrstaLova>(p.nacin ?? "cekanje");
  const [vrijeme, setVrijeme] = useState<Vrijeme>(p.vrijeme ?? {});
  const [opazanja, setOpazanja] = useState<Opazanje[]>(p.opazanja ?? []);
  const [pratitelji, setPratitelji] = useState(p.pratitelji ?? "");
  const [ocjena, setOcjena] = useState(p.ocjena ?? 0);
  const [napomena, setNapomena] = useState(p.napomena ?? "");
  const [ucitavam, setUcitavam] = useState(false);
  const potvrda = usePotvrda();
  const pocetneFoto = p.fotoIds ?? [];
  const [slike, setSlike] = useState<Slika[]>([]);
  const [slikeUcitane, setSlikeUcitane] = useState(pocetneFoto.length === 0);
  const kljucFoto = pocetneFoto.join(",");
  useEffect(() => {
    if (!kljucFoto) return;
    let ziv = true;
    Promise.all(kljucFoto.split(",").map(async (fid) => ({ id: fid, url: await dohvatiFoto(fid) }))).then((r) => {
      if (!ziv) return;
      setSlike(r.flatMap((x) => (x.url ? [{ id: x.id, url: x.url }] : [])));
      setSlikeUcitane(true);
    });
    return () => {
      ziv = false;
    };
  }, [kljucFoto]);

  const tocke = baza.tocke.filter((t) => !lovisteId || t.lovisteId === lovisteId);

  const preuzmiVrijeme = async () => {
    setUcitavam(true);
    try {
      const t = baza.tocke.find((x) => x.id === tockaId);
      const loc = t ?? lok ?? centarLovista(baza, lovisteId);
      const pr = await dohvatiPrognozu(loc.lat, loc.lng);
      setVrijeme(pr.trenutno);
      obavijest(`${opisVremena(pr.trenutno.kod)}, ${Math.round(pr.trenutno.temperatura ?? 0)} °C`, "info");
    } catch {
      obavijest("Vrijeme trenutno nije dostupno", "greska");
    } finally {
      setUcitavam(false);
    }
  };

  const spremi = async () => {
    let fotoIds: string[] = pocetneFoto;
    if (slikeUcitane) {
      const zadrzane = new Set(slike.filter((x) => x.id).map((x) => x.id!));
      await Promise.all(pocetneFoto.filter((fid) => !zadrzane.has(fid)).map((fid) => obrisiFoto(fid).catch(() => {})));
      fotoIds = [];
      for (const sl of slike) {
        if (sl.id) {
          fotoIds.push(sl.id);
          continue;
        }
        const fid = noviId();
        try {
          await spremiFoto(fid, sl.url);
          fotoIds.push(fid);
        } catch {
          obavijest("Neka fotografija nije spremljena", "greska");
        }
      }
    }
    const podaci = {
      fotoIds: fotoIds.length ? fotoIds : undefined,
      datum,
      od,
      do: tekst(doV),
      lovisteId,
      tockaId,
      lat: tockaId ? undefined : lok?.lat,
      lng: tockaId ? undefined : lok?.lng,
      nacin,
      vrijeme: Object.values(vrijeme).some((v) => v != null) ? vrijeme : undefined,
      opazanja: opazanja.filter((o) => o.broj > 0),
      pratitelji: tekst(pratitelji),
      ocjena: ocjena || undefined,
      napomena: tekst(napomena),
    };
    if (postojeci) {
      db.uredi("izlasci", postojeci.id, podaci);
      obavijest("Izlazak je ažuriran");
    } else {
      db.dodaj("izlasci", podaci);
      obavijest("Izlazak je zabilježen");
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj("Obrisati izlazak?", "Izlazak će biti trajno uklonjen. Odstrel povezan s njim ostaje sačuvan.", () => {
      db.obrisi("izlasci", postojeci!.id);
      zatvori();
      obavijest("Izlazak je obrisan", "info", {
        oznaka: "Poništi",
        radnja: () => db.vrati("izlasci", postojeci!),
      });
    });

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={postojeci?.uTijeku ? "Lov u tijeku" : postojeci ? "Uredi izlazak" : "Novi izlazak"}
        podnaslov={
          postojeci?.trag && postojeci.trag.length > 1
            ? `Snimljen trag: ${(duljinaTraga(postojeci.trag) / 1000).toFixed(1)} km`
            : "Zabilježite uvjete i opažanja"
        }
        podnozje={
          <PodnozjeObrasca
            onSpremi={spremi}
            onOdustani={zatvori}
            onObrisi={postojeci ? obrisi : undefined}
            onemoguceno={!datum || !od}
          />
        }
      >
        <Odjeljak naslov="Kada i gdje">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Polje oznaka="Datum" className="col-span-2 sm:col-span-1">
              <input type="date" className="unos" value={datum} onChange={(e) => setDatum(e.target.value)} />
            </Polje>
            <Polje oznaka="Od">
              <input type="time" className="unos" value={od} onChange={(e) => setOd(e.target.value)} />
            </Polje>
            <Polje oznaka="Do">
              <input type="time" className="unos" value={doV} onChange={(e) => setDo(e.target.value)} />
            </Polje>
          </div>
          <Red>
            <Polje oznaka="Lovište">
              <OdabirLovista
                baza={baza}
                vrijednost={lovisteId}
                promjena={(v) => {
                  setLoviste(v);
                  setTocka(undefined);
                }}
              />
            </Polje>
            <Polje oznaka="Čeka / točka">
              <select className="unos" value={tockaId ?? ""} onChange={(e) => setTocka(e.target.value || undefined)}>
                <option value="">— Nije odabrano —</option>
                {tocke.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.naziv}
                  </option>
                ))}
              </select>
            </Polje>
          </Red>
          {!tockaId && (
            <PoljeLokacije
              naslov="Mjesto izlaska"
              naslovKarte="Gdje ste bili u lovu?"
              prazno="Neobavezno – koristi se središte lovišta"
              vrijednost={lok}
              sredina={centarLovista(baza, lovisteId)}
              promjena={setLok}
            />
          )}
          <Polje oznaka="Način lova">
            <Cipovi
              opcije={Object.entries(NACINI_LOVA).map(([v, o]) => ({ vrijednost: v, oznaka: o }))}
              odabrano={nacin}
              promjena={(v) => setNacin(v as VrstaLova)}
            />
          </Polje>
        </Odjeljak>

        <Odjeljak
          naslov="Vrijeme"
          desno={
            <Gumb velicina="sm" vrsta="tihi" ikona="oblak" onClick={preuzmiVrijeme} disabled={ucitavam}>
              {ucitavam ? "Dohvaćam…" : "Preuzmi trenutno"}
            </Gumb>
          }
        >
          <Red stupci={3}>
            <Polje oznaka="Temp. °C">
              <input
                inputMode="decimal"
                className="unos brojke"
                value={vrijeme.temperatura ?? ""}
                onChange={(e) => setVrijeme({ ...vrijeme, temperatura: broj(e.target.value) })}
              />
            </Polje>
            <Polje oznaka="Vjetar iz">
              <select
                className="unos"
                value={vrijeme.vjetarSmjer != null ? Math.round(vrijeme.vjetarSmjer / 22.5) * 22.5 % 360 : ""}
                onChange={(e) => setVrijeme({ ...vrijeme, vjetarSmjer: broj(e.target.value) })}
              >
                <option value="">–</option>
                {SMJEROVI.map((s) => (
                  <option key={s} value={s}>
                    {smjerVjetra(s)}
                  </option>
                ))}
              </select>
            </Polje>
            <Polje oznaka="km/h">
              <input
                inputMode="decimal"
                className="unos brojke"
                value={vrijeme.vjetarBrzina ?? ""}
                onChange={(e) => setVrijeme({ ...vrijeme, vjetarBrzina: broj(e.target.value) })}
              />
            </Polje>
          </Red>
          <AnimatePresence>
            {vrijeme.tlak != null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-x-5 gap-y-1 overflow-hidden text-[13px] text-tekst-2"
              >
                <span>{opisVremena(vrijeme.kod)}</span>
                <span className="brojke">Tlak {Math.round(vrijeme.tlak)} hPa</span>
                {vrijeme.vlaga != null && <span className="brojke">Vlaga {vrijeme.vlaga} %</span>}
                {vrijeme.oblacnost != null && <span className="brojke">Naoblaka {vrijeme.oblacnost} %</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </Odjeljak>

        <Odjeljak
          naslov="Opažena divljač"
          desno={
            <Gumb
              velicina="sm"
              vrsta="tihi"
              ikona="plus"
              onClick={() => setOpazanja([...opazanja, { vrsta: "Srna obična", broj: 1 }])}
            >
              Dodaj
            </Gumb>
          }
        >
          <AnimatePresence initial={false}>
            {opazanja.map((o, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                className="flex items-center gap-2"
              >
                <OdabirVrste
                  className="flex-1"
                  vrijednost={o.vrsta}
                  promjena={(v) => setOpazanja(opazanja.map((x, j) => (j === i ? { ...x, vrsta: v } : x)))}
                />
                <Koracnik
                  vrijednost={o.broj}
                  min={1}
                  promjena={(v) => setOpazanja(opazanja.map((x, j) => (j === i ? { ...x, broj: v } : x)))}
                />
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl text-tekst-3 hover:bg-opasnost-meka hover:text-opasnost"
                  onClick={() => setOpazanja(opazanja.filter((_, j) => j !== i))}
                  aria-label="Ukloni"
                >
                  <Ikona ime="x" velicina={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!opazanja.length && <p className="text-sm text-tekst-3">Još nema opažanja.</p>}
        </Odjeljak>

        <Odjeljak naslov="Fotografije">
          <Fotografije slike={slike} promjena={setSlike} />
        </Odjeljak>

        <Odjeljak naslov="Bilješke">
          <Polje oznaka="Pratitelji">
            <input className="unos" value={pratitelji} onChange={(e) => setPratitelji(e.target.value)} placeholder="Tko je bio s vama?" />
          </Polje>
          <Polje oznaka="Ocjena izlaska">
            <Zvjezdice vrijednost={ocjena} promjena={setOcjena} />
          </Polje>
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-24" value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="Tragovi, ponašanje divljači, uvjeti…" />
          </Polje>
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}
