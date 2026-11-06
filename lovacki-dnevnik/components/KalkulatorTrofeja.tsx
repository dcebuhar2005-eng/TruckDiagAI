"use client";

import { useState } from "react";
import {
  MEDALJE,
  NAZIV_MEDALJE,
  bodoviJelena,
  bodoviSrnjaka,
  bodoviVepra,
  medalja,
  rasponJelena,
  zaokruzi,
  type VrstaTrofeja,
} from "@/lib/cic";
import { dogadaj } from "@/lib/pracenje";
import { Gumb, Ploca, Segmenti, cx } from "./ui";

type Polja = Record<string, string>;
const br = (s: string | undefined) => {
  const x = parseFloat((s ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};

const NAZIV: Record<VrstaTrofeja, string> = { srnjak: "Srnjak", jelen: "Jelen obični", vepar: "Vepar" };

/** Informativni izračun CIC bodova i medalje; „Upiši” vraća bodove u obrazac odstrela. */
export default function KalkulatorTrofeja({
  otvorena,
  zatvori,
  vrsta: zadana,
  primijeni,
}: {
  otvorena: boolean;
  zatvori: () => void;
  vrsta?: VrstaTrofeja | null;
  primijeni?: (bodovi: number) => void;
}) {
  const [vrsta, setVrsta] = useState<VrstaTrofeja>(zadana ?? "srnjak");
  const [p, setP] = useState<Polja>({});
  const v = (k: string) => p[`${vrsta}.${k}`] ?? "";
  const postavi = (k: string, x: string) => setP((s) => ({ ...s, [`${vrsta}.${k}`]: x }));
  const g = (k: string) => br(v(k));

  const bodovi =
    vrsta === "srnjak"
      ? bodoviSrnjaka({ duljinaL: g("dl"), duljinaD: g("dd"), masa: g("masa"), volumen: g("vol"), raspon: g("raspon"), dodaci: g("dodaci"), odbici: g("odbici") })
      : vrsta === "jelen"
        ? bodoviJelena({
            duljinaL: g("dl"),
            duljinaD: g("dd"),
            nadocnjakL: g("nl"),
            nadocnjakD: g("nd"),
            srednjakL: g("sl"),
            srednjakD: g("sd"),
            vijenacL: g("vl"),
            vijenacD: g("vd"),
            donjiL: g("ol"),
            donjiD: g("od"),
            gornjiL: g("gl"),
            gornjiD: g("gd"),
            masa: g("masa"),
            parozaka: g("par"),
            rasponCm: g("raspon"),
            dodaci: g("dodaci"),
            odbici: g("odbici"),
          })
        : bodoviVepra({ duljinaL: g("dl"), duljinaD: g("dd"), sirinaL: g("sl"), sirinaD: g("sd"), brusacL: g("bl"), brusacD: g("bd"), dodaci: g("dodaci"), odbici: g("odbici") });
  const ukupno = Math.max(0, zaokruzi(bodovi));
  const m = medalja(vrsta, ukupno);
  const [b, s, z] = MEDALJE[vrsta];

  const par = (oznaka: string, l: string, d: string, jed: string) => (
    <div key={l}>
      <div className="mb-1 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">
        {oznaka} <span className="normal-case text-tekst-3">({jed})</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input inputMode="decimal" className="unos brojke" placeholder="lijevo" value={v(l)} onChange={(e) => postavi(l, e.target.value)} />
        <input inputMode="decimal" className="unos brojke" placeholder="desno" value={v(d)} onChange={(e) => postavi(d, e.target.value)} />
      </div>
    </div>
  );
  const jedno = (oznaka: string, k: string, jed?: string, pomoc?: string) => (
    <div key={k}>
      <div className="mb-1 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">
        {oznaka} {jed && <span className="normal-case text-tekst-3">({jed})</span>}
      </div>
      <input inputMode="decimal" className="unos brojke" value={v(k)} onChange={(e) => postavi(k, e.target.value)} />
      {pomoc && <div className="mt-1 text-[11.5px] text-tekst-3">{pomoc}</div>}
    </div>
  );

  const prosjecnaDuljina = (g("dl") + g("dd")) / 2;

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="🏆 Kalkulator trofeja"
      podnaslov="CIC bodovi i medalja – informativno; službenu ocjenu daje komisija"
      sirina={460}
      podnozje={
        <div className="grid gap-2">
          <div className={cx("flex items-center justify-between rounded-2xl px-4 py-3", m ? "bg-naglasak-meki" : "bg-povrsina-2")}>
            <div>
              <div className="font-display text-[26px] leading-none font-semibold">
                {ukupno.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="ml-1 text-[14px] text-tekst-3">CIC</span>
              </div>
              <div className="mt-1 text-[13px] text-tekst-2">{m ? NAZIV_MEDALJE[m] : `Bez medalje (bronca od ${b})`}</div>
            </div>
            {primijeni && (
              <Gumb
                vrsta="primarni"
                disabled={!ukupno}
                onClick={() => {
                  primijeni(ukupno);
                  dogadaj("cic_izracun", { vrsta, medalja: m ?? "nema" });
                  zatvori();
                }}
              >
                Upiši
              </Gumb>
            )}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 pb-2">
        {!zadana && (
          <Segmenti
            vrijednost={vrsta}
            promjena={(x: VrstaTrofeja) => setVrsta(x)}
            opcije={(["srnjak", "jelen", "vepar"] as VrstaTrofeja[]).map((x) => ({ vrijednost: x, oznaka: NAZIV[x] }))}
          />
        )}
        <p className="text-[12.5px] text-tekst-3">
          Medalje ({NAZIV[vrsta].toLowerCase()}): bronca {b}, srebro {s}, zlato {z} CIC. Mjeri se najranije 30 dana nakon preparacije.
        </p>

        {vrsta === "srnjak" && (
          <>
            {par("Duljina grana", "dl", "dd", "cm")}
            <div className="grid grid-cols-2 gap-2">
              {jedno("Masa", "masa", "g", "kratko odrezana lubanja; s cijelom lubanjom bez donje čeljusti oduzmite 65–90 g")}
              {jedno("Volumen", "vol", "cm³", "uranjanjem rogovlja u vodu")}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {jedno("Raspon", "raspon", "0–4", undefined)}
              {jedno("Dodaci", "dodaci", "0–19", undefined)}
              {jedno("Odbici", "odbici", "0–5", undefined)}
            </div>
            <p className="text-[11.5px] text-tekst-3">Dodaci: boja 0–4, biserje 0–4, ruže 0–4, vrhovi parožaka 0–2, pravilnost i kvaliteta 0–5.</p>
          </>
        )}

        {vrsta === "jelen" && (
          <>
            {par("Duljina grana", "dl", "dd", "cm")}
            {par("Duljina nadočnjaka", "nl", "nd", "cm")}
            {par("Duljina srednjaka", "sl", "sd", "cm")}
            {par("Opseg vijenca", "vl", "vd", "cm")}
            {par("Donji opseg grane", "ol", "od", "cm")}
            {par("Gornji opseg grane", "gl", "gd", "cm")}
            <div className="grid grid-cols-2 gap-2">
              {jedno("Masa", "masa", "kg", "nakon odbitka za lubanju (0,5–0,7 kg)")}
              {jedno("Broj parožaka", "par", undefined, "parošci od najmanje 2 cm")}
            </div>
            {jedno("Unutarnji raspon", "raspon", "cm", g("raspon") && prosjecnaDuljina ? `${rasponJelena(g("raspon"), prosjecnaDuljina)} boda (prema postotku prosječne duljine grana)` : "bodovi 0–3 računaju se sami")}
            <div className="grid grid-cols-2 gap-2">
              {jedno("Dodaci", "dodaci", "0–18", undefined)}
              {jedno("Odbici", "odbici", "0–3", undefined)}
            </div>
            <p className="text-[11.5px] text-tekst-3">Dodaci: boja 0–2, biserje 0–2, vrhovi 0–2, ledenjaci 0–2, kruna 0–10.</p>
          </>
        )}

        {vrsta === "vepar" && (
          <>
            {par("Duljina donjih kljova", "dl", "dd", "cm")}
            {par("Širina donjih kljova", "sl", "sd", "mm")}
            {par("Opseg brusača", "bl", "bd", "cm")}
            <div className="grid grid-cols-2 gap-2">
              {jedno("Ljepota", "dodaci", "0–5", "kljove 0–2, brusači 0–3")}
              {jedno("Odbici", "odbici", "0–10", undefined)}
            </div>
          </>
        )}
      </div>
    </Ploca>
  );
}
