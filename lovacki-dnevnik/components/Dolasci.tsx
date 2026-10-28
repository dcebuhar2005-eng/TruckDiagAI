"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Ikona from "./Ikona";
import { Cipovi, Gumb, Ploca, Polje, djeteListe, obavijest } from "./ui";
import { otvori, zatvori } from "./urednici/kontroler";
import { OdabirVrste, broj, tekst } from "./urednici/zajednicko";
import { HRANE, TIPOVI_TOCAKA } from "@/lib/katalog";
import { usePro } from "@/lib/pro";
import { datumKratki, isoDatum, isoVrijeme } from "@/lib/format";
import { hranaNaTocki } from "@/lib/upiti";
import { db, noviId } from "@/lib/store";
import type { Baza, Dolazak, TipTocke, Tocka } from "@/lib/types";

const dvije = (n: number) => String(n).padStart(2, "0");

/** Novije prvo (datum, pa vrijeme). */
export const poRedu = (d: Dolazak[]) =>
  [...d].sort((a, b) =>
    `${b.datum} ${b.vrijeme}`.localeCompare(`${a.datum} ${a.vrijeme}`),
  );

/**
 * Po vrsti: koliko puta je dolazila, zadnji dolazak i sat u kojem najčešće dolazi
 * (dvosatni prozor s najviše dolazaka; preko ponoći se računa kao jedan dan).
 */
export function sazetakDolazaka(dolasci: Dolazak[]) {
  const vrste = new Map<string, Dolazak[]>();
  for (const d of dolasci)
    vrste.set(d.vrsta, [...(vrste.get(d.vrsta) ?? []), d]);
  return [...vrste]
    .map(([vrsta, d]) => {
      const sati = Array<number>(24).fill(0);
      for (const x of d) sati[Number(x.vrijeme.slice(0, 2)) % 24]++;
      let od = 0;
      for (let h = 1; h < 24; h++)
        if (sati[h] + sati[(h + 1) % 24] > sati[od] + sati[(od + 1) % 24])
          od = h;
      const hrane = new Map<string, number>();
      for (const x of d)
        if (x.hrana) hrane.set(x.hrana, (hrane.get(x.hrana) ?? 0) + 1);
      const hrana = [...hrane].sort((a, b) => b[1] - a[1])[0];
      return {
        vrsta,
        puta: d.length,
        zadnji: poRedu(d)[0],
        prozor:
          d.length > 1 ? `${dvije(od)}–${dvije((od + 2) % 24)} h` : undefined,
        hrana: hrana && { naziv: hrana[0], puta: hrana[1] },
      };
    })
    .sort((a, b) => b.puta - a.puta);
}

/** Gdje se najčešće bilježe dolasci – te vrste točaka idu prve u odabiru. */
const PRVO: TipTocke[] = [
  "kamera",
  "hraniliste",
  "ceka",
  "soliste",
  "kaljuziste",
  "pojiliste",
];

/** Svi dolasci sa svih točaka, novije prvo. */
export const sviDolasci = (b: Baza) =>
  b.tocke
    .flatMap((t) => (t.dolasci ?? []).map((d) => ({ d, t })))
    .sort((a, b) =>
      `${b.d.datum} ${b.d.vrijeme}`.localeCompare(
        `${a.d.datum} ${a.d.vrijeme}`,
      ),
    );

/**
 * „Dolazak divljači”: odabir točke (kamera, hranilište, čeka…), upis dolaska i popis zapisanih.
 * Upis je besplatan; izračun kad i na koju hranu divljač najčešće dolazi je PRO.
 */
