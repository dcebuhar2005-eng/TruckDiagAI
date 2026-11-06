"use client";

import { motion } from "framer-motion";
import Animacija from "@/components/Animacija";
import { useEffect, useMemo, useState } from "react";
import Ikona from "@/components/Ikona";
import { Naslov, Ploca, Segmenti, cx, djeteListe, roditeljListe, useKlijent } from "@/components/ui";
import { Kostur } from "@/components/Kostur";
import {
  DRZAVE,
  odabranaDrzava,
  spremiDrzavu,
  KATEGORIJE,
  type Kategorija,
  type Vrsta,
  danaDoPromjene,
  danPromjene,
  dopusteno,
  imaDatume,
  kratkiDatum,
  lovnaGodina,
  opisLova,
  opisLovostaja,
  polozajDana,
  trake,
  uLovostaju,
  uskoroZatvara,
  vrstaOtvorena,
} from "@/lib/lovostaj";
import { dogadaj } from "@/lib/pracenje";

export const KLJUC_VIDJENO = "lovacki-dnevnik:kalendar-vidjen";
const MJESECI = ["T", "S", "L", "S", "K", "R", "L", "S", "P", "P", "S", "V"];
const DANI = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];
const MJ_GEN = ["siječnja", "veljače", "ožujka", "travnja", "svibnja", "lipnja", "srpnja", "kolovoza", "rujna", "listopada", "studenoga", "prosinca"];

const dana = (n: number) => (n === 1 ? "1 dan" : `${n} dana`);

export default function LovniKalendar() {
  // Kalendar ovisi o današnjem datumu – crta se tek u pregledniku (inače se unaprijed pripremljena
  // stranica s datumom izrade ne poklapa s današnjim i React javlja grešku).
  const klijent = useKlijent();
  if (!klijent) return <Kostur />;
  return <Kalendar />;
}

