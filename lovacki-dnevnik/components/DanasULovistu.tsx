"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Ikona from "./Ikona";
import { IZGLED, nazivDana } from "./KadULov";
import { FazaMjeseca } from "./Nebo";
import { cx, djeteListe } from "./ui";
import { mjesec, mjesecevaVremena, solunar, suncevaVremena } from "@/lib/astro";
import { danUTjednu, isoDatum, sat } from "@/lib/format";
import { izgledLova, najboljiTermin, type DanLova, type Termin } from "@/lib/izgledLova";
import { NACINI_LOVA, nazivSpola } from "@/lib/katalog";
import { aktivniLov } from "@/lib/lov";
import type { Baza, Tocka } from "@/lib/types";
import { danaOd, iskoristenostKvote, statusDozvole, zadnjeDopune } from "@/lib/upiti";
import { imaTip, ocjenaVjetra, tockaZaVjetar } from "@/lib/vjetarCeke";
import { beaufort, smjerVjetra, type Prognoza } from "@/lib/vrijeme";

/**
 * Početak Pregleda: kartica „Sada” (kad krenuti i na koju čeku), tijek današnjeg dana
 * i pločice (vjetar, tjedan, plan odstrela, Mjesec, hranilište).
 */

type Odabrani = { dan: DanLova; dio: "jutro" | "vecer"; t: Termin };

function useSada() {
  const [sada, setSada] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSada(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return sada;
}

/** Čeka kojoj odgovara vjetar u terminu. */
const cekaZa = (baza: Baza, t: Termin): Tocka | undefined =>
  baza.tocke.filter(tockaZaVjetar).find((c) => ocjenaVjetra(c, t.vjetarSmjer, t.vjetarBrzina) === "dobar");

function trajanjeKratko(ms: number) {
  const min = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(min / 60);
  return h ? `${h} h${min % 60 ? ` ${min % 60} min` : ""}` : `${min} min`;
}

/** „Večeras”, „sutra ujutro”, „petak navečer”… */
function kadJe(o: Odabrani) {
  const dan = nazivDana(o.dan.datum, true).toLowerCase();
  if (dan === "danas") return o.dio === "jutro" ? "jutros" : "večeras";
  return `${dan} ${o.dio === "jutro" ? "ujutro" : "navečer"}`;
}

function sljedeciTermin(dani: DanLova[], sada: number): Odabrani | null {
  for (const dan of dani)
    for (const dio of ["jutro", "vecer"] as const) {
      const t = dan[dio];
      if (t && t.do.getTime() > sada) return { dan, dio, t };
    }
  return null;
}

const veliko = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function DanasULovistu({ baza, p, lat, lng }: { baza: Baza; p: Prognoza | null; lat: number; lng: number }) {
  const sada = useSada();
  const dani = useMemo(() => (p ? izgledLova(p.satno, lat, lng) : []), [p, lat, lng]);
  const naj = useMemo(() => najboljiTermin(dani), [dani]);
  const sljedeci = sljedeciTermin(dani, sada);

  return (
    <>
      <motion.div variants={djeteListe} className="lg:col-span-3">
        {aktivniLov(baza) || !sljedeci ? <KreniULovKartica baza={baza} /> : <SadaKartica baza={baza} o={sljedeci} naj={naj} sada={sada} />}
      </motion.div>
      <motion.section variants={djeteListe} className="kartica p-5 lg:col-span-2">
        <TijekDana baza={baza} dani={dani} naj={naj} sada={sada} lat={lat} lng={lng} />
      </motion.section>
      <motion.section variants={djeteListe} className="grid grid-cols-2 content-start gap-3 lg:col-span-1 [&>*:last-child:nth-child(odd)]:col-span-2">
        <Plocice baza={baza} p={p} dani={dani} naj={naj} lat={lat} lng={lng} />
      </motion.section>
    </>
  );
}

function SadaKartica({ baza, o, naj, sada }: { baza: Baza; o: Odabrani; naj: Odabrani | null; sada: number }) {
  const { t } = o;
  const iz = IZGLED[t.oznaka];
  const ceka = cekaZa(baza, t);
  const kreni = t.od.getTime() - 30 * 60000;
  const slab = t.oznaka === "Loše" || t.oznaka === "Slabije";
  const naslov =
    sada >= t.od.getTime()
      ? `Sada je ${t.oznaka.toLowerCase()} za lov`
      : slab
        ? `${veliko(kadJe(o))} ${t.oznaka === "Loše" ? "loše" : "slabije"} za lov`
        : kreni <= sada
          ? "Vrijeme je za polazak"
          : kreni - sada < 12 * 3600e3
            ? `Za ${trajanjeKratko(kreni - sada)} kreni u lov`
            : `${veliko(kadJe(o))} u ${sat(new Date(kreni))} kreni u lov`;
  const bolji = slab && naj && naj.t !== t && !(naj.t.oznaka === "Loše" || naj.t.oznaka === "Slabije") ? naj : null;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-naglasak/40 bg-[linear-gradient(160deg,var(--naglasak-meki),transparent_70%)] p-4">
      <div className="brojke text-[12px] font-semibold tracking-[0.14em] text-naglasak uppercase">
        Sada · {sat(new Date(sada))}
      </div>
      <div className="mt-1 font-display text-[23px] leading-tight font-semibold">{naslov}</div>
      <div className="mt-1.5 text-[14px] text-tekst-2">
        {iz.znak} <b style={{ color: iz.boja }}>{t.oznaka}</b> {kadJe(o)} · {smjerVjetra(t.vjetarSmjer)} {Math.round(t.vjetarBrzina)} km/h ·{" "}
        {Math.round(t.temperatura)} °C · {t.ukratko}
      </div>
      <div className="mt-0.5 text-[13.5px] text-tekst-2">
        {bolji ? (
          <>
            🎯 Bolje: <b className="text-tekst">{kadJe(bolji)}</b> ({sat(bolji.t.od)}–{sat(bolji.t.do)})
          </>
        ) : (
          <>
            Budi na čeki {sat(t.od)}–{sat(t.do)}
            {ceka && (
              <>
                {" · "}
                <b className="text-tekst">{ceka.naziv}</b> ima dobar vjetar
              </>
            )}
          </>
        )}
      </div>
      <Link
        href="/lov"
        transitionTypes={["naprijed"]}
        className="mt-3.5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-naglasak text-[16px] font-semibold text-[#17130a] shadow-[0_14px_34px_-16px_var(--naglasak)] transition-transform active:scale-[0.98]"
      >
        <Ikona ime="nisan" velicina={20} /> Kreni u lov
      </Link>
    </div>
  );
}

