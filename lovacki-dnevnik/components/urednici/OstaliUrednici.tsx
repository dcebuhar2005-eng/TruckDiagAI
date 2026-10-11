"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BOJE_LOVISTA, TIPOVI_DOZVOLA, TIPOVI_TOCAKA } from "@/lib/katalog";
import { povrsinaHa } from "@/lib/format";
import { db } from "@/lib/store";
import type { Baza, Kvota, Loviste, Spol, Tocka, Tocka2D, TipDozvole, TipTocke } from "@/lib/types";
import { centarLovista } from "@/lib/upiti";
import Ikona from "../Ikona";
import PoljeLokacije from "../lokacija/PoljeLokacije";
import { Cipovi, Gumb, Ploca, Polje, cx, obavijest, usePotvrda } from "../ui";
import { zatvori } from "./kontroler";
import OdabirVjetrova from "./OdabirVjetrova";
import { Koracnik, OdabirLovista, OdabirVrste, Odjeljak, PodnozjeObrasca, Red, broj, tekst } from "./zajednicko";

const ZUPANIJE = [
  "Zagrebačka", "Krapinsko-zagorska", "Sisačko-moslavačka", "Karlovačka", "Varaždinska",
  "Koprivničko-križevačka", "Bjelovarsko-bilogorska", "Primorsko-goranska", "Ličko-senjska",
  "Virovitičko-podravska", "Požeško-slavonska", "Brodsko-posavska", "Zadarska",
  "Osječko-baranjska", "Šibensko-kninska", "Vukovarsko-srijemska", "Splitsko-dalmatinska",
  "Istarska", "Dubrovačko-neretvanska", "Međimurska", "Grad Zagreb",
];

/* ---------------- Lovište ---------------- */

