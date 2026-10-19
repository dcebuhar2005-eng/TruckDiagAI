"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import Ikona from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { Brojac, Gumb, Naslov, PraznoStanje, Segmenti, cx, djeteListe, roditeljListe } from "@/components/ui";
import { lovnaGodina } from "@/lib/astro";
import { NACINI_LOVA, RADOVI, SKUPINE, TIPOVI_TOCAKA, bojaVrste, nazivSpola, vrsta as nadiVrstu, type Skupina } from "@/lib/katalog";
import { MJESECI_KRATKO, datumKratki, izIso, mnozina, trajanjeIzlaska } from "@/lib/format";
import { useBaza } from "@/lib/store";
import type { Baza, VrstaLova, VrstaRada } from "@/lib/types";
import { danaOd, jeLov, mojOdstrel, nazivLovista, opisDana, zadnjeDopune } from "@/lib/upiti";
import { imaTip } from "@/lib/vjetarCeke";

const SMJEROVI8 = ["S", "SI", "I", "JI", "J", "JZ", "Z", "SZ"];
// Mjeseci lovne godine: travanj → ožujak
const REDOSLIJED = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];

function izvoziCsv(baza: Baza) {
  const zaglavlje = ["Datum", "Vrijeme", "Vrsta", "Spol", "Dob", "Masa (kg)", "Trofej (CIC)", "Opis trofeja", "Lovište", "Markica", "Oružje", "Kalibar", "Udaljenost (m)", "Geo. širina", "Geo. dužina", "Napomena"];
  const redovi = baza.odstrel.filter(mojOdstrel).map((o) => [
    o.datum, o.vrijeme, o.vrsta, nazivSpola(o.vrsta, o.spol), o.dob, o.masa, o.trofejCic, o.trofejOpis,
    nazivLovista(baza, o.lovisteId), o.markica, o.oruzje, o.kalibar, o.udaljenost, o.lat, o.lng, o.napomena,
  ]);
  const csv = [zaglavlje, ...redovi]
    .map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `odstrel-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Statistika() {
  const baza = useBaza();
  const godine = useMemo(() => {
    if (!baza) return [];
    const s = new Set<number>([lovnaGodina().pocetna]);
    [...baza.izlasci, ...baza.odstrel].forEach((x) => s.add(lovnaGodina(izIso(x.datum)).pocetna));
    return [...s].sort((a, b) => b - a).slice(0, 4);
  }, [baza]);
  const [godina, setGodina] = useState<string>("sve");

  const p = useMemo(() => {
    if (!baza) return null;
    const uGodini = (datum: string) => godina === "sve" || lovnaGodina(izIso(datum)).pocetna === Number(godina);
    const sviIzlasci = baza.izlasci.filter((i) => uGodini(i.datum));
    // Obilasci (prihrana, solišta) ulaze u sate i radove, ali ne u izlaske i uspješnost.
    const izlasci = sviIzlasci.filter(jeLov);
    const obilazaka = sviIzlasci.length - izlasci.length;
    const odstrel = baza.odstrel.filter((o) => uGodini(o.datum) && mojOdstrel(o));
    const minuta = sviIzlasci.reduce((s, i) => s + (trajanjeIzlaska(i.od, i.do) ?? 0), 0);
    const masa = odstrel.reduce((s, o) => s + (o.masa ?? 0), 0);

    const poMjesecu = REDOSLIJED.map((m) => ({
      m,
      izlasci: izlasci.filter((i) => izIso(i.datum).getMonth() === m).length,
      odstrel: odstrel.filter((o) => izIso(o.datum).getMonth() === m).length,
    }));

    const poVrsti = Object.entries(
      odstrel.reduce<Record<string, number>>((a, o) => ({ ...a, [o.vrsta]: (a[o.vrsta] ?? 0) + 1 }), {}),
    ).sort((a, b) => b[1] - a[1]);

    const poSatu = Array.from({ length: 24 }, (_, h) => odstrel.filter((o) => Number(o.vrijeme.split(":")[0]) === h).length);

    const ruza = SMJEROVI8.map((_, k) => {
      const svi = izlasci.filter((i) => i.vrijeme?.vjetarSmjer != null && Math.round(i.vrijeme.vjetarSmjer / 45) % 8 === k);
      return { svi: svi.length, uspjesni: svi.filter((i) => baza.odstrel.some((o) => o.izlazakId === i.id && mojOdstrel(o))).length };
    });

    const poNacinu = (Object.keys(NACINI_LOVA) as VrstaLova[])
      .filter((n) => n !== "obilazak")
      .map((n) => {
        const s = izlasci.filter((i) => i.nacin === n);
        const u = s.filter((i) => baza.odstrel.some((o) => o.izlazakId === i.id && mojOdstrel(o))).length;
        return { n, ukupno: s.length, uspjesni: u };
      })
      .filter((x) => x.ukupno > 0)
      .sort((a, b) => b.ukupno - a.ukupno);

    const trofeji = [...odstrel].filter((o) => o.trofejCic).sort((a, b) => b.trofejCic! - a.trofejCic!).slice(0, 5);
    const skupine = [...new Set(poVrsti.map(([v]) => nadiVrstu(v)?.skupina).filter(Boolean))] as Skupina[];
    // Prihrana i solišta: ukupne količine u razdoblju i zadnja dopuna svake točke (bez obzira na razdoblje).
    const radovi = (Object.keys(RADOVI) as VrstaRada[]).map((v) => ({
      v,
      kolicina: sviIzlasci.reduce((s, i) => s + (i.radovi ?? []).filter((r) => r.vrsta === v).reduce((a, r) => a + (r.kolicina ?? 0), 0), 0),
      puta: sviIzlasci.filter((i) => i.radovi?.some((r) => r.vrsta === v)).length,
    }));
    const dopune = zadnjeDopune(baza);
    const mjesta = baza.tocke
      .filter((t) => imaTip(t, "hraniliste") || imaTip(t, "soliste") || imaTip(t, "pojiliste"))
      .map((t) => ({ t, z: dopune.get(t.id) }))
      .sort((a, b) => (a.z?.datum ?? "").localeCompare(b.z?.datum ?? ""));
    return { izlasci, sviIzlasci, obilazaka, odstrel, minuta, masa, poMjesecu, poVrsti, poSatu, ruza, poNacinu, trofeji, skupine, radovi, mjesta };
  }, [baza, godina]);

  if (!baza || !p) return <Kostur />;

  const imaPodataka = baza.izlasci.length + baza.odstrel.length > 0;

  return (
    <div>
      <Naslov
        natpis="Analiza"
        naslov="Statistika"
        opis="Uzorci aktivnosti, uspješnosti i odstrela kroz lovne godine (1. travnja – 31. ožujka)."
        akcija={
          imaPodataka ? (
            <div className="bez-ispisa flex gap-2">
              <Gumb ikona="preuzmi" onClick={() => izvoziCsv(baza)}>
                CSV
              </Gumb>
              <Gumb ikona="ispis" onClick={() => window.print()}>
                Ispis
              </Gumb>
            </div>
          ) : undefined
        }
      />

      {!imaPodataka ? (
        <PraznoStanje
          ikona="statistika"
          naslov="Nema podataka za analizu"
          opis="Statistika se gradi iz izlazaka i odstrela. Zabilježite prvi izlazak."
          akcija={<Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "izlazak" })}>Novi izlazak</Gumb>}
        />
      ) : (
        <>
          <Segmenti
            className="bez-ispisa mb-6 w-full md:w-auto md:max-w-xl"
            vrijednost={godina}
            promjena={setGodina}
            opcije={[
              { vrijednost: "sve", oznaka: "Sve" },
              ...godine.map((g) => ({ vrijednost: String(g), oznaka: `${g}./${String(g + 1).slice(2)}.` })),
            ]}
          />

          <AnimatePresence mode="wait">
            <motion.div key={godina} variants={roditeljListe} initial="skriveno" animate="vidljivo" exit={{ opacity: 0, transition: { duration: 0.15 } }} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <Plocica oznaka="Izlazaka u lov" v={p.izlasci.length} pod={p.obilazaka ? `+ ${p.obilazaka} ${mnozina(p.obilazaka, "obilazak", "obilaska", "obilazaka")} (prihrana)` : undefined} />
              <Plocica oznaka="Odstrijeljeno grla" v={p.odstrel.length} />
              <Plocica oznaka="Sati u lovištu" v={Math.round(p.minuta / 6) / 10} dec={1} />
              <Plocica oznaka="Ukupna masa" v={p.masa} jed="kg" />
              <Plocica oznaka="Uspješnost izlazaka" v={p.izlasci.length ? Math.round((p.izlasci.filter((i) => p.odstrel.some((o) => o.izlazakId === i.id)).length / p.izlasci.length) * 100) : 0} jed="%" />
              <Plocica oznaka="Opaženih grla" v={p.sviIzlasci.reduce((s, i) => s + i.opazanja.reduce((a, o) => a + o.broj, 0), 0)} />

              <Okvir naslov="Izlasci po mjesecima" opis="Broj izlazaka u lovište" sirina="xl:col-span-3">
                <Stupci podaci={p.poMjesecu.map((x) => ({ oznaka: MJESECI_KRATKO[x.m], v: x.izlasci }))} boja="var(--mahovina)" jedinica="izlazaka" />
              </Okvir>
              <Okvir naslov="Odstrel po mjesecima" opis="Broj odstrijeljenih grla" sirina="xl:col-span-3">
                <Stupci podaci={p.poMjesecu.map((x) => ({ oznaka: MJESECI_KRATKO[x.m], v: x.odstrel }))} boja="var(--naglasak)" jedinica="grla" />
              </Okvir>

              <Okvir naslov="Odstrel po vrstama" sirina="xl:col-span-3 md:col-span-2">
                {p.poVrsti.length ? (
                  <>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
                      {p.skupine.map((s) => (
                        <span key={s} className="flex items-center gap-1.5 text-[12.5px] text-tekst-2">
                          <span className="size-2.5 rounded-sm" style={{ background: SKUPINE[s].boja }} />
                          {SKUPINE[s].naziv}
                        </span>
                      ))}
                    </div>
                    <div className="grid gap-2.5">
                      {p.poVrsti.map(([v, n], i) => (
                        <div key={v} className="group flex items-center gap-3" title={`${v}: ${n}`}>
                          <span className="w-32 shrink-0 truncate text-[13.5px] text-tekst-2 group-hover:text-tekst sm:w-40">{v}</span>
                          <div className="h-3 flex-1">
                            <motion.div
                              className="h-full rounded-r-[4px]"
                              style={{ background: bojaVrste(v) }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(n / p.poVrsti[0][1]) * 100}%` }}
                              transition={{ delay: 0.15 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <span className="brojke w-7 text-right text-[14px] font-semibold">{n}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Prazno />
                )}
              </Okvir>

              <Okvir naslov="Vjetar pri izlascima" opis="Smjer odakle je puhao; ispunjeno = izlazak s odstrelom" sirina="xl:col-span-3">
                <RuzaVjetrova ruza={p.ruza} />
              </Okvir>

              <Okvir naslov="Doba dana odstrela" opis="Broj grla po satu" sirina="xl:col-span-3">
                <Stupci podaci={p.poSatu.map((v, h) => ({ oznaka: h % 3 === 0 ? `${h}h` : "", puna: `${String(h).padStart(2, "0")}:00–${String(h).padStart(2, "0")}:59`, v }))} boja="var(--naglasak)" jedinica="grla" uski />
              </Okvir>

              <Okvir naslov="Uspješnost po načinu lova" sirina="xl:col-span-3">
                {p.poNacinu.length ? (
                  <div className="grid gap-3">
                    {p.poNacinu.map((x, i) => {
                      const post = Math.round((x.uspjesni / x.ukupno) * 100);
                      return (
                        <div key={x.n}>
                          <div className="mb-1 flex justify-between text-[13.5px]">
                            <span>{NACINI_LOVA[x.n]}</span>
                            <span className="brojke text-tekst-2">
                              <span className="font-semibold text-tekst">{post} %</span> · {x.uspjesni}/{x.ukupno}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-povrsina-2">
                            <motion.div
                              className="h-full rounded-full bg-mahovina"
                              initial={{ width: 0 }}
                              animate={{ width: `${post}%` }}
                              transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Prazno />
                )}
              </Okvir>

              <Okvir naslov="Prihrana i solišta" opis="Iz izlazaka; mjesta poredana od najduže nedopunjenog" sirina="xl:col-span-6 md:col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  {p.radovi.map((r) => (
                    <div key={r.v} className="rounded-2xl bg-povrsina-2 p-3">
                      <div className="font-display text-[24px] leading-none font-semibold">
                        <Brojac vrijednost={r.kolicina} />
                        <span className="ml-1 text-[14px] text-tekst-3">{RADOVI[r.v].jedinica}</span>
                      </div>
                      <div className="mt-1.5 text-[12.5px] text-tekst-2">{RADOVI[r.v].naziv}</div>
                      <div className="text-[11.5px] text-tekst-3">{r.puta}× u razdoblju</div>
                    </div>
                  ))}
                </div>
                {p.mjesta.length ? (
                  <div className="mt-3 grid gap-1.5">
                    {p.mjesta.map(({ t, z }) => {
                      const n = z ? danaOd(z.datum) : null;
                      return (
                        <button key={t.id} onClick={() => otvori({ tip: "tocka", id: t.id })} className="flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-povrsina-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[12.5px] font-bold text-black/75" style={{ background: TIPOVI_TOCAKA[t.tip].boja }}>
                            {TIPOVI_TOCAKA[t.tip].slovo}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium">{t.naziv}</span>
                            <span className="block truncate text-[12px] text-tekst-3">{nazivLovista(baza, t.lovisteId) ?? TIPOVI_TOCAKA[t.tip].naziv}</span>
                          </span>
                          <span className={cx("shrink-0 text-right text-[12.5px]", n == null || n > 14 ? "text-opasnost" : "text-tekst-2")}>
                            {z ? (
                              <>
                                {opisDana(n!)}
                                {z.kolicina ? <span className="block text-tekst-3">{z.kolicina} {RADOVI[z.vrsta].jedinica}</span> : null}
                              </>
                            ) : (
                              "nije dopunjeno"
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-tekst-3">Dodajte hranilišta i solišta na karti (Točka → Hranilište / Solište), pa ih označite u izlasku.</p>
                )}
              </Okvir>

              <Okvir naslov="Najbolji trofeji" sirina="xl:col-span-6 md:col-span-2">
                {p.trofeji.length ? (
                  <div className="overflow-x-auto" tabIndex={0}>
                    <table className="w-full text-left text-[14px]">
                      <thead className="text-[11.5px] tracking-wide text-tekst-3 uppercase">
                        <tr>
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Vrsta</th>
                          <th className="pb-2 font-medium">Opis</th>
                          <th className="pb-2 font-medium">Lovište</th>
                          <th className="pb-2 font-medium">Datum</th>
                          <th className="pb-2 text-right font-medium">CIC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.trofeji.map((o, i) => (
                          <tr key={o.id} onClick={() => otvori({ tip: "detalj-odstrel", id: o.id })} className="cursor-pointer border-t border-rub hover:bg-povrsina-2">
                            <td className="py-2.5 pr-3">
                              <span className={cx("grid size-6 place-items-center rounded-full text-[12px] font-bold", i === 0 ? "bg-naglasak text-[#17130a]" : "bg-povrsina-3 text-tekst-2")}>{i + 1}</span>
                            </td>
                            <td className="py-2.5 pr-3 font-medium">{o.vrsta}</td>
                            <td className="py-2.5 pr-3 text-tekst-2">{o.trofejOpis ?? nazivSpola(o.vrsta, o.spol)}</td>
                            <td className="py-2.5 pr-3 text-tekst-2">{nazivLovista(baza, o.lovisteId) ?? "–"}</td>
                            <td className="brojke py-2.5 pr-3 text-tekst-2">{datumKratki(o.datum)} {izIso(o.datum).getFullYear()}.</td>
                            <td className="brojke py-2.5 text-right font-semibold">{o.trofejCic!.toLocaleString("hr-HR", { minimumFractionDigits: 1 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-tekst-3">Upišite CIC ocjenu trofeja kod odstrela krupne divljači.</p>
                )}
              </Okvir>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function Prazno() {
  return <p className="py-6 text-center text-sm text-tekst-3">Nema podataka za odabrano razdoblje.</p>;
}

function Plocica({ oznaka, v, dec = 0, jed, pod }: { oznaka: string; v: number; dec?: number; jed?: string; pod?: string }) {
  return (
    <motion.div variants={djeteListe} className="kartica p-4 xl:col-span-1">
      <div className="font-display text-[30px] leading-none font-semibold">
        <Brojac vrijednost={v} decimale={dec} />
        {jed && <span className="ml-1 text-[16px] text-tekst-3">{jed}</span>}
      </div>
      <div className="mt-2 text-[12.5px] text-tekst-2">{oznaka}</div>
      {pod && <div className="mt-0.5 text-[11.5px] text-tekst-3">{pod}</div>}
    </motion.div>
  );
}

function Okvir({ naslov, opis, children, sirina }: { naslov: string; opis?: string; children: ReactNode; sirina?: string }) {
  return (
    <motion.section variants={djeteListe} className={cx("kartica p-5", sirina)}>
      <h2 className="font-display text-[18px] font-semibold">{naslov}</h2>
      {opis && <p className="text-[12.5px] text-tekst-3">{opis}</p>}
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function Stupci({
  podaci,
  boja,
  jedinica,
  uski,
}: {
  podaci: { oznaka: string; puna?: string; v: number }[];
  boja: string;
  jedinica: string;
  uski?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maks = Math.max(1, ...podaci.map((d) => d.v));
  const najveci = podaci.findIndex((d) => d.v === maks && d.v > 0);
  return (
    <div>
      <div className="relative flex h-40 items-end gap-[2px] border-b border-rub" onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map((r) => (
          <div key={r} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-rub" style={{ bottom: `${r * 100}%` }}>
            <span className="brojke absolute -top-2.5 right-0 bg-povrsina pl-1 text-[10.5px] text-tekst-3">{Math.round(maks * r)}</span>
          </div>
        ))}
        {podaci.map((d, i) => (
          <div
            key={i}
            className="relative flex h-full flex-1 cursor-default items-end justify-center"
            onMouseEnter={() => setHover(i)}
            onTouchStart={() => setHover(i)}
          >
            <motion.div
              className={cx("rounded-t-[4px]", uski ? "w-full max-w-[14px]" : "w-full max-w-[28px]")}
              style={{ background: boja, opacity: hover == null || hover === i ? 1 : 0.45 }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.v / maks) * 100}%` }}
              transition={{ delay: 0.1 + i * 0.025, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            {(hover === i || (hover == null && i === najveci)) && d.v > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="brojke pointer-events-none absolute z-10 rounded-lg border border-rub bg-povrsina px-2 py-1 text-center text-[12px] whitespace-nowrap shadow-meka"
                style={{ bottom: `calc(${(d.v / maks) * 100}% + 6px)` }}
              >
                {hover === i && <div className="text-[10.5px] text-tekst-3">{d.puna ?? d.oznaka}</div>}
                <span className="font-semibold">{d.v}</span> <span className="text-tekst-3">{jedinica}</span>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {podaci.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10.5px] text-tekst-3">
            {d.oznaka}
          </span>
        ))}
      </div>
    </div>
  );
}

function RuzaVjetrova({ ruza }: { ruza: { svi: number; uspjesni: number }[] }) {
  const maks = Math.max(1, ...ruza.map((r) => r.svi));
  const [hover, setHover] = useState<number | null>(null);
  const isjecak = (k: number, udio: number) => {
    const r = 12 + udio * 72;
    const a1 = ((k * 45 - 19) * Math.PI) / 180;
    const a2 = ((k * 45 + 19) * Math.PI) / 180;
    const t = (a: number, rr: number) => `${100 + rr * Math.sin(a)},${100 - rr * Math.cos(a)}`;
    return `M${t(a1, 12)} L${t(a1, r)} A${r},${r} 0 0 1 ${t(a2, r)} L${t(a2, 12)} A12,12 0 0 0 ${t(a1, 12)}Z`;
  };
  const ukupno = ruza.reduce((s, r) => s + r.svi, 0);
  if (!ukupno) return <Prazno />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 200 200" className="w-full max-w-[240px]" onMouseLeave={() => setHover(null)}>
        {[0.33, 0.66, 1].map((r) => (
          <circle key={r} cx="100" cy="100" r={12 + r * 72} fill="none" stroke="var(--rub-jaki)" strokeDasharray="2 3" />
        ))}
        {ruza.map((r, k) => (
          <g key={k} onMouseEnter={() => setHover(k)} style={{ opacity: hover == null || hover === k ? 1 : 0.4, transition: "opacity .2s" }}>
            <motion.path
              d={isjecak(k, r.svi / maks)}
              fill="var(--naglasak)"
              fillOpacity={0.25}
              stroke="var(--naglasak)"
              strokeWidth={1}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ transformOrigin: "100px 100px" }}
              transition={{ delay: 0.15 + k * 0.05, type: "spring", stiffness: 120, damping: 14 }}
            />
            {r.uspjesni > 0 && (
              <motion.path
                d={isjecak(k, r.uspjesni / maks)}
                fill="var(--naglasak)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ transformOrigin: "100px 100px" }}
                transition={{ delay: 0.15 + k * 0.03, type: "spring", stiffness: 120, damping: 14 }}
              />
            )}
            <text
              x={100 + 94 * Math.sin((k * 45 * Math.PI) / 180)}
              y={104 - 94 * Math.cos((k * 45 * Math.PI) / 180)}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="var(--tekst-2)"
            >
              {SMJEROVI8[k]}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid w-full grid-cols-2 gap-1.5 text-[13px] sm:w-44 sm:grid-cols-1">
        {ruza.map((r, k) => (
          <div
            key={k}
            onMouseEnter={() => setHover(k)}
            onMouseLeave={() => setHover(null)}
            className={cx("flex justify-between rounded-lg px-2 py-1", hover === k && "bg-povrsina-2")}
          >
            <span className="text-tekst-2">Iz {SMJEROVI8[k]}</span>
            <span className="brojke">
              <span className="font-semibold">{r.uspjesni}</span>
              <span className="text-tekst-3">/{r.svi}</span>
            </span>
          </div>
        ))}
        <div className="col-span-2 mt-1 flex items-center gap-1.5 text-[11.5px] text-tekst-3 sm:col-span-1">
          <Ikona ime="vjetar" velicina={13} /> s odstrelom / ukupno
        </div>
      </div>
    </div>
  );
}
