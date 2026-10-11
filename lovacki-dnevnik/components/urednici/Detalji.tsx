"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { mjesec, suncevaVremena } from "@/lib/astro";
import { NACINI_LOVA, TIPOVI_TOCAKA, bojaVrste, nazivSpola } from "@/lib/katalog";
import { danUTjednu, datumDugi, izIso, sat, trajanjeIzlaska } from "@/lib/format";
import { dohvatiFoto, fotografijeOdstrela } from "@/lib/foto";
import type { Baza } from "@/lib/types";
import { centarLovista, nazivLovista } from "@/lib/upiti";
import { opisVremena, smjerVjetra } from "@/lib/vrijeme";
import Ikona, { type ImeIkone } from "../Ikona";
import { StrelicaVjetra } from "../Vjetar";
import { Gumb, Ploca, Znacka, cx, djeteListe, roditeljListe } from "../ui";
import { otvori, zatvori } from "./kontroler";

function Podatak({ ikona, oznaka, vrijednost }: { ikona: ImeIkone; oznaka: string; vrijednost: ReactNode }) {
  return (
    <motion.div variants={djeteListe} className="rounded-2xl border border-rub bg-povrsina-2 p-3">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">
        <Ikona ime={ikona} velicina={13} />
        {oznaka}
      </div>
      <div className="brojke mt-1 text-[17px] font-semibold">{vrijednost}</div>
    </motion.div>
  );
}