function Kalendar() {
  const [drzavaK, setDrzavaK] = useState(odabranaDrzava);
  const [prikaz, setPrikaz] = useState<"danas" | "godina">("danas");
  const [kat, setKat] = useState<Kategorija>("krupna");
  const [upit, setUpit] = useState("");
  const [odabrana, setOdabrana] = useState<Vrsta | null>(null);
  const [sveOtvorene, setSveOtvorene] = useState(false);
  const danas = useMemo(() => new Date(), []);

  useEffect(() => {
    try {
      localStorage.setItem(KLJUC_VIDJENO, "1");
    } catch {}
    dogadaj("kalendar_otvoren");
  }, []);

  const drzava = DRZAVE.find((d) => d.k === drzavaK)!;
  const vrste = drzava.vrste;
  const otvorene = vrste.filter((v) => vrstaOtvorena(v, danas));
  const uskoro = uskoroZatvara(vrste, danas, 30);
  const zatvorene = uLovostaju(vrste, danas);
  const poPlanu = vrste.filter((v) => v.dijelovi.every((x) => x.pravilo.tip === "plan"));
  const g = lovnaGodina(danas);
  const q = upit.trim().toLowerCase();
  const popis = q ? vrste.filter((v) => (v.naziv + " " + v.dijelovi.map((x) => x.naziv).join(" ")).toLowerCase().includes(q)) : vrste.filter((v) => v.kat === kat);

  return (
    <div>
      <Naslov natpis={`Lovna godina ${g}./${String(g + 1).slice(2)}.`} naslov="Lovni kalendar" opis="Kada se smije loviti koja divljač – lovostaj po vrstama." />

      <div className="skriven-klizac -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {DRZAVE.map((d) => {
          const ima = d.vrste.length > 0;
          return (
            <button
              key={d.k}
              disabled={!ima}
              onClick={() => {
                setDrzavaK(d.k);
                spremiDrzavu(d.k);
                dogadaj("kalendar_drzava", { drzava: d.k });
              }}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13.5px] whitespace-nowrap transition-colors",
                d.k === drzavaK ? "border-naglasak/60 bg-naglasak-meki font-semibold text-naglasak" : "border-rub bg-povrsina-2 text-tekst-2",
                !ima && "opacity-45",
              )}
            >
              <span>{d.zastava}</span>
              {d.naziv}
              {!ima && <span className="text-[12px]">· uskoro</span>}
            </button>
          );
        })}
      </div>

      <Segmenti
        className="mb-4"
        vrijednost={prikaz}
        promjena={setPrikaz}
        opcije={[
          { vrijednost: "danas", oznaka: "Danas" },
          { vrijednost: "godina", oznaka: "Cijela godina" },
        ]}
      />

      {prikaz === "danas" ? (
        <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 lg:grid-cols-2">
          <motion.section variants={djeteListe} className="rounded-3xl border border-mahovina/35 bg-gradient-to-b from-mahovina-meka to-povrsina p-4 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[19px] font-semibold">
                Danas, {danas.getDate()}. {MJ_GEN[danas.getMonth()]}
              </h2>
              <span className="text-[12.5px] text-tekst-3">{otvorene.length} vrsta otvoreno</span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-tekst-3">{DANI[danas.getDay()]}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(sveOtvorene ? otvorene : otvorene.slice(0, 12)).map((v) => (
                <button
                  key={v.k}
                  onClick={() => setOdabrana(v)}
                  className="rounded-full bg-mahovina-meka px-3 py-1.5 text-[13px] font-medium text-mahovina transition-colors hover:bg-mahovina/25"
                >
                  {v.naziv}
                </button>
              ))}
              {otvorene.length > 12 && (
                <button onClick={() => setSveOtvorene(!sveOtvorene)} className="rounded-full bg-povrsina-2 px-3 py-1.5 text-[13px] text-tekst-2">
                  {sveOtvorene ? "Manje" : `+${otvorene.length - 12} više`}
                </button>
              )}
            </div>
          </motion.section>

          {uskoro.length > 0 && (
            <motion.section variants={djeteListe}>
              <Oznaka>Uskoro se zatvara</Oznaka>
              <div className="rounded-3xl border border-rub bg-povrsina px-4 py-1">
                {uskoro.map((u) => (
                  <Red key={u.vrsta.k + u.dio} ikona={u.vrsta.ikona} naziv={u.dio} opis={`lov do ${kratkiDatum(u.zadnji)}`} onClick={() => setOdabrana(u.vrsta)}>
                    <span className="rounded-full bg-naglasak-meki px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-naglasak">još {dana(u.za)}</span>
                  </Red>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section variants={djeteListe}>
            <Oznaka>U lovostaju</Oznaka>
            <div className="rounded-3xl border border-rub bg-povrsina px-4 py-1">
              {zatvorene.map((u) => (
                <Red key={u.vrsta.k + u.dio} ikona={u.vrsta.ikona} naziv={u.dio} opis={`otvara se za ${dana(u.za)}`} onClick={() => setOdabrana(u.vrsta)}>
                  <span className="rounded-full bg-opasnost-meka px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-opasnost">otvara {kratkiDatum(u.otvara)}</span>
                </Red>
              ))}
              {poPlanu.map((v) => (
                <Red key={v.k} ikona={v.ikona} naziv={v.naziv} opis="samo prema planu gospodarenja" onClick={() => setOdabrana(v)}>
                  <span className="rounded-full bg-povrsina-3 px-2.5 py-1 text-[12px] font-semibold text-tekst-2">plan</span>
                </Red>
              ))}
              {!zatvorene.length && !poPlanu.length && <p className="py-3 text-[14px] text-tekst-3">Danas nijedna vrsta nije u lovostaju.</p>}
            </div>
          </motion.section>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {KATEGORIJE.map((k) => (
              <button
                key={k.k}
                onClick={() => (setKat(k.k), setUpit(""))}
                className={cx(
                  "rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors",
                  !q && kat === k.k ? "border-naglasak/60 bg-naglasak-meki font-semibold text-naglasak" : "border-rub bg-povrsina-2 text-tekst-2",
                )}
              >
                {k.naziv}
              </button>
            ))}
            <div className="relative min-w-[160px] flex-1">
              <Ikona ime="pretraga" velicina={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tekst-3" />
              <input className="unos h-9 pl-9 text-[14px]" placeholder="Traži vrstu…" value={upit} onChange={(e) => setUpit(e.target.value)} />
            </div>
          </div>

          <div className="rounded-3xl border border-rub bg-povrsina p-3 sm:p-4">
            <div className="mb-1 grid grid-cols-[minmax(96px,30%)_1fr] items-end text-[10px] text-tekst-3">
              <span />
              <div className="grid grid-cols-12 text-center">
                {MJESECI.map((m, i) => (
                  <span key={i}>{m}</span>
                ))}
              </div>
            </div>
            {popis.map((v) => (
              <button key={v.k} onClick={() => setOdabrana(v)} className="block w-full rounded-xl px-1 py-1 text-left hover:bg-povrsina-2">
                {v.dijelovi.length > 1 && <span className="block pt-1 text-[12.5px] font-semibold">{v.naziv}</span>}
                {v.dijelovi.map((x) => (
                  <span key={x.naziv} className="grid grid-cols-[minmax(96px,30%)_1fr] items-center py-1">
                    <span className={cx("truncate pr-2 text-[12.5px]", v.dijelovi.length > 1 ? "pl-3 text-tekst-2" : "font-semibold")}>
                      {v.dijelovi.length > 1 ? x.naziv : v.naziv}
                    </span>
                    <Traka pravilo={x.pravilo} godina={g} danas={danas} />
                  </span>
                ))}
              </button>
            ))}
            {!popis.length && (
              <div className="flex flex-col items-center py-4 text-center text-[14px] text-tekst-3">
                <Animacija ime="prazno" className="h-24 w-36" />
                Nema vrste „{upit}”.
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-tekst-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full bg-mahovina" /> lov dopušten
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ background: "repeating-linear-gradient(45deg,#8cbf6e 0 3px,#6f9d55 3px 6px)" }} /> uz uvjete
              </span>
              <span className="flex items-center gap-1.5 text-naglasak">
                <span className="h-3 w-0.5 rounded bg-naglasak" /> danas
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <p className="mt-6 text-[12px] leading-relaxed text-tekst-3">
        Izvor: {drzava.izvor}. Kalendar je informativan – uvijek provjerite lovnogospodarski plan i odluke svog lovišta.
      </p>

      <Ploca otvorena={!!odabrana} zatvori={() => setOdabrana(null)} naslov={odabrana ? `${odabrana.ikona} ${odabrana.naziv}` : ""} podnaslov={odabrana?.latinski} sirina={440}>
        {odabrana && (
          <div className="grid gap-1 pb-2">
            {odabrana.dijelovi.map((x) => {
              const otv = dopusteno(x.pravilo, danas);
              const n = danaDoPromjene(x.pravilo, danas);
              const dan = danPromjene(x.pravilo, danas);
              const lovostaj = opisLovostaja(x.pravilo);
              return (
                <div key={x.naziv} className="rounded-2xl bg-povrsina-2 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{odabrana.dijelovi.length > 1 ? x.naziv : "Lov"}</span>
                    <span
                      className={cx(
                        "rounded-full px-2.5 py-1 text-[12px] font-semibold",
                        x.pravilo.tip === "plan" ? "bg-povrsina-3 text-tekst-2" : otv ? "bg-mahovina-meka text-mahovina" : "bg-opasnost-meka text-opasnost",
                      )}
                    >
                      {x.pravilo.tip === "plan" ? "prema planu" : otv ? "otvoreno" : "lovostaj"}
                    </span>
                  </div>
                  <div className="mt-1 text-[13.5px] text-tekst-2">{opisLova(x.pravilo)}</div>
                  {lovostaj && <div className="text-[12.5px] text-tekst-3">{lovostaj}</div>}
                  {x.napomena && <div className="mt-1 text-[12.5px] text-tekst-2">ℹ️ {x.napomena}</div>}
                  {imaDatume(x.pravilo) && n != null && dan && (
                    <div className={cx("mt-1 text-[12.5px]", otv && n <= 30 ? "text-naglasak" : "text-tekst-3")}>
                      {otv ? `Zadnji dan lova: ${kratkiDatum(dan)} (još ${dana(n)})` : `Lov se otvara ${kratkiDatum(dan)} (za ${dana(n)})`}
                    </div>
                  )}
                </div>
              );
            })}
            <p className="mt-2 text-[12px] text-tekst-3">Izvor: {drzava.izvor}. Provjerite lovnogospodarski plan svog lovišta.</p>
          </div>
        )}
      </Ploca>
    </div>
  );
}

function Oznaka({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 px-1 text-[11.5px] font-semibold tracking-[0.14em] text-tekst-3 uppercase">{children}</div>;
}

function Red({ ikona, naziv, opis, onClick, children }: { ikona: string; naziv: string; opis: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-rub py-2.5 text-left last:border-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-povrsina-2 text-[18px]">{ikona}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium">{naziv}</span>
        <span className="block truncate text-[12.5px] text-tekst-3">{opis}</span>
      </span>
      {children}
    </button>
  );
}

function Traka({ pravilo, godina, danas }: { pravilo: Parameters<typeof trake>[0]; godina: number; danas: Date }) {
  const dijelovi = trake(pravilo, godina);
  const plan = pravilo.tip === "plan";
  return (
    <span className="relative block h-3.5 rounded-full bg-povrsina-3/70">
      {dijelovi.map((d, i) => (
        <span
          key={i}
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${d.od}%`,
            width: `${d.do - d.od}%`,
            background: d.uvjet ? "repeating-linear-gradient(45deg,#8cbf6e 0 5px,#6f9d55 5px 10px)" : "linear-gradient(90deg,#7fb862,#8cbf6e)",
          }}
        />
      ))}
      {plan && <span className="absolute inset-0 grid place-items-center text-[10px] text-tekst-3">prema planu</span>}
      {pravilo.tip === "zabrana" && <span className="absolute inset-0 grid place-items-center text-[10px] text-tekst-3">ne lovi se</span>}
      <span className="absolute -inset-y-1 w-0.5 rounded bg-naglasak" style={{ left: `${polozajDana(danas)}%` }} />
    </span>
  );
}