export function LovisteUrednik({ baza, otvorena, id }: { baza: Baza; otvorena: boolean; id?: string }) {
  const p = baza.lovista.find((l) => l.id === id);
  const [v, setV] = useState({
    naziv: p?.naziv ?? "",
    broj: p?.broj ?? "",
    ovlastenik: p?.ovlastenik ?? "",
    zupanija: p?.zupanija ?? "",
    tip: p?.tip ?? "otvoreno",
    povrsinaHa: p?.povrsinaHa?.toString() ?? "",
    boja: p?.boja ?? BOJE_LOVISTA[baza.lovista.length % BOJE_LOVISTA.length],
    napomena: p?.napomena ?? "",
  });
  const potvrda = usePotvrda();
  const izracunata = p?.granica ? povrsinaHa(p.granica) : 0;
  const postavi = <K extends keyof typeof v>(k: K, x: (typeof v)[K]) => setV((s) => ({ ...s, [k]: x }));

  const spremi = () => {
    const podaci = {
      naziv: v.naziv.trim(),
      broj: tekst(v.broj),
      ovlastenik: tekst(v.ovlastenik),
      zupanija: tekst(v.zupanija),
      tip: v.tip as Loviste["tip"],
      povrsinaHa: broj(v.povrsinaHa),
      boja: v.boja,
      napomena: tekst(v.napomena),
    };
    if (p) {
      db.uredi("lovista", p.id, podaci);
      obavijest("Lovište je ažurirano");
    } else {
      db.dodaj("lovista", podaci);
      obavijest("Lovište je dodano");
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj(
      "Obrisati lovište?",
      "Lovište i njegova granica bit će uklonjeni. Izlasci, odstrel i točke ostaju, ali bez poveznice na lovište.",
      () => {
        db.obrisi("lovista", p!.id);
        zatvori();
        obavijest("Lovište je obrisano", "info", { oznaka: "Poništi", radnja: () => db.vrati("lovista", p!) });
      },
    );

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={p ? "Uredi lovište" : "Novo lovište"}
        podnaslov="Osnovni podaci o lovištu"
        podnozje={<PodnozjeObrasca onSpremi={spremi} onOdustani={zatvori} onObrisi={p ? obrisi : undefined} onemoguceno={!v.naziv.trim()} />}
      >
        <Odjeljak naslov="Lovište">
          <Polje oznaka="Naziv">
            <input autoFocus={!p} className="unos" value={v.naziv} onChange={(e) => postavi("naziv", e.target.value)} placeholder="npr. Bukovac" />
          </Polje>
          <Red>
            <Polje oznaka="Broj lovišta">
              <input className="unos" value={v.broj} onChange={(e) => postavi("broj", e.target.value)} placeholder="npr. VII/118" />
            </Polje>
            <Polje oznaka="Vrsta">
              <select className="unos" value={v.tip} onChange={(e) => postavi("tip", e.target.value as typeof v.tip)}>
                <option value="otvoreno">Otvoreno</option>
                <option value="zajedničko">Zajedničko</option>
                <option value="državno">Državno</option>
                <option value="ograđeno">Ograđeno</option>
              </select>
            </Polje>
          </Red>
          <Polje oznaka="Lovoovlaštenik">
            <input className="unos" value={v.ovlastenik} onChange={(e) => postavi("ovlastenik", e.target.value)} placeholder="Lovačko društvo / tvrtka" />
          </Polje>
          <Red>
            <Polje oznaka="Županija">
              <select className="unos" value={v.zupanija} onChange={(e) => postavi("zupanija", e.target.value)}>
                <option value="">–</option>
                {ZUPANIJE.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </Polje>
            <Polje oznaka="Površina (ha)" pomoc={izracunata ? `S karte: ${Math.round(izracunata).toLocaleString("hr-HR")} ha` : undefined}>
              <input inputMode="decimal" className="unos brojke" value={v.povrsinaHa} onChange={(e) => postavi("povrsinaHa", e.target.value)} />
            </Polje>
          </Red>
          <Polje oznaka="Boja na karti">
            <div className="flex gap-2.5">
              {BOJE_LOVISTA.map((b) => (
                <motion.button
                  key={b}
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => postavi("boja", b)}
                  className={cx("relative size-9 rounded-full ring-offset-2 ring-offset-povrsina transition-shadow", v.boja === b && "ring-2 ring-tekst")}
                  style={{ background: b }}
                  aria-label={b}
                >
                  {v.boja === b && (
                    <motion.span layoutId="boja-odabir" className="absolute inset-0 grid place-items-center text-black/70">
                      <Ikona ime="kvacica" velicina={16} debljina={3} />
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </Polje>
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-20" value={v.napomena} onChange={(e) => postavi("napomena", e.target.value)} />
          </Polje>
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}

/* ---------------- Dozvola ---------------- */

export function DozvolaUrednik({ baza, otvorena, id }: { baza: Baza; otvorena: boolean; id?: string }) {
  const p = baza.dozvole.find((d) => d.id === id);
  const [tip, setTip] = useState<TipDozvole>(p?.tip ?? "dozvola-za-lov");
  const [naziv, setNaziv] = useState(p?.naziv ?? "");
  const [brojD, setBroj] = useState(p?.broj ?? "");
  const [izdavatelj, setIzdavatelj] = useState(p?.izdavatelj ?? "");
  const [od, setOd] = useState(p?.od ?? "");
  const [doV, setDo] = useState(p?.do ?? "");
  const [lovisteId, setLoviste] = useState(p?.lovisteId);
  const [kvote, setKvote] = useState<Kvota[]>(p?.kvote ?? []);
  const [napomena, setNapomena] = useState(p?.napomena ?? "");
  const potvrda = usePotvrda();

  const spremi = () => {
    const podaci = {
      tip,
      naziv: naziv.trim() || TIPOVI_DOZVOLA[tip],
      broj: tekst(brojD),
      izdavatelj: tekst(izdavatelj),
      od: tekst(od),
      do: tekst(doV),
      lovisteId,
      kvote: kvote.filter((k) => k.broj > 0),
      napomena: tekst(napomena),
    };
    if (p) {
      db.uredi("dozvole", p.id, podaci);
      obavijest("Dozvola je ažurirana");
    } else {
      db.dodaj("dozvole", podaci);
      obavijest("Dozvola je dodana");
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj("Obrisati dozvolu?", "Dozvola i njezine kvote bit će uklonjene.", () => {
      db.obrisi("dozvole", p!.id);
      zatvori();
      obavijest("Dozvola je obrisana", "info", { oznaka: "Poništi", radnja: () => db.vrati("dozvole", p!) });
    });

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={p ? "Uredi dokument" : "Nova dozvola ili dokument"}
        podnaslov="Dozvole, iskaznice, oružni list i osiguranje"
        podnozje={<PodnozjeObrasca onSpremi={spremi} onOdustani={zatvori} onObrisi={p ? obrisi : undefined} />}
      >
        <Odjeljak naslov="Dokument">
          <Polje oznaka="Vrsta">
            <Cipovi
              opcije={Object.entries(TIPOVI_DOZVOLA).map(([k, n]) => ({ vrijednost: k, oznaka: n }))}
              odabrano={tip}
              promjena={(x) => setTip(x as TipDozvole)}
            />
          </Polje>
          <Polje oznaka="Naziv">
            <input className="unos" value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder={TIPOVI_DOZVOLA[tip]} />
          </Polje>
          <Red>
            <Polje oznaka="Broj">
              <input className="unos brojke" value={brojD} onChange={(e) => setBroj(e.target.value)} />
            </Polje>
            <Polje oznaka="Izdavatelj">
              <input className="unos" value={izdavatelj} onChange={(e) => setIzdavatelj(e.target.value)} />
            </Polje>
          </Red>
          <Red>
            <Polje oznaka="Vrijedi od">
              <input type="date" className="unos" value={od} onChange={(e) => setOd(e.target.value)} />
            </Polje>
            <Polje oznaka="Vrijedi do">
              <input type="date" className="unos" value={doV} onChange={(e) => setDo(e.target.value)} />
            </Polje>
          </Red>
          <Polje oznaka="Lovište">
            <OdabirLovista baza={baza} vrijednost={lovisteId} promjena={setLoviste} />
          </Polje>
        </Odjeljak>

        <Odjeljak
          naslov="Kvote odstrela"
          desno={
            <Gumb velicina="sm" vrsta="tihi" ikona="plus" onClick={() => setKvote([...kvote, { vrsta: "Srna obična", broj: 1 }])}>
              Dodaj
            </Gumb>
          }
        >
          <AnimatePresence initial={false}>
            {kvote.map((k, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
              >
                <OdabirVrste
                  className="min-w-0 flex-1 basis-full sm:basis-auto"
                  vrijednost={k.vrsta}
                  promjena={(x) => setKvote(kvote.map((y, j) => (j === i ? { ...y, vrsta: x } : y)))}
                />
                <select
                  className="unos w-auto flex-1 sm:w-28 sm:flex-none"
                  value={k.spol ?? ""}
                  onChange={(e) => setKvote(kvote.map((y, j) => (j === i ? { ...y, spol: (e.target.value || undefined) as Spol | undefined } : y)))}
                >
                  <option value="">Svi</option>
                  <option value="m">Muški</option>
                  <option value="z">Ženski</option>
                  <option value="n">Mladi</option>
                </select>
                <Koracnik vrijednost={k.broj} min={1} promjena={(x) => setKvote(kvote.map((y, j) => (j === i ? { ...y, broj: x } : y)))} />
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-xl text-tekst-3 hover:bg-opasnost-meka hover:text-opasnost"
                  onClick={() => setKvote(kvote.filter((_, j) => j !== i))}
                  aria-label="Ukloni"
                >
                  <Ikona ime="x" velicina={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!kvote.length && <p className="text-sm text-tekst-3">Kvote pomažu pratiti iskorištenost plana odstrela.</p>}
        </Odjeljak>

        <Odjeljak naslov="Napomena">
          <textarea className="unos min-h-20" value={napomena} onChange={(e) => setNapomena(e.target.value)} />
        </Odjeljak>
      </Ploca>
      {potvrda.element}
    </>
  );
}

/* ---------------- Točka na karti ---------------- */

export function TockaUrednik({
  baza,
  otvorena,
  id,
  pocetno,
}: {
  baza: Baza;
  otvorena: boolean;
  id?: string;
  pocetno?: Partial<Tocka>;
}) {
  const p = baza.tocke.find((t) => t.id === id) ?? pocetno;
  const postojeca = baza.tocke.find((t) => t.id === id);
  const [tip, setTip] = useState<TipTocke>(p?.tip ?? "ceka");
  const [naziv, setNaziv] = useState(p?.naziv ?? "");
  const [lovisteId, setLoviste] = useState<string | undefined>(p?.lovisteId ?? baza.lovista[0]?.id);
  const [lok, setLok] = useState<Tocka2D | undefined>(p?.lat != null && p?.lng != null ? { lat: p.lat, lng: p.lng } : undefined);
  const [napomena, setNapomena] = useState(p?.napomena ?? "");
  const [vjetrovi, setVjetrovi] = useState<number[]>(p?.vjetrovi ?? []);
  const potvrda = usePotvrda();
  const zaVjetar = tip === "ceka" || tip === "zaklon";

  const spremi = () => {
    const podaci = {
      tip,
      vjetrovi: zaVjetar && vjetrovi.length ? vjetrovi : undefined,
      naziv: naziv.trim() || TIPOVI_TOCAKA[tip].naziv,
      lovisteId,
      lat: lok!.lat,
      lng: lok!.lng,
      napomena: tekst(napomena),
    };
    if (postojeca) {
      db.uredi("tocke", postojeca.id, podaci);
      obavijest("Točka je ažurirana");
    } else {
      db.dodaj("tocke", podaci);
      obavijest(`${TIPOVI_TOCAKA[tip].naziv} je dodana na kartu`);
    }
    zatvori();
  };

  const obrisi = () =>
    potvrda.pitaj("Obrisati točku?", "Točka će biti uklonjena s karte.", () => {
      db.obrisi("tocke", postojeca!.id);
      zatvori();
      obavijest("Točka je obrisana", "info", { oznaka: "Poništi", radnja: () => db.vrati("tocke", postojeca!) });
    });

  return (
    <>
      <Ploca
        otvorena={otvorena}
        zatvori={zatvori}
        naslov={postojeca ? "Uredi točku" : "Nova točka"}
        podnaslov="Čeke, hranilišta, solišta, kamere…"
        podnozje={
          <PodnozjeObrasca
            onSpremi={spremi}
            onOdustani={zatvori}
            onObrisi={postojeca ? obrisi : undefined}
            onemoguceno={!lok}
          />
        }
      >
        <Odjeljak naslov="Vrsta">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(Object.keys(TIPOVI_TOCAKA) as TipTocke[]).map((t) => {
              const a = t === tip;
              return (
                <motion.button
                  key={t}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setTip(t)}
                  className={cx(
                    "relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[12.5px] transition-colors",
                    a ? "border-naglasak bg-naglasak-meki text-tekst" : "border-rub bg-povrsina-2 text-tekst-2",
                  )}
                >
                  <span
                    className="grid size-8 place-items-center rounded-full text-[12px] font-bold text-black/75"
                    style={{ background: TIPOVI_TOCAKA[t].boja }}
                  >
                    {TIPOVI_TOCAKA[t].slovo}
                  </span>
                  {TIPOVI_TOCAKA[t].naziv}
                </motion.button>
              );
            })}
          </div>
        </Odjeljak>
        <Odjeljak naslov="Podaci">
          <Polje oznaka="Naziv">
            <input className="unos" value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder={`npr. ${TIPOVI_TOCAKA[tip].naziv} Hrastik`} />
          </Polje>
          <Polje oznaka="Lovište">
            <OdabirLovista baza={baza} vrijednost={lovisteId} promjena={setLoviste} />
          </Polje>
          <PoljeLokacije
            naslov="Položaj"
            naslovKarte={naziv.trim() || `Gdje je ${TIPOVI_TOCAKA[tip].naziv.toLowerCase()}?`}
            prazno="Odaberite na karti ili uzmite svoju lokaciju"
            vrijednost={lok}
            sredina={centarLovista(baza, lovisteId)}
            promjena={setLok}
            obavezno
          />
          <Polje oznaka="Napomena">
            <textarea className="unos min-h-20" value={napomena} onChange={(e) => setNapomena(e.target.value)} placeholder="Smjer pogleda, stanje, pristup…" />
          </Polje>
        </Odjeljak>
        {zaVjetar && (
          <Odjeljak naslov="Dobar vjetar">
            <OdabirVjetrova vrijednost={vjetrovi} promjena={setVjetrovi} />
          </Odjeljak>
        )}
      </Ploca>
      {potvrda.element}
    </>
  );
}