interface Stavka {
  kljuc: string;
  vrijeme: Date;
  /** Do kada stavka traje (termin lova) – do tada nije „prošla”. */
  do?: Date;
  oznaka: string;
  naslov: ReactNode;
  opis?: string;
  boja: string;
  istaknuto?: boolean;
}

function TijekDana({
  baza,
  dani,
  naj,
  sada,
  lat,
  lng,
}: {
  baza: Baza;
  dani: DanLova[];
  naj: Odabrani | null;
  sada: number;
  lat: number;
  lng: number;
}) {
  const danas = useMemo(() => new Date(sada), [sada]);
  const sv = useMemo(() => suncevaVremena(danas, lat, lng), [danas, lat, lng]);
  const iso = isoDatum(danas);
  const sutra = isoDatum(new Date(danas.getTime() + 86400e3));

  const s: Stavka[] = [];
  const sunce = (k: string, v: Date | null, oznaka: string, naslov: string, opis?: string) =>
    v && s.push({ kljuc: k, vrijeme: v, oznaka: `${sat(v)} · ${oznaka}`, naslov, opis, boja: "var(--tekst-3)" });
  sunce("zora", sv.zora, "zora", "Prvo svjetlo");
  sunce("izlazak", sv.izlazak, "izlazak sunca", "Izlazak sunca");
  sunce("zalazak", sv.zalazak, "zalazak", "Zalazak sunca");
  sunce("sumrak", sv.sumrak, "sumrak", "Pada mrak");

  for (const dan of dani) {
    const d = isoDatum(dan.datum);
    if (d !== iso && d !== sutra) continue;
    for (const dio of ["jutro", "vecer"] as const) {
      const t = dan[dio];
      if (!t || (d === sutra && dio === "vecer")) continue;
      const iz = IZGLED[t.oznaka];
      const ceka = cekaZa(baza, t);
      const najbolje = naj?.t === t;
      s.push({
        kljuc: `${d}-${dio}`,
        vrijeme: t.od,
        do: t.do,
        oznaka: `${d === sutra ? "Sutra " : ""}${sat(t.od)}–${sat(t.do)} · ${dio === "jutro" ? "jutarnji lov" : "večernji lov"}${najbolje ? " · najbolje u tjednu" : ""}`,
        naslov: (
          <>
            {iz.znak} {t.oznaka}
          </>
        ),
        opis: `${veliko(t.ukratko)}${ceka ? ` · ${ceka.naziv}: dobar vjetar` : ""}`,
        boja: iz.boja,
        istaknuto: true,
      });
    }
  }

  for (const i of baza.izlasci)
    if (i.datum === iso && i.od)
      s.push({
        kljuc: `iz-${i.id}`,
        vrijeme: new Date(`${iso}T${i.od}`),
        oznaka: `${i.od} · ${i.uTijeku ? "u tijeku" : "izlazak"}`,
        naslov: NACINI_LOVA[i.nacin],
        opis: `${i.opazanja.reduce((a, o) => a + o.broj, 0)} opaženih grla`,
        boja: "var(--mahovina)",
      });
  for (const o of baza.odstrel)
    if (o.datum === iso)
      s.push({
        kljuc: `od-${o.id}`,
        vrijeme: new Date(`${iso}T${o.vrijeme || "12:00"}`),
        oznaka: `${o.vrijeme} · odstrel`,
        naslov: `🎯 ${o.vrsta}`,
        opis: `${nazivSpola(o.vrsta, o.spol)}${o.tudji && o.strijelac ? ` · ${o.strijelac}` : ""}`,
        boja: "var(--naglasak)",
      });

  s.sort((a, b) => a.vrijeme.getTime() - b.vrijeme.getTime());
  const proslo = (x: Stavka) => (x.do ?? x.vrijeme).getTime() < sada;
  const indeksSada = s.findIndex((x) => !proslo(x));

  return (
    <div>
      <h2 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Tijek dana</h2>
      <ol className="relative grid gap-3 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-rub">
        {s.map((x, i) => (
          <li key={x.kljuc} className="relative">
            {i === indeksSada && i > 0 && (
              <div className="relative -mt-1 mb-2 flex items-center gap-2 pl-6 text-[11.5px] font-semibold tracking-[0.12em] text-naglasak uppercase">
                <span className="absolute top-1/2 left-0 size-[11px] -translate-y-1/2 animate-pulse rounded-full bg-naglasak shadow-[0_0_0_4px_var(--naglasak-meki)]" />
                Sada {sat(new Date(sada))}
                <span className="h-px flex-1 bg-naglasak/40" />
              </div>
            )}
            <div className={cx("relative pl-6", proslo(x) && "opacity-45")}>
              <span className="absolute top-[5px] left-0 size-[11px] rounded-full border-2 border-povrsina" style={{ background: x.boja }} />
              {x.istaknuto && !proslo(x) ? (
                <div className="rounded-2xl border p-3" style={{ borderColor: `${x.boja}66`, background: `${x.boja}14` }}>
                  <div className="brojke text-[12px] font-medium tracking-wide text-tekst-3 uppercase">{x.oznaka}</div>
                  <div className="font-display text-[17px] font-semibold">{x.naslov}</div>
                  {x.opis && <div className="text-[13.5px] text-tekst-2">{x.opis}</div>}
                </div>
              ) : (
                <>
                  <div className="brojke text-[12px] text-tekst-3">{x.oznaka}</div>
                  <div className="text-[15px] font-medium">{x.naslov}</div>
                  {x.opis && <div className="text-[13px] text-tekst-2">{x.opis}</div>}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function skoci(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Plocica({ naslov, children, onClick, href, className }: { naslov: ReactNode; children: ReactNode; onClick?: () => void; href?: string; className?: string }) {
  const sadrzaj = (
    <>
      <div className="mb-1.5 text-[11.5px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">{naslov}</div>
      {children}
    </>
  );
  const klase = cx("kartica block h-full p-3.5 text-left transition-transform active:scale-[0.98]", className);
  if (href)
    return (
      <Link href={href} transitionTypes={["naprijed"]} className={klase}>
        {sadrzaj}
      </Link>
    );
  if (onClick)
    return (
      <button onClick={onClick} className={klase}>
        {sadrzaj}
      </button>
    );
  return <div className={klase}>{sadrzaj}</div>;
}

function Prsten({ udio, boja }: { udio: number; boja: string }) {
  const r = 15;
  const o = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className="size-10 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--povrsina-3)" strokeWidth="4" />
      <circle cx="20" cy="20" r={r} fill="none" stroke={boja} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${o * Math.min(1, udio)} ${o}`} />
    </svg>
  );
}

function Plocice({
  baza,
  p,
  dani,
  naj,
  lat,
  lng,
}: {
  baza: Baza;
  p: Prognoza | null;
  dani: DanLova[];
  naj: Odabrani | null;
  lat: number;
  lng: number;
}) {
  const [danas] = useState(() => new Date());
  const m = useMemo(() => ({ m: mjesec(danas), mv: mjesecevaVremena(danas, lat, lng), sol: solunar(danas, lat, lng) }), [danas, lat, lng]);

  const smjer = p?.trenutno.vjetarSmjer;
  const brzina = p?.trenutno.vjetarBrzina;
  const dobraSada = smjer != null ? baza.tocke.filter(tockaZaVjetar).filter((c) => ocjenaVjetra(c, smjer, brzina) === "dobar") : [];

  const kvote = baza.dozvole
    .filter((d) => ["valjana", "istice", "bez-roka"].includes(statusDozvole(d).status))
    .flatMap((d) => d.kvote.map((k) => ({ k, iskoristeno: iskoristenostKvote(baza, d, k) })))
    .slice(0, 3);

  const dopune = zadnjeDopune(baza);
  const hraniliste = baza.tocke
    .filter((t) => imaTip(t, "hraniliste") && dopune.has(t.id))
    .map((t) => ({ t, dana: danaOd(dopune.get(t.id)!.datum) }))
    .filter((x) => x.dana >= 7)
    .sort((a, b) => b.dana - a.dana)[0];

  return (
    <>
      {smjer != null && brzina != null && (
        <Plocica naslov="Vjetar" onClick={() => skoci("vjetar")}>
          <div className="flex items-start justify-between gap-2">
            <div className="brojke font-display text-[26px] leading-none font-semibold whitespace-nowrap">
              {smjerVjetra(smjer)} <span className="text-[20px]">{Math.round(brzina)}</span>
              <span className="text-[13px] font-normal text-tekst-3"> km/h</span>
            </div>
            <svg viewBox="0 0 24 24" className="size-8 shrink-0 text-naglasak" style={{ transform: `rotate(${smjer + 180}deg)` }} aria-hidden>
              <path d="M12 3l5 16-5-4-5 4z" fill="currentColor" />
            </svg>
          </div>
          <div className="mt-1.5 text-[13px] text-tekst-2">{beaufort(brzina).naziv}</div>
          {dobraSada.length > 0 && <div className="truncate text-[12.5px] text-mahovina">✓ dobar za {dobraSada.map((c) => c.naziv).join(", ")}</div>}
        </Plocica>
      )}

      {dani.length > 0 && (
        <Plocica naslov="Tjedan" onClick={() => skoci("kad-u-lov")}>
          {naj && naj.t.oznaka !== "Loše" ? (
            <>
              <div className="font-display text-[22px] leading-none font-semibold">
                {veliko(nazivDana(naj.dan.datum, true))} {IZGLED[naj.t.oznaka].znak}
              </div>
              <div className="mt-1 text-[13px] text-tekst-2">najbolje {naj.dio === "jutro" ? "ujutro" : "navečer"}</div>
            </>
          ) : (
            <div className="text-[14px] text-tekst-2">Loš tjedan za lov</div>
          )}
          <div className="mt-2 flex gap-1">
            {dani.map((d, i) => {
              const t = [d.jutro, d.vecer].filter((x): x is Termin => !!x).sort((a, b) => b.ocjena - a.ocjena)[0];
              return (
                <div key={i} className="flex-1 text-center">
                  <div className="h-5 rounded-md" style={{ background: IZGLED[t.oznaka].boja }} title={`${nazivDana(d.datum)}: ${t.oznaka}`} />
                  <div className="mt-0.5 text-[10px] text-tekst-3">{veliko(danUTjednu(d.datum).slice(0, 2))}</div>
                </div>
              );
            })}
          </div>
        </Plocica>
      )}

      {kvote.length > 0 && (
        <Plocica naslov="Plan odstrela" href="/dozvole">
          <div className="flex justify-around gap-1">
            {kvote.map(({ k, iskoristeno }, i) => (
              <div key={i} className="min-w-0 text-center">
                <div className="relative mx-auto size-10">
                  <Prsten udio={iskoristeno / k.broj} boja={iskoristeno >= k.broj ? "var(--mahovina)" : "var(--naglasak)"} />
                  <span className="brojke absolute inset-0 grid place-items-center text-[11px] font-semibold">
                    {iskoristeno}/{k.broj}
                  </span>
                </div>
                <div className="mt-1 truncate text-[11.5px] text-tekst-2">{k.vrsta.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </Plocica>
      )}

      <Plocica naslov="Mjesec">
        <div className="flex items-center gap-2.5">
          <FazaMjeseca faza={m.m.faza} velicina={40} />
          <div className="brojke font-display text-[24px] leading-none font-semibold">{Math.round(m.m.osvjetljenje * 100)} %</div>
        </div>
        <div className="mt-1.5 text-[13px] text-tekst-2">{m.m.naziv}</div>
        <div className="brojke text-[12px] text-tekst-3">
          Izlazi {sat(m.mv.izlazak)} · aktivnost: {m.sol.opis.toLowerCase()}
        </div>
      </Plocica>

      {hraniliste && (
        <Plocica naslov="🌽 Hranilište" href={`/karta?fokus=${hraniliste.t.lat},${hraniliste.t.lng}`} className="border-naglasak/40">
          <div className="text-[14px]">
            <b>{hraniliste.t.naziv}</b> nije dopunjeno {hraniliste.dana} dana
          </div>
        </Plocica>
      )}
    </>
  );
}

function KreniULovKartica({ baza }: { baza: Baza }) {
  const i = aktivniLov(baza);
  return (
    <Link
      href="/lov"
      transitionTypes={["naprijed"]}
      className={cx(
        "group relative flex items-center gap-4 overflow-hidden rounded-[22px] p-4 pr-5 transition-transform active:scale-[0.99]",
        i ? "bg-mahovina text-[#0b100c]" : "bg-naglasak text-[#17130a] shadow-[0_14px_34px_-16px_var(--naglasak)]",
      )}
    >
      <span className="pointer-events-none absolute -top-10 -right-6 size-40 rounded-full bg-white/20 blur-2xl" />
      <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-black/10">
        <Ikona ime={i ? "sat" : "nisan"} velicina={24} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-display text-[21px] leading-tight font-semibold">{i ? "Lov je u tijeku" : "Kreni u lov"}</span>
        <span className="block truncate text-[13.5px] opacity-75">
          {i
            ? `Od ${i.od} · ${i.opazanja.reduce((s, o) => s + o.broj, 0)} viđeno – nastavi bilježiti`
            : "Pokreni izlazak i bilježi uživo što vidiš"}
        </span>
      </span>
      <Ikona ime="desno" velicina={20} debljina={2.4} className="relative transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
