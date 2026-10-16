"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DOBNI_RAZREDI, nazivSpola, vrsta as nadiVrstu } from "@/lib/katalog";
import { datumKratki, isoDatum, isoVrijeme, udaljenostM } from "@/lib/format";
import { dohvatiFoto, fotografijeOdstrela, obrisiFoto, spremiFoto } from "@/lib/foto";
import Fotografije, { type Slika } from "./Fotografije";
import PoljeLokacije from "../lokacija/PoljeLokacije";
import { centarLovista } from "@/lib/upiti";
import { db, noviId } from "@/lib/store";
import type { Baza, Odstrel, Spol } from "@/lib/types";
import { Ploca, Polje, Segmenti, obavijest, usePotvrda } from "../ui";
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
  const [lokGps, setLokGps] = useState(false);

  // Novi odstrel: mjesto se samo popuni s GPS-a ako ste u lovu ili u lovištu (do 5 km) – kod kuće ne.
  useEffect(() => {
    if (postojeci || (p.lat != null && p.lng != null) || !navigator.geolocation) return;
    const uLovu = baza.izlasci.some((i) => i.uTijeku);
    const l = baza.lovista.find((x) => x.id === p.lovisteId);
    const imaLoviste = !!l?.granica?.length || baza.tocke.some((t) => t.lovisteId === p.lovisteId);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const t = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!uLovu && !(imaLoviste && udaljenostM(t, centarLovista(baza, p.lovisteId)) < 5000)) return;
        setLok((s) => s ?? t);
        setLokGps(true);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pocetneFoto = fotografijeOdstrela(p);
  const [slike, setSlike] = useState<Slika[]>([]);
  const [slikeUcitane, setSlikeUcitane] = useState(pocetneFoto.length === 0);
  const potvrda = usePotvrda();
  const postaviV = <K extends keyof typeof v>(k: K, x: (typeof v)[K]) => setV((s) => ({ ...s, [k]: x }));

  const kljucFoto = pocetneFoto.join(",");
  useEffect(() => {
    if (!kljucFoto) return;
    let ziv = true;
    Promise.all(kljucFoto.split(",").map(async (id) => ({ id, url: await dohvatiFoto(id) }))).then((r) => {
      if (!ziv) return;
      setSlike(r.flatMap((x) => (x.url ? [{ id: x.id, url: x.url }] : [])));
      setSlikeUcitane(true);
    });
    return () => {
      ziv = false;
    };
  }, [kljucFoto]);

  const krupna = nadiVrstu(v.vrsta)?.skupina === "krupna";
  const izlasciDana = baza.izlasci.filter((i) => i.datum === v.datum);

  const spremi = async () => {
    // Obriši uklonjene, spremi nove fotografije; redoslijed određuje naslovnu.
    let fotoIds: string[] = pocetneFoto;
    if (slikeUcitane) {
      const zadrzane = new Set(slike.filter((x) => x.id).map((x) => x.id!));
      await Promise.all(pocetneFoto.filter((id) => !zadrzane.has(id)).map((id) => obrisiFoto(id).catch(() => {})));
      fotoIds = [];
      for (const sl of slike) {
        if (sl.id) {
          fotoIds.push(sl.id);
          continue;
        }
        const id = noviId();
        try {
          await spremiFoto(id, sl.url);
          fotoIds.push(id);
        } catch {
          obavijest("Neka fotografija nije spremljena", "greska");
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
      fotoId: undefined,
      fotoIds,
    };
    if (postojeci) {
      db.uredi("odstrel", postojeci.id, podaci);
      obavijest("Odstrel je ažuriran");
    } else {
      db.dodaj("odstrel", podaci);
      obavijest(`Dobra kob! ${v.vrsta} je upisan.`);
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
        <Odjeljak naslov="Fotografije">
          <Fotografije slike={slike} promjena={setSlike} />
        </Odjeljak>

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
          <PoljeLokacije
            naslov={lokGps ? "Mjesto odstrela · s GPS-a, provjerite" : "Mjesto odstrela"}
            naslovKarte="Gdje je divljač odstrijeljena?"
            prazno="Nije zabilježeno"
            vrijednost={lok}
            sredina={centarLovista(baza, v.lovisteId)}
            promjena={(x) => {
              setLok(x);
              setLokGps(false);
            }}
          />
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

        <Odjeljak naslov="Bilješka">
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-20" value={v.napomena} onChange={(e) => postaviV("napomena", e.target.value)} placeholder="Pogodak, reakcija, potraga…" />
          </Polje>
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}