export function DolazakDivljaci({
  baza,
  otvorena,
  tockaId,
}: {
  baza: Baza;
  otvorena: boolean;
  tockaId?: string;
}) {
  const pro = usePro();
  const tocke = [...baza.tocke].sort((a, b) => {
    const r = (t: Tocka) =>
      (t.dolasci?.length ? -1 : 0) +
      (PRVO.includes(t.tip) ? PRVO.indexOf(t.tip) : 9);
    return r(a) - r(b) || a.naziv.localeCompare(b.naziv, "hr");
  });
  const [odabrana, setOdabrana] = useState(
    () => tockaId ?? sviDolasci(baza)[0]?.t.id ?? tocke[0]?.id,
  );
  const tocka = baza.tocke.find((t) => t.id === odabrana);
  const dolasci = tocka?.dolasci ?? [];
  const zadnjaVrsta = poRedu(dolasci)[0]?.vrsta ?? "Divlja svinja";
  const [vrsta, setVrsta] = useState(zadnjaVrsta);
  const [kom, setKom] = useState("");
  const [datum, setDatum] = useState(() => isoDatum());
  const [vrijeme, setVrijeme] = useState(() => isoVrijeme());
  const [izvor, setIzvor] = useState<"kamera" | "uzivo">(
    tocka?.tip === "kamera" || tocka?.dodatno?.includes("kamera")
      ? "kamera"
      : "uzivo",
  );
  const [napomena, setNapomena] = useState("");
  // Hrana se predlaže iz zadnje prihrane ove točke do odabranog datuma, dok je korisnik ne promijeni.
  const [hranaRucno, setHranaRucno] = useState<string | null>(null);
  const predlozena = tocka ? hranaNaTocki(baza, tocka.id, datum) : undefined;
  const hrana = hranaRucno ?? predlozena?.hrana ?? "";
  const hrane = [
    ...new Set([
      ...dolasci.flatMap((d) => (d.hrana ? [d.hrana] : [])),
      ...HRANE,
    ]),
  ];

  const spremi = () => {
    if (!tocka || !datum || !vrijeme) return;
    const novi: Dolazak = {
      id: noviId(),
      vrsta,
      broj: broj(kom),
      datum,
      vrijeme,
      izvor,
      hrana: tekst(hrana),
      napomena: tekst(napomena),
    };
    db.uredi("tocke", tocka.id, { dolasci: [...dolasci, novi] });
    obavijest(
      `Zapisano: ${vrsta.toLowerCase()} ${datumKratki(datum)} u ${vrijeme}`,
    );
    setKom("");
    setNapomena("");
    setHranaRucno(null);
  };
  const obrisi = (d: Dolazak) => {
    if (!tocka) return;
    db.uredi("tocke", tocka.id, {
      dolasci: dolasci.filter((x) => x.id !== d.id),
    });
    obavijest("Dolazak je obrisan", "info", {
      oznaka: "Poništi",
      radnja: () =>
        db.uredi("tocke", tocka.id, {
          dolasci: [
            ...(db.dohvati().tocke.find((t) => t.id === tocka.id)?.dolasci ??
              []),
            d,
          ],
        }),
    });
  };
  const sazetak = sazetakDolazaka(dolasci);

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Dolazak divljači"
      podnaslov="Zapišite kad je divljač došla – s kamere ili s čeke"
      sirina={480}
    >
      <div className="grid gap-4 pb-2">
        {!tocke.length ? (
          <div className="rounded-2xl border border-rub bg-povrsina-2 p-4 text-[14.5px] text-tekst-2">
            Prvo označite na karti kameru, hranilište ili čeku – dolazak se veže
            uz mjesto.
            <Gumb
              className="mt-3 w-full"
              vrsta="primarni"
              ikona="plus"
              onClick={() =>
                otvori({ tip: "tocka", pocetno: { tip: "kamera" } })
              }
            >
              Dodaj točku
            </Gumb>
          </div>
        ) : (
          <div className="grid gap-3 rounded-2xl border border-rub bg-povrsina-2 p-4">
            <Polje oznaka="Gdje">
              <select
                className="unos"
                value={odabrana}
                onChange={(e) => {
                  const t = baza.tocke.find((x) => x.id === e.target.value);
                  setOdabrana(e.target.value);
                  setHranaRucno(null);
                  setIzvor(
                    t?.tip === "kamera" || t?.dodatno?.includes("kamera")
                      ? "kamera"
                      : "uzivo",
                  );
                }}
              >
                {tocke.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.naziv} · {TIPOVI_TOCAKA[t.tip].naziv}
                  </option>
                ))}
              </select>
            </Polje>
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <Polje oznaka="Divljač">
                <OdabirVrste vrijednost={vrsta} promjena={setVrsta} />
              </Polje>
              <Polje oznaka="Komada">
                <input
                  className="unos brojke"
                  inputMode="numeric"
                  placeholder="?"
                  value={kom}
                  onChange={(e) => setKom(e.target.value)}
                />
              </Polje>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Polje oznaka="Datum">
                <input
                  type="date"
                  className="unos"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                />
              </Polje>
              <Polje oznaka="Vrijeme">
                <input
                  type="time"
                  className="unos"
                  value={vrijeme}
                  onChange={(e) => setVrijeme(e.target.value)}
                />
              </Polje>
            </div>
            <Cipovi
              opcije={[
                { vrijednost: "kamera", oznaka: "📷 S kamere" },
                { vrijednost: "uzivo", oznaka: "👁 Vidio uživo" },
              ]}
              odabrano={izvor}
              promjena={(v) => setIzvor(v as "kamera" | "uzivo")}
            />
            <Polje
              oznaka="Na koju hranu je došla"
              pomoc={
                predlozena && !hranaRucno
                  ? `Zadnja prihrana ovdje: ${datumKratki(predlozena.datum)}`
                  : undefined
              }
            >
              <input
                className="unos"
                list="hrane-dolazak"
                placeholder="npr. kukuruz u zrnu (može i prazno)"
                value={hrana}
                onChange={(e) => setHranaRucno(e.target.value)}
              />
              <datalist id="hrane-dolazak">
                {hrane.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </Polje>
            <input
              className="unos"
              placeholder="Napomena (npr. krmača s prascima)"
              value={napomena}
              onChange={(e) => setNapomena(e.target.value)}
            />
            <Gumb
              vrsta="primarni"
              ikona="plus"
              onClick={spremi}
              disabled={!datum || !vrijeme}
            >
              Zapiši dolazak
            </Gumb>
          </div>
        )}

        {pro && sazetak.length > 0 && (
          <div className="grid gap-1.5">
            <h3 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">
              Kad dolaze
            </h3>
            {sazetak.map((s) => (
              <div
                key={s.vrsta}
                className="rounded-xl bg-povrsina-2 px-3.5 py-2.5"
              >
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 font-medium">{s.vrsta}</span>
                  <span className="brojke text-[13px] text-tekst-3">
                    {s.puta}×
                  </span>
                </div>
                <div className="text-[13px] text-tekst-2">
                  {s.prozor ? `Najčešće ${s.prozor} · ` : ""}zadnji put{" "}
                  {datumKratki(s.zadnji.datum)} u {s.zadnji.vrijeme}
                </div>
                {s.hrana && (
                  <div className="text-[13px] text-naglasak">
                    Najviše dolazi na: {s.hrana.naziv.toLowerCase()} (
                    {s.hrana.puta}×)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {dolasci.length > 0 && (
          <div className="grid gap-1.5">
            <h3 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">
              Zapisano
            </h3>
            <AnimatePresence initial={false}>
              {poRedu(dolasci).map((d) => (
                <motion.div
                  key={d.id}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-rub px-3.5 py-2"
                >
                  <span className="brojke w-[86px] shrink-0 text-[13px] text-tekst-2">
                    {datumKratki(d.datum)}
                    <span className="block font-semibold text-tekst">
                      {d.vrijeme}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px]">
                      {d.vrsta}
                      {d.broj ? ` · ${d.broj} kom` : ""}
                    </span>
                    <span className="block truncate text-[12.5px] text-tekst-3">
                      {d.izvor === "kamera" ? "s kamere" : "uživo"}
                      {d.hrana ? ` · na ${d.hrana.toLowerCase()}` : ""}
                      {d.napomena ? ` · ${d.napomena}` : ""}
                    </span>
                  </span>
                  <button
                    className="grid size-9 place-items-center rounded-lg text-tekst-3 hover:text-opasnost"
                    onClick={() => obrisi(d)}
                    aria-label="Obriši dolazak"
                  >
                    <Ikona ime="x" velicina={15} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Ploca>
  );
}

/** Kartica na Pregledu: zadnji dolasci i gumb za upis. */
export function DolasciKartica({ baza }: { baza: Baza }) {
  const zadnji = sviDolasci(baza).slice(0, 3);
  return (
    <motion.section variants={djeteListe} className="kartica p-5 lg:col-span-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">
            Dolazak divljači
          </h2>
          {!zadnji.length && (
            <p className="mt-1 text-[14px] text-tekst-2">
              Kamera snimila svinje? Zapišite kad su došle.
            </p>
          )}
        </div>
        <Gumb
          vrsta="primarni"
          velicina="sm"
          ikona="plus"
          onClick={() => otvori({ tip: "dolazak" })}
        >
          Zapiši
        </Gumb>
      </div>
      {zadnji.length > 0 && (
        <div className="grid gap-1.5">
          {zadnji.map(({ d, t }) => (
            <button
              key={d.id}
              onClick={() => otvori({ tip: "dolazak", tockaId: t.id })}
              className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3.5 py-2.5 text-left"
            >
              <span className="brojke w-[72px] shrink-0 text-[12.5px] text-tekst-3">
                {datumKratki(d.datum)}
                <span className="block text-[15px] font-semibold text-tekst">
                  {d.vrijeme}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {d.vrsta}
                  {d.broj ? ` · ${d.broj} kom` : ""}
                </span>
                <span className="block truncate text-[12.5px] text-tekst-3">
                  {d.izvor === "kamera" ? "📷 " : ""}
                  {t.naziv}
                  {d.hrana ? ` · ${d.hrana.toLowerCase()}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.section>
  );
}
