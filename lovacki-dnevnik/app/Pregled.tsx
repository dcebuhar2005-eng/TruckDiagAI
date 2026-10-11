"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { FazaMjeseca, TrakaDana } from "@/components/Nebo";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { StrelicaVjetra } from "@/components/Vjetar";
import { Brojac, Gumb, Znacka, cx, djeteListe, obavijest, roditeljListe, usePotvrda } from "@/components/ui";
import { lovnaGodina, mjesec, mjesecevaVremena, solunar, suncevaVremena } from "@/lib/astro";
import { bojaVrste, nazivSpola, NACINI_LOVA } from "@/lib/katalog";
import { datumDugi, datumKratki, danUTjednu, metri, mnozina, sat, trajanje, trajanjeIzlaska } from "@/lib/format";
import { lovciUBlizini, useDrustvo } from "@/lib/drustvo";
import { ZADANE_POSTAVKE, db, praznaBaza, useBaza } from "@/lib/store";
import type { Baza } from "@/lib/types";
import { nazivLovista, odstrelULovnojGodini, statusDozvole } from "@/lib/upiti";
import { opisVremena, smjerVjetra, trendTlaka, usePrognoza } from "@/lib/vrijeme";

function pozdrav(h: number) {
  if (h < 5) return "Laku noć";
  if (h < 10) return "Dobro jutro";
  if (h < 18) return "Dobar dan";
  return "Dobra večer";
}