export function OdstrelDetalj({ baza, otvorena, id }: { baza: Baza; otvorena: boolean; id: string }) {
  const o = baza.odstrel.find((x) => x.id === id);
  const [fotke, setFotke] = useState<string[]>([]);
  const [aktivna, setAktivna] = useState(0);
  const [puniZaslon, setPuniZaslon] = useState<number | null>(null);
  const kljuc = o ? fotografijeOdstrela(o).join(",") : "";
  useEffect(() => {
    if (!kljuc) return;
    let ziv = true;
    Promise.all(kljuc.split(",").map((fid) => dohvatiFoto(fid))).then((r) => ziv && setFotke(r.filter((x): x is string => !!x)));
    return () => {
      ziv = false;
    };
  }, [kljuc]);
  if (!o) return null;
  const izlazak = baza.izlasci.find((i) => i.id === o.izlazakId);
  const boja = bojaVrste(o.vrsta);

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov={o.vrsta}
      podnaslov={`${nazivSpola(o.vrsta, o.spol)} · ${datumDugi(o.datum)} u ${o.vrijeme}`}
      podnozje={
        <div className="flex gap-2">
          {o.lat != null && (
            <Link href={`/karta?fokus=${o.lat},${o.lng}`} onClick={zatvori} className="flex-1">
              <Gumb ikona="karta" className="w-full">
                Na karti
              </Gumb>
            </Link>
          )}
          <Gumb vrsta="primarni" ikona="uredi" className="flex-1" onClick={() => otvori({ tip: "odstrel", id: o.id })}>
            Uredi
          </Gumb>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-5 overflow-hidden rounded-3xl border border-rub"
        style={{ background: `linear-gradient(135deg, ${boja}33, transparent 70%)` }}
      >
        {fotke.length ? (
          <>
            <div
              className="skriven-klizac flex snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) => setAktivna(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            >
              {fotke.map((f, i) => (
                <button key={i} type="button" onClick={() => setPuniZaslon(i)} className="w-full shrink-0 snap-center" aria-label="Prikaži preko cijelog zaslona">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f} alt={`${o.vrsta} – fotografija ${i + 1}`} className="h-72 w-full object-cover" />
                </button>
              ))}
            </div>
            {fotke.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {fotke.map((_, i) => (
                  <span key={i} className={cx("h-1.5 rounded-full bg-white transition-all", i === aktivna ? "w-5 opacity-100" : "w-1.5 opacity-60")} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-36 items-center justify-center">
            <div className="grid size-20 place-items-center rounded-full border border-rub-jaki" style={{ color: boja }}>
              <Ikona ime="meta" velicina={40} debljina={1.4} />
            </div>
          </div>
        )}
        {o.markica && (
          <div className="absolute top-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 font-mono text-[12px] text-white backdrop-blur">
            {o.markica}
          </div>
        )}
      </motion.div>

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Podatak ikona="vaga" oznaka="Masa" vrijednost={o.masa ? `${o.masa.toLocaleString("hr-HR")} kg` : "–"} />
        <Podatak ikona="trofej" oznaka="Trofej" vrijednost={o.trofejCic ? `${o.trofejCic.toLocaleString("hr-HR")} CIC` : "–"} />
        <Podatak ikona="kalendar" oznaka="Dob" vrijednost={o.dob ?? "–"} />
        <Podatak ikona="nisan" oznaka="Udaljenost" vrijednost={o.udaljenost ? `${o.udaljenost} m` : "–"} />
        <Podatak ikona="meta" oznaka="Kalibar" vrijednost={o.kalibar ?? "–"} />
        <Podatak ikona="stit" oznaka="Oružje" vrijednost={o.oruzje ?? "–"} />
      </motion.div>

      <div className="mt-5 flex flex-wrap gap-2">
        {o.lovisteId && <Znacka boja={baza.lovista.find((l) => l.id === o.lovisteId)?.boja}>{nazivLovista(baza, o.lovisteId)}</Znacka>}
        {o.trofejOpis && <Znacka>{o.trofejOpis}</Znacka>}
        {o.lat != null && (
          <Znacka>
            {o.lat.toFixed(4)}°, {o.lng!.toFixed(4)}°
          </Znacka>
        )}
      </div>

      {o.napomena && <p className="mt-5 rounded-2xl bg-povrsina-2 p-4 text-[15px] leading-relaxed text-tekst-2">{o.napomena}</p>}

      {izlazak && (
        <button
          onClick={() => otvori({ tip: "detalj-izlazak", id: izlazak.id })}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-rub p-3 text-left transition-colors hover:bg-povrsina-2"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-mahovina-meka text-mahovina">
            <Ikona ime="dnevnik" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Izlazak {izlazak.od}{izlazak.do ? `–${izlazak.do}` : ""}</div>
            <div className="text-[12.5px] text-tekst-2">{NACINI_LOVA[izlazak.nacin]}</div>
          </div>
          <Ikona ime="desno" className="text-tekst-3" />
        </button>
      )}
      <AnimatePresence>
        {puniZaslon != null && fotke[puniZaslon] && (
          <motion.div
            className="fixed inset-0 z-[2600] flex items-center justify-center bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPuniZaslon(null)}
          >
            { }
            <motion.img
              key={puniZaslon}
              src={fotke[puniZaslon]}
              alt={o.vrsta}
              className="max-h-full max-w-full object-contain"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onClick={(e) => e.stopPropagation()}
              onDragEnd={(_, i) => {
                if (i.offset.x < -60 && puniZaslon < fotke.length - 1) setPuniZaslon(puniZaslon + 1);
                if (i.offset.x > 60 && puniZaslon > 0) setPuniZaslon(puniZaslon - 1);
              }}
            />
            <button
              className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white"
              aria-label="Zatvori"
            >
              <Ikona ime="x" />
            </button>
            {fotke.length > 1 && (
              <div className="brojke absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-[14px] text-white/80">
                {puniZaslon + 1} / {fotke.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Ploca>
  );
}

export function IzlazakDetalj({ baza, otvorena, id }: { baza: Baza; otvorena: boolean; id: string }) {
  const i = baza.izlasci.find((x) => x.id === id);
  if (!i) return null;
  const tocka = baza.tocke.find((t) => t.id === i.tockaId);
  const odstrel = baza.odstrel.filter((o) => o.izlazakId === i.id);
  const min = trajanjeIzlaska(i.od, i.do);
  const loc = tocka ?? centarLovista(baza, i.lovisteId);
  const dan = izIso(i.datum);
  const sv = suncevaVremena(dan, loc.lat, loc.lng);
  const m = mjesec(izIso(i.datum, i.od));
  const v = i.vrijeme;

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov={datumDugi(i.datum)}
      podnaslov={`${danUTjednu(dan).replace(/^./, (c) => c.toUpperCase())} · ${i.od}${i.do ? `–${i.do}` : ""}${min ? ` · ${Math.floor(min / 60)} h ${min % 60} min` : ""}`}
      podnozje={
        <div className="flex gap-2">
          <Gumb ikona="meta" className="flex-1" onClick={() => otvori({ tip: "odstrel", pocetno: { izlazakId: i.id, datum: i.datum, lovisteId: i.lovisteId, lat: tocka?.lat, lng: tocka?.lng } })}>
            Upiši odstrel
          </Gumb>
          <Gumb vrsta="primarni" ikona="uredi" className="flex-1" onClick={() => otvori({ tip: "izlazak", id: i.id })}>
            Uredi
          </Gumb>
        </div>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <Znacka boja="var(--naglasak)">{NACINI_LOVA[i.nacin]}</Znacka>
        {i.lovisteId && <Znacka boja={baza.lovista.find((l) => l.id === i.lovisteId)?.boja}>{nazivLovista(baza, i.lovisteId)}</Znacka>}
        {tocka && <Znacka boja={TIPOVI_TOCAKA[tocka.tip].boja}>{tocka.naziv}</Znacka>}
        {i.ocjena ? (
          <Znacka>
            {"★".repeat(i.ocjena)}
            <span className="text-tekst-3">{"★".repeat(5 - i.ocjena)}</span>
          </Znacka>
        ) : null}
      </div>

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <motion.div variants={djeteListe} className="col-span-2 flex items-center gap-4 rounded-2xl border border-rub bg-povrsina-2 p-3">
          <StrelicaVjetra smjer={v?.vjetarSmjer} velicina={58} />
          <div>
            <div className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Vjetar</div>
            <div className="brojke text-[17px] font-semibold">
              {v?.vjetarSmjer != null ? `${smjerVjetra(v.vjetarSmjer)} · ${Math.round(v.vjetarBrzina ?? 0)} km/h` : "–"}
            </div>
            <div className="text-[12.5px] text-tekst-2">
              {v?.temperatura != null ? `${Math.round(v.temperatura)} °C · ` : ""}
              {opisVremena(v?.kod)}
            </div>
          </div>
        </motion.div>
        <Podatak ikona="izlazak" oznaka="Izlazak Sunca" vrijednost={sat(sv.izlazak)} />
        <Podatak ikona="zalazak" oznaka="Zalazak Sunca" vrijednost={sat(sv.zalazak)} />
        <Podatak ikona="mjesec" oznaka="Mjesec" vrijednost={`${Math.round(m.osvjetljenje * 100)} %`} />
        <Podatak ikona="tlak" oznaka="Tlak" vrijednost={v?.tlak ? `${Math.round(v.tlak)} hPa` : "–"} />
      </motion.div>

      <h3 className="mt-6 mb-2.5 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Opažanja</h3>
      {i.opazanja.length ? (
        <div className="grid gap-1.5">
          {i.opazanja.map((o, k) => (
            <div key={k} className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3.5 py-2.5">
              <span className="size-2 rounded-full" style={{ background: bojaVrste(o.vrsta) }} />
              <span className="flex-1 text-[15px]">{o.vrsta}</span>
              <span className="brojke font-semibold">× {o.broj}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-tekst-3">Bez zabilježenih opažanja.</p>
      )}

      {odstrel.length > 0 && (
        <>
          <h3 className="mt-6 mb-2.5 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Odstrel</h3>
          <div className="grid gap-1.5">
            {odstrel.map((o) => (
              <button
                key={o.id}
                onClick={() => otvori({ tip: "detalj-odstrel", id: o.id })}
                className="flex items-center gap-3 rounded-xl border border-rub px-3.5 py-2.5 text-left hover:bg-povrsina-2"
              >
                <span className="grid size-8 place-items-center rounded-lg" style={{ background: `${bojaVrste(o.vrsta)}22`, color: bojaVrste(o.vrsta) }}>
                  <Ikona ime="meta" velicina={16} />
                </span>
                <span className="flex-1 text-[15px]">
                  {o.vrsta} <span className="text-tekst-3">· {nazivSpola(o.vrsta, o.spol)}</span>
                </span>
                <span className="brojke text-sm text-tekst-2">{o.vrijeme}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {(i.pratitelji || i.napomena) && (
        <div className="mt-6 rounded-2xl bg-povrsina-2 p-4 text-[15px] leading-relaxed text-tekst-2">
          {i.pratitelji && (
            <p className="mb-1.5">
              <span className="text-tekst-3">Pratitelji: </span>
              {i.pratitelji}
            </p>
          )}
          {i.napomena}
        </div>
      )}
    </Ploca>
  );
}
