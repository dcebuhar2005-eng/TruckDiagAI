"use client";

import { useEffect, useState } from "react";
import { preciznaLokacija } from "@/lib/gps";
import { isoDatum, isoVrijeme } from "@/lib/format";
import { dohvatiFoto, obrisiFoto, spremiFoto } from "@/lib/foto";
import { centarLovista } from "@/lib/upiti";
import { db, noviId } from "@/lib/store";
import { UZROCI } from "@/lib/stradanja";
import type { Baza, Stradanje, UzrokStradanja } from "@/lib/types";
import Fotografije, { type Slika } from "./Fotografije";
import PoljeLokacije from "../lokacija/PoljeLokacije";
import { slavi } from "../Slavlje";
import { Ploca, Polje, cx, obavijest, usePotvrda } from "../ui";
import { zatvori } from "./kontroler";
import { OdabirLovista, OdabirVrste, Odjeljak, PodnozjeObrasca, Red, tekst } from "./zajednicko";

/** Brzi upis stradale divljači: GPS, datum i sat se popune sami – dovoljno je odabrati vrstu. */
export default function StradanjeUrednik({ baza, otvorena, id }: { baza: Baza; otvorena: boolean; id?: string }) {
  const postojeci = (baza.stradanja ?? []).find((s) => s.id === id);
  const zadnji = (baza.stradanja ?? [])[0];
  const p: Partial<Stradanje> = postojeci ?? {
    datum: isoDatum(),
    vrijeme: isoVrijeme(),
    vrsta: zadnji?.vrsta ?? "Srna obična",
    uzrok: "promet",
    lovisteId: zadnji?.lovisteId ?? baza.lovista[0]?.id,
  };

  const [v, setV] = useState({
    datum: p.datum ?? isoDatum(),
    vrijeme: p.vrijeme ?? isoVrijeme(),
    vrsta: p.vrsta ?? "Srna obična",
    uzrok: (p.uzrok ?? "promet") as UzrokStradanja,
    lovisteId: p.lovisteId,
    napomena: p.napomena ?? "",
  });
  const postaviV = <K extends keyof typeof v>(k: K, x: (typeof v)[K]) => setV((s) => ({ ...s, [k]: x }));
  const [lok, setLok] = useState<{ lat: number; lng: number } | undefined>(
    p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : undefined,
  );
  const [lokGps, setLokGps] = useState(false);

  // Novi zapis: lovac stoji kraj divljači – mjesto se uvijek uzme s GPS-a (može se ispraviti).
  useEffect(() => {
    if (postojeci || !navigator.geolocation) return;
    preciznaLokacija({ cilj: 15 })
      .then((f) => {
        setLok((s) => s ?? { lat: f.lat, lng: f.lng });
        setLokGps(true);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pocetneFoto = p.fotoIds ?? [];
  const [slike, setSlike] = useState<Slika[]>([]);
  const [slikeUcitane, setSlikeUcitane] = useState(pocetneFoto.length === 0);
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
  const potvrda = usePotvrda();

  const spremi = async () => {
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
      datum: v.datum,
      vrijeme: v.vrijeme,
      vrsta: v.vrsta,
      uzrok: v.uzrok,
      lovisteId: v.lovisteId,
      lat: lok?.lat,
      lng: lok?.lng,
      fotoIds: fotoIds.length ? fotoIds : undefined,
      napomena: tekst(v.napomena),
    };
    if (postojeci) {
      db.uredi("stradanja", postojeci.id, podaci);
      obavijest("Zapis je ažuriran");
    } else {
      db.dodaj("stradanja", podaci);
      obavijest(`Zapisano: stradala divljač – ${v.vrsta}`);
      slavi("spremljeno");
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj("Obrisati zapis?", "Zapis o stradaloj divljači bit će uklonjen.", () => {
      db.obrisi("stradanja", postojeci!.id);
      zatvori();
      obavijest("Zapis je obrisan", "info", { oznaka: "Poništi", radnja: () => db.vrati("stradanja", postojeci!) });
    });

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={postojeci ? "Stradala divljač" : "🚗 Stradala divljač"}
        podnaslov="Divljač stradala u prometu, pod vlakom, strojem…"
        podnozje={<PodnozjeObrasca onSpremi={spremi} onOdustani={zatvori} onObrisi={postojeci ? obrisi : undefined} />}
      >
        <Odjeljak naslov="Što je stradalo">
          <Polje oznaka="Vrsta">
            <OdabirVrste vrijednost={v.vrsta} promjena={(x) => postaviV("vrsta", x)} />
          </Polje>
          <Polje oznaka="Uzrok">
            <div className="flex flex-wrap gap-2">
              {UZROCI.map((u) => (
                <button
                  key={u.k}
                  type="button"
                  onClick={() => postaviV("uzrok", u.k)}
                  className={cx(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13.5px] transition-colors",
                    v.uzrok === u.k ? "border-naglasak bg-naglasak-meki font-semibold text-tekst" : "border-rub text-tekst-2 hover:border-naglasak",
                  )}
                >
                  <span>{u.ikona}</span>
                  {u.naziv}
                </button>
              ))}
            </div>
          </Polje>
        </Odjeljak>

        <Odjeljak naslov="Kada i gdje">
          <PoljeLokacije
            naslov={lokGps ? "Mjesto · s GPS-a, provjerite" : "Mjesto"}
            naslovKarte="Gdje je divljač stradala?"
            prazno="Traži se GPS…"
            vrijednost={lok}
            sredina={centarLovista(baza, v.lovisteId)}
            promjena={(x) => {
              setLok(x);
              setLokGps(false);
            }}
          />
          <Red>
            <Polje oznaka="Datum">
              <input type="date" className="unos" value={v.datum} onChange={(e) => postaviV("datum", e.target.value)} />
            </Polje>
            <Polje oznaka="Vrijeme">
              <input type="time" className="unos" value={v.vrijeme} onChange={(e) => postaviV("vrijeme", e.target.value)} />
            </Polje>
          </Red>
          {baza.lovista.length > 0 && (
            <Polje oznaka="Lovište">
              <OdabirLovista baza={baza} vrijednost={v.lovisteId} promjena={(x) => postaviV("lovisteId", x)} />
            </Polje>
          )}
        </Odjeljak>

        <Odjeljak naslov="Fotografije i bilješka (neobavezno)">
          <Fotografije slike={slike} promjena={setSlike} />
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-20" value={v.napomena} onChange={(e) => postaviV("napomena", e.target.value)} placeholder="npr. D3 kod Delnica, srna s lanetom…" />
          </Polje>
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}