export default function Pregled() {
  const baza = useBaza();
  const lok = baza?.postavke.lokacija;
  const prognoza = usePrognoza(lok?.lat, lok?.lng);

  const potvrda = usePotvrda();
  const danas = useMemo(() => new Date(), []);
  const astro = useMemo(() => {
    if (!lok) return null;
    return {
      sv: suncevaVremena(danas, lok.lat, lok.lng),
      mv: mjesecevaVremena(danas, lok.lat, lok.lng),
      m: mjesec(danas),
      sol: solunar(danas, lok.lat, lok.lng),
    };
  }, [danas, lok]);

  if (!baza || !astro) return <Kostur />;

  const lg = lovnaGodina();
  const izlasciLG = baza.izlasci.filter((i) => i.datum >= iso(lg.od) && i.datum <= iso(lg.do));
  const odstrelLG = odstrelULovnojGodini(baza);
  const minuta = izlasciLG.reduce((s, i) => s + (trajanjeIzlaska(i.od, i.do) ?? 0), 0);
  const uspjesni = izlasciLG.filter((i) => baza.odstrel.some((o) => o.izlazakId === i.id)).length;
  const upozorenja = baza.dozvole
    .map((d) => ({ d, s: statusDozvole(d) }))
    .filter((x) => x.s.status === "istice" || x.s.status === "istekla");

  const p = prognoza.podaci;
  const trend = p ? trendTlaka(p) : null;
  const satno = p ? p.satno.filter((s) => s.vrijeme.getTime() > p.dohvaceno - 3600000).slice(0, 12) : [];

  const aktivnost = [
    ...baza.izlasci.map((i) => ({ tip: "izlazak" as const, datum: i.datum, vr: i.od, i })),
    ...baza.odstrel.map((o) => ({ tip: "odstrel" as const, datum: o.datum, vr: o.vrijeme, o })),
  ]
    .sort((a, b) => (b.datum + b.vr).localeCompare(a.datum + a.vr))
    .slice(0, 6);

  const obrisiPrimjere = () =>
    potvrda.pitaj(
      "Obrisati primjere?",
      "Svi podaci u dnevniku (primjeri lovišta, izlazaka, odstrela i dozvola) bit će obrisani. Vaše ime i tema ostaju.",
      () => {
        db.zamijeni({
          ...praznaBaza(),
          postavke: {
            ...ZADANE_POSTAVKE,
            ime: baza.postavke.ime,
            tema: baza.postavke.tema,
            dovrsenUvod: true,
          },
        });
        obavijest("Primjeri su obrisani – dnevnik je prazan");
      },
    );

  return (
    <div>
      <UpozorenjeLovaca />

      {jePrimjer(baza) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-naglasak/40 bg-naglasak-meki p-4 sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-start gap-3">
            <Ikona ime="slojevi" className="mt-0.5 shrink-0 text-naglasak" />
            <div>
              <div className="font-medium">Gledate primjere podataka</div>
              <div className="text-[13.5px] text-tekst-2">
                Lovište Bukovac, izlasci i odstrel su izmišljeni. Kad ste spremni, obrišite ih i počnite s vlastitim dnevnikom.
              </div>
            </div>
          </div>
          <Gumb vrsta="primarni" ikona="smece" onClick={obrisiPrimjere} className="shrink-0">
            Obriši primjere
          </Gumb>
        </motion.div>
      )}

      {/* Zaglavlje */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7 flex flex-wrap items-end gap-4"
      >
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-2 text-[12.5px] font-medium text-tekst-3">
            <span className="capitalize">{danUTjednu(danas)}</span>·<span>{datumDugi(danas)}</span>
          </div>
          <h1 className="font-display text-[32px] leading-tight font-semibold tracking-tight md:text-[42px]">
            {pozdrav(danas.getHours())}, <span className="text-naglasak">{baza.postavke.ime.split(" ")[0] || "lovče"}</span>
          </h1>
          <p className="mt-1.5 text-tekst-2">
            Lovna godina <span className="brojke font-medium text-tekst">{lg.oznaka}</span> · {baza.postavke.lokacijaNaziv ?? "Moja lokacija"}
          </p>
        </div>
        <div className="flex gap-2">
          <BrzaAkcija ikona="dnevnik" oznaka="Izlazak" onClick={() => otvori({ tip: "izlazak" })} />
          <BrzaAkcija ikona="meta" oznaka="Odstrel" primarna onClick={() => otvori({ tip: "odstrel" })} />
        </div>
      </motion.header>

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 lg:grid-cols-3">
        {/* Uvjeti – vrijeme i vjetar */}
        <motion.section variants={djeteListe} className="kartica relative overflow-hidden p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Uvjeti sada</h2>
            {p && (
              <span className="text-[12px] text-tekst-3">
                Ažurirano {sat(new Date(p.dohvaceno))}
              </span>
            )}
          </div>
          {p ? (
            <div className="grid gap-5 md:grid-cols-[auto_1fr]">
              <div className="flex items-center gap-5">
                <StrelicaVjetra smjer={p.trenutno.vjetarSmjer} velicina={112} />
                <div>
                  <div className="brojke font-display text-[44px] leading-none font-semibold">
                    {Math.round(p.trenutno.temperatura ?? 0)}°
                  </div>
                  <div className="mt-1 text-tekst-2">{opisVremena(p.trenutno.kod)}</div>
                  <div className="brojke mt-2 text-[15px] font-medium">
                    Vjetar {smjerVjetra(p.trenutno.vjetarSmjer)} · {Math.round(p.trenutno.vjetarBrzina ?? 0)} km/h
                  </div>
                  <div className="brojke text-[12.5px] text-tekst-3">Udari do {Math.round(p.trenutno.udari ?? 0)} km/h</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 self-center">
                <Mini ikona="tlak" oznaka="Tlak" vrijednost={`${Math.round(p.trenutno.tlak ?? 0)}`} jedinica="hPa" dodatak={trend ? (trend.opis === "raste" ? "↗ raste" : trend.opis === "pada" ? "↘ pada" : "→ stabilan") : undefined} />
                <Mini ikona="kap" oznaka="Vlaga" vrijednost={`${p.trenutno.vlaga ?? "–"}`} jedinica="%" />
                <Mini ikona="oblak" oznaka="Naoblaka" vrijednost={`${p.trenutno.oblacnost ?? "–"}`} jedinica="%" />
              </div>
              {satno.length > 0 && (
                <div className="skriven-klizac -mx-5 overflow-x-auto px-5 md:col-span-2">
                  <div className="flex gap-1.5">
                    {satno.map((s, i) => (
                      <motion.div
                        key={s.vrijeme.getTime()}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.03 }}
                        className={cx(
                          "flex min-w-[62px] flex-col items-center gap-1 rounded-2xl border px-2 py-2.5",
                          i === 0 ? "border-naglasak/40 bg-naglasak-meki" : "border-rub bg-povrsina-2",
                        )}
                      >
                        <span className="brojke text-[11.5px] text-tekst-3">{i === 0 ? "Sada" : sat(s.vrijeme)}</span>
                        <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: `rotate(${(s.vjetarSmjer + 180) % 360}deg)` }} className="text-naglasak">
                          <path d="M12 3l5 14-5-3-5 3z" fill="currentColor" />
                        </svg>
                        <span className="brojke text-[13px] font-semibold">{Math.round(s.vjetarBrzina)}</span>
                        <span className="text-[10.5px] text-tekst-3">{smjerVjetra(s.vjetarSmjer)}</span>
                        <span className="brojke text-[11.5px] text-tekst-2">{Math.round(s.temperatura)}°</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : prognoza.greska ? (
            <div className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-4 text-sm text-tekst-2">
              <Ikona ime="upozorenje" className="text-naglasak" />
              Prognoza trenutno nije dostupna. Provjerite internetsku vezu.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="svjetlucanje h-28 rounded-2xl" />
              <div className="svjetlucanje h-28 rounded-2xl" />
            </div>
          )}
        </motion.section>

        {/* Mjesec i solunar */}
        <motion.section variants={djeteListe} className="kartica p-5">
          <h2 className="mb-4 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Aktivnost divljači</h2>
          <div className="flex items-center gap-4">
            <FazaMjeseca faza={astro.m.faza} velicina={72} />
            <div>
              <div className="font-medium">{astro.m.naziv}</div>
              <div className="brojke text-[13px] text-tekst-2">Osvijetljenost {Math.round(astro.m.osvjetljenje * 100)} %</div>
              <div className="brojke text-[12.5px] text-tekst-3">
                Izlazi {sat(astro.mv.izlazak)} · zalazi {sat(astro.mv.zalazak)}
              </div>
            </div>
          </div>
          {astro.m.osvjetljenje < 0.06 && (
            <p className="mt-3 text-[12.5px] text-tekst-3">
              Mlađak: Mjesec izlazi i zalazi blizu Sunca, pa se danju ne vidi, a noć je potpuno tamna.
            </p>
          )}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-povrsina-2 p-3.5">
            <div>
              <div className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Solunarna ocjena</div>
              <div className="font-medium">{astro.sol.opis}</div>
            </div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.07, type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Ikona ime="zvijezda" velicina={18} className={i <= astro.sol.ocjena ? "text-naglasak" : "text-tekst-3/50"} fill={i <= astro.sol.ocjena ? "currentColor" : "none"} />
                </motion.span>
              ))}
            </div>
          </div>
          <ul className="mt-3 grid gap-1.5">
            {astro.sol.razdoblja.map((r, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[13.5px]">
                <span className={cx("h-2 w-5 rounded-full", r.vrsta === "glavno" ? "bg-naglasak" : "bg-naglasak/45")} />
                <span className="brojke font-medium">
                  {sat(r.od)}–{sat(r.do)}
                </span>
                <span className="truncate text-tekst-3">{r.povod}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Sunce */}
        <motion.section variants={djeteListe} className="kartica p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <h2 className="mr-auto text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Svjetlo danas</h2>
            <Vrijeme oznaka="Zora" v={sat(astro.sv.zora)} />
            <Vrijeme oznaka="Izlazak" v={sat(astro.sv.izlazak)} naglaseno />
            <Vrijeme oznaka="Zalazak" v={sat(astro.sv.zalazak)} naglaseno />
            <Vrijeme oznaka="Sumrak" v={sat(astro.sv.sumrak)} />
            <Vrijeme oznaka="Dan" v={trajanje(astro.sv.duljinaDana)} />
          </div>
          <TrakaDana sv={astro.sv} razdoblja={astro.sol.razdoblja} datum={danas} />
          <p className="mt-3 text-[12px] text-tekst-3">
            Žuti stupci označavaju glavna (viša) i sporedna solunarna razdoblja. Zora i sumrak su građanski (Sunce 6° ispod obzora).
          </p>
        </motion.section>

        {/* Statistika lovne godine */}
        <motion.section variants={djeteListe} className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-3">
          <Plocica ikona="dnevnik" oznaka="Izlazaka" vrijednost={izlasciLG.length} href="/dnevnik" />
          <Plocica ikona="meta" oznaka="Odstrijeljeno" vrijednost={odstrelLG.length} href="/dnevnik?prikaz=odstrel" naglasena />
          <Plocica ikona="sat" oznaka="Sati u lovištu" vrijednost={Math.round(minuta / 6) / 10} decimale={1} href="/statistika" />
          <Plocica ikona="trofej" oznaka="Uspješnost" vrijednost={izlasciLG.length ? Math.round((uspjesni / izlasciLG.length) * 100) : 0} sufiks="%" href="/statistika" />
        </motion.section>

        {/* Upozorenja */}
        {upozorenja.length > 0 && (
          <motion.section variants={djeteListe} className="kartica border-naglasak/30 p-5 lg:col-span-1">
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-[0.12em] text-naglasak uppercase">
              <Ikona ime="upozorenje" velicina={15} /> Dokumenti
            </h2>
            <div className="grid gap-2">
              {upozorenja.map(({ d, s }) => (
                <Link key={d.id} href="/dozvole" transitionTypes={["naprijed"]} className="flex items-center gap-3 rounded-xl bg-povrsina-2 p-3 hover:bg-povrsina-3">
                  <span className={cx("size-2 rounded-full", s.status === "istekla" ? "bg-opasnost" : "bg-naglasak")} />
                  <span className="flex-1 truncate text-[14px]">{d.naziv}</span>
                  <span className={cx("brojke text-[12.5px] font-medium", s.status === "istekla" ? "text-opasnost" : "text-naglasak")}>
                    {s.status === "istekla" ? "istekla" : `još ${s.dana} ${mnozina(s.dana!, "dan", "dana", "dana")}`}
                  </span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Nedavno */}
        <motion.section variants={djeteListe} className={cx("kartica p-5", upozorenja.length ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="mb-3 flex items-center">
            <h2 className="flex-1 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Nedavno</h2>
            <Link href="/dnevnik" transitionTypes={["naprijed"]} className="flex items-center gap-1 text-[13px] font-medium text-naglasak">
              Dnevnik <Ikona ime="desno" velicina={15} />
            </Link>
          </div>
          {aktivnost.length ? (
            <ol className="relative grid gap-1">
              <span className="absolute top-3 bottom-3 left-[19px] w-px bg-rub" />
              {aktivnost.map((a) =>
                a.tip === "izlazak" ? (
                  <li key={a.i.id}>
                    <button onClick={() => otvori({ tip: "detalj-izlazak", id: a.i.id })} className="relative flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-povrsina-2">
                      <span className="relative grid size-6 shrink-0 place-items-center rounded-full border border-rub-jaki bg-povrsina ml-2">
                        <span className="size-2 rounded-full bg-mahovina" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px]">
                          {NACINI_LOVA[a.i.nacin]}
                          {a.i.lovisteId ? ` · ${nazivLovista(baza, a.i.lovisteId)}` : ""}
                        </span>
                        <span className="block text-[12.5px] text-tekst-3">
                          {a.i.opazanja.reduce((s, o) => s + o.broj, 0)} opaženih grla
                        </span>
                      </span>
                      <span className="brojke shrink-0 text-[12.5px] text-tekst-3">{datumKratki(a.datum)}</span>
                    </button>
                  </li>
                ) : (
                  <li key={a.o.id}>
                    <button onClick={() => otvori({ tip: "detalj-odstrel", id: a.o.id })} className="relative flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-povrsina-2">
                      <span className="relative ml-2 grid size-6 shrink-0 place-items-center rounded-full" style={{ background: `${bojaVrste(a.o.vrsta)}30`, color: bojaVrste(a.o.vrsta) }}>
                        <Ikona ime="meta" velicina={13} debljina={2.2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium">{a.o.vrsta}</span>
                        <span className="block text-[12.5px] text-tekst-3">
                          {nazivSpola(a.o.vrsta, a.o.spol)}
                          {a.o.masa ? ` · ${a.o.masa} kg` : ""}
                        </span>
                      </span>
                      <span className="brojke shrink-0 text-[12.5px] text-tekst-3">{datumKratki(a.datum)}</span>
                    </button>
                  </li>
                ),
              )}
            </ol>
          ) : (
            <div className="rounded-2xl bg-povrsina-2 p-6 text-center text-sm text-tekst-2">
              Dnevnik je prazan. Zabilježite prvi izlazak u lovište.
              <div className="mt-3 flex justify-center gap-2">
                <Znacka>Savjet: dodajte lovište i čeke na karti</Znacka>
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>
      {potvrda.element}
    </div>
  );
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function BrzaAkcija({ ikona, oznaka, onClick, primarna }: { ikona: ImeIkone; oznaka: string; onClick: () => void; primarna?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cx(
        "flex h-12 items-center gap-2 rounded-2xl px-4 text-[14.5px] font-medium",
        primarna ? "bg-naglasak text-[#17130a] shadow-[0_10px_30px_-12px_var(--naglasak)]" : "border border-rub bg-povrsina",
      )}
    >
      <span className={cx("grid size-6 place-items-center rounded-lg", primarna ? "bg-black/10" : "bg-povrsina-3")}>
        <Ikona ime="plus" velicina={15} debljina={2.4} />
      </span>
      <Ikona ime={ikona} velicina={17} className="hidden sm:block" />
      {oznaka}
    </motion.button>
  );
}

function Mini({ ikona, oznaka, vrijednost, jedinica, dodatak }: { ikona: ImeIkone; oznaka: string; vrijednost: string; jedinica: string; dodatak?: string }) {
  return (
    <div className="rounded-2xl border border-rub bg-povrsina-2 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-tekst-3 uppercase">
        <Ikona ime={ikona} velicina={12} />
        {oznaka}
      </div>
      <div className="brojke mt-1 text-[19px] font-semibold">
        {vrijednost}
        <span className="ml-0.5 text-[12px] font-normal text-tekst-3">{jedinica}</span>
      </div>
      {dodatak && <div className="text-[11.5px] text-tekst-2">{dodatak}</div>}
    </div>
  );
}

function Vrijeme({ oznaka, v, naglaseno }: { oznaka: string; v: string; naglaseno?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-wide text-tekst-3 uppercase">{oznaka}</div>
      <div className={cx("brojke font-semibold", naglaseno ? "text-[18px] text-naglasak" : "text-[16px]")}>{v}</div>
    </div>
  );
}

function Plocica({
  ikona,
  oznaka,
  vrijednost,
  href,
  decimale = 0,
  sufiks,
  naglasena,
}: {
  ikona: ImeIkone;
  oznaka: string;
  vrijednost: number;
  href: string;
  decimale?: number;
  sufiks?: string;
  naglasena?: boolean;
}) {
  return (
    <Link href={href} transitionTypes={["naprijed"]}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cx("kartica group relative h-full overflow-hidden p-4", naglasena && "border-naglasak/30")}
      >
        {naglasena && <div className="absolute -top-10 -right-10 size-28 rounded-full bg-naglasak opacity-10 blur-2xl" />}
        <div className="flex items-center justify-between text-tekst-3">
          <Ikona ime={ikona} velicina={18} className={naglasena ? "text-naglasak" : undefined} />
          <Ikona ime="desno" velicina={15} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-3 font-display text-[34px] leading-none font-semibold">
          <Brojac vrijednost={vrijednost} decimale={decimale} />
          {sufiks && <span className="text-[20px] text-tekst-2">{sufiks}</span>}
        </div>
        <div className="mt-1.5 text-[13px] text-tekst-2">{oznaka}</div>
      </motion.div>
    </Link>
  );
}

/** Primjeri iz uvoda – zastavica ili prepoznatljivo izmišljeno lovište. */
function jePrimjer(b: Baza) {
  return !!b.postavke.primjer || b.lovista.some((l) => l.naziv === "Bukovac" && l.broj === "VII/118");
}

function UpozorenjeLovaca() {
  const d = useDrustvo();
  const blizu = lovciUBlizini(d);
  const uLovu = d.lokacije.length;
  if (!blizu.length && !uLovu && !d.dijelim) return null;
  return (
    <Link href="/lovci" transitionTypes={["naprijed"]} className="mb-5 block">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cx(
          "flex items-center gap-3 rounded-2xl border p-3.5",
          blizu.length ? "border-opasnost/50 bg-opasnost-meka" : "border-mahovina/40 bg-mahovina-meka",
        )}
      >
        <Ikona ime={blizu.length ? "upozorenje" : "korisnik"} className={blizu.length ? "text-opasnost" : "text-mahovina"} />
        <span className="flex-1 text-[14px]">
          {blizu.length
            ? `Lovac u blizini: ${blizu.map((l) => `${l.profil.ime} (${metri(l.udaljenost)})`).join(", ")}`
            : `${d.dijelim ? "Dijelite lokaciju. " : ""}${uLovu ? `U lovu: ${d.lokacije.map((l) => l.profil.ime).join(", ")}` : ""}`}
        </span>
        <Ikona ime="desno" velicina={16} className="text-tekst-3" />
      </motion.div>
    </Link>
  );
}
