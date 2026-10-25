"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Ikona from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { Gumb, Naslov, PraznoStanje, Segmenti } from "@/components/ui";
import { NACINI_LOVA, bojaVrste, nazivSpola, opisStrijelca, vrsta as nadiVrstu, SKUPINE } from "@/lib/katalog";
import { izIso, MJESECI_KRATKO, mnozina, trajanjeIzlaska } from "@/lib/format";
import { dohvatiFoto, fotografijeOdstrela } from "@/lib/foto";
import { useBaza } from "@/lib/store";
import type { Baza, Izlazak, Odstrel } from "@/lib/types";
import { mojOdstrel, nazivLovista, sortirajPoDatumu } from "@/lib/upiti";
import { smjerVjetra } from "@/lib/vrijeme";

type Prikaz = "izlasci" | "odstrel";

const MJESECI_PUNO = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];

function grupiraj<T extends { datum: string }>(lista: T[]) {
  const g = new Map<string, T[]>();
  for (const x of lista) {
    const k = x.datum.slice(0, 7);
    g.set(k, [...(g.get(k) ?? []), x]);
  }
  return [...g.entries()];
}

export default function Dnevnik() {
  const baza = useBaza();
  const params = useSearchParams();
  const router = useRouter();
  const prikaz: Prikaz = params.get("prikaz") === "odstrel" ? "odstrel" : "izlasci";
  const [upit, setUpit] = useState("");
  const [lovisteFiltar, setLovisteFiltar] = useState("");

  const postaviPrikaz = (p: Prikaz) => {
    router.replace(p === "odstrel" ? "/dnevnik?prikaz=odstrel" : "/dnevnik", { scroll: false });
  };

  const izlasci = useMemo(() => {
    if (!baza) return [];
    const q = upit.toLowerCase().trim();
    return sortirajPoDatumu(baza.izlasci, (i) => i.od).filter((i) => {
      if (lovisteFiltar && i.lovisteId !== lovisteFiltar) return false;
      if (!q) return true;
      return [i.napomena, i.pratitelji, NACINI_LOVA[i.nacin], nazivLovista(baza, i.lovisteId), ...i.opazanja.map((o) => o.vrsta)]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [baza, upit, lovisteFiltar]);

  const odstrel = useMemo(() => {
    if (!baza) return [];
    const q = upit.toLowerCase().trim();
    return sortirajPoDatumu(baza.odstrel.filter(mojOdstrel), (o) => o.vrijeme).filter((o) => {
      if (lovisteFiltar && o.lovisteId !== lovisteFiltar) return false;
      if (!q) return true;
      return [o.vrsta, o.napomena, o.markica, o.kalibar, o.oruzje, o.trofejOpis, nazivLovista(baza, o.lovisteId)]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [baza, upit, lovisteFiltar]);

  if (!baza) return <Kostur />;

  const lista = prikaz === "izlasci" ? izlasci : odstrel;

  return (
    <div>
      <Naslov
        natpis="Evidencija"
        naslov="Lovački dnevnik"
        opis="Svi izlasci u lovište i odstrijeljena divljač, kronološki."
        akcija={
          <Gumb
            vrsta="primarni"
            ikona="plus"
            onClick={() => otvori({ tip: prikaz === "izlasci" ? "izlazak" : "odstrel" })}
          >
            {prikaz === "izlasci" ? "Novi izlazak" : "Upiši odstrel"}
          </Gumb>
        }
      />

      {/* Ispod statusne trake (iPhone): traka se lijepi ispod nje, a fiksna pruga na vrhu prekriva sadržaj koji klizi pod sat. */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-30 h-[env(safe-area-inset-top)] bg-pozadina/80 backdrop-blur-xl md:hidden" />
      <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 mb-5 bg-pozadina/80 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Segmenti
            className="md:w-80"
            vrijednost={prikaz}
            promjena={postaviPrikaz}
            opcije={[
              { vrijednost: "izlasci", oznaka: "Izlasci", broj: baza.izlasci.length },
              { vrijednost: "odstrel", oznaka: "Odstrel", broj: baza.odstrel.filter(mojOdstrel).length },
            ]}
          />
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Ikona ime="pretraga" velicina={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tekst-3" />
              <input
                className="unos pl-10"
                placeholder="Pretraži bilješke, vrste, markice…"
                value={upit}
                onChange={(e) => setUpit(e.target.value)}
              />
            </div>
            {baza.lovista.length > 1 && (
              <select aria-label="Lovište" className="unos w-auto max-w-[44%]" value={lovisteFiltar} onChange={(e) => setLovisteFiltar(e.target.value)}>
                <option value="">Sva lovišta</option>
                {baza.lovista.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.naziv}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={prikaz}
          initial={{ opacity: 0, x: prikaz === "odstrel" ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: prikaz === "odstrel" ? -24 : 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {lista.length === 0 ? (
            upit || lovisteFiltar ? (
              <PraznoStanje ikona="pretraga" naslov="Nema rezultata" opis="Pokušajte s drugim pojmom ili uklonite filtar lovišta." />
            ) : prikaz === "izlasci" ? (
              <PraznoStanje
                ikona="dnevnik"
                naslov="Još nema izlazaka"
                opis="Zabilježite izlazak – vrijeme, vjetar, čeku i opaženu divljač."
                akcija={<Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "izlazak" })}>Novi izlazak</Gumb>}
              />
            ) : (
              <PraznoStanje
                ikona="meta"
                naslov="Još nema odstrela"
                opis="Upisujte odstrijeljenu divljač s markicom, masom, trofejom i fotografijom."
                akcija={<Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "odstrel" })}>Upiši odstrel</Gumb>}
              />
            )
          ) : (
            <div className="grid gap-8">
              {grupiraj<Izlazak | Odstrel>(lista).map(([mj, stavke]) => {
                const [g, m] = mj.split("-").map(Number);
                return (
                  <section key={mj}>
                    <div className="mb-3 flex items-baseline gap-3">
                      <h2 className="font-display text-xl font-semibold">{MJESECI_PUNO[m - 1]}</h2>
                      <span className="brojke text-sm text-tekst-3">{g}.</span>
                      <span className="h-px flex-1 bg-rub" />
                      <span className="text-[12.5px] text-tekst-3">
                        {stavke.length}{" "}
                        {prikaz === "izlasci"
                          ? mnozina(stavke.length, "izlazak", "izlaska", "izlazaka")
                          : mnozina(stavke.length, "grlo", "grla", "grla")}
                      </span>
                    </div>
                    <motion.ul layout className="grid gap-2.5 md:grid-cols-2">
                      <AnimatePresence initial={false}>
                        {stavke.map((s, i) =>
                          prikaz === "izlasci" ? (
                            <KarticaIzlaska key={s.id} i={s as Izlazak} baza={baza} red={i} />
                          ) : (
                            <KarticaOdstrela key={s.id} o={s as Odstrel} baza={baza} red={i} />
                          ),
                        )}
                      </AnimatePresence>
                    </motion.ul>
                  </section>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const ulaz = (red: number) => ({
  layout: true,
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(red, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  whileHover: { y: -2 },
  whileTap: { scale: 0.985 },
});

function DatumBlok({ datum }: { datum: string }) {
  const d = izIso(datum);
  return (
    <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-rub bg-povrsina-2 py-1.5">
      <span className="brojke font-display text-[20px] leading-none font-semibold">{d.getDate()}</span>
      <span className="mt-0.5 text-[10.5px] font-medium tracking-wide text-tekst-3 uppercase">{MJESECI_KRATKO[d.getMonth()]}</span>
    </div>
  );
}

function KarticaIzlaska({ i, baza, red }: { i: Izlazak; baza: Baza; red: number }) {
  const min = trajanjeIzlaska(i.od, i.do);
  const tocka = baza.tocke.find((t) => t.id === i.tockaId);
  const odstrel = baza.odstrel.filter((o) => o.izlazakId === i.id && mojOdstrel(o));
  const skupno = baza.odstrel.filter((o) => o.izlazakId === i.id && !mojOdstrel(o)).length;
  const opazeno = i.opazanja.reduce((s, o) => s + o.broj, 0);
  return (
    <motion.li {...ulaz(red)}>
      <button onClick={() => otvori({ tip: "detalj-izlazak", id: i.id })} className="kartica flex w-full gap-3.5 p-3.5 text-left transition-colors hover:border-rub-jaki">
        <DatumBlok datum={i.datum} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{NACINI_LOVA[i.nacin]}</span>
            {odstrel.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-naglasak-meki px-2 py-0.5 text-[11.5px] font-semibold text-naglasak">
                <Ikona ime="meta" velicina={12} debljina={2.4} /> {odstrel.length}
              </span>
            )}
            {skupno > 0 && (
              <span className="shrink-0 rounded-full bg-povrsina-3 px-2 py-0.5 text-[11.5px] text-tekst-2" title="Odstrel drugih lovaca u skupnom lovu">
                skupno {skupno}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-tekst-2">
            {[nazivLovista(baza, i.lovisteId), tocka?.naziv].filter(Boolean).join(" · ") || "Bez lovišta"}
          </div>
          <div className="brojke mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-tekst-3">
            <span className="flex items-center gap-1">
              <Ikona ime="sat" velicina={13} />
              {i.od}
              {i.uTijeku ? (
                <span className="ml-1 rounded-full bg-mahovina px-1.5 py-px text-[11px] font-semibold text-[#0b100c]">u tijeku</span>
              ) : i.do ? (
                `–${i.do}`
              ) : (
                ""
              )}
              {min ? ` (${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")} h)` : ""}
            </span>
            {i.vrijeme?.vjetarSmjer != null && (
              <span className="flex items-center gap-1">
                <Ikona ime="vjetar" velicina={13} />
                {smjerVjetra(i.vrijeme.vjetarSmjer)} {Math.round(i.vrijeme.vjetarBrzina ?? 0)} km/h
              </span>
            )}
            {i.vrijeme?.temperatura != null && <span>{Math.round(i.vrijeme.temperatura)} °C</span>}
            {opazeno > 0 && (
              <span className="flex items-center gap-1">
                <Ikona ime="oko" velicina={13} />
                {opazeno}
              </span>
            )}
          </div>
        </div>
        {i.ocjena ? (
          <div className="flex shrink-0 items-start gap-0.5 pt-0.5 text-naglasak">
            <Ikona ime="zvijezda" velicina={13} fill="currentColor" />
            <span className="brojke text-[12.5px] font-semibold">{i.ocjena}</span>
          </div>
        ) : null}
      </button>
    </motion.li>
  );
}

function KarticaOdstrela({ o, baza, red }: { o: Odstrel; baza: Baza; red: number }) {
  const boja = bojaVrste(o.vrsta);
  const skupina = nadiVrstu(o.vrsta)?.skupina;
  return (
    <motion.li {...ulaz(red)}>
      <button onClick={() => otvori({ tip: "detalj-odstrel", id: o.id })} className="kartica relative flex w-full gap-3.5 overflow-hidden p-3.5 text-left transition-colors hover:border-rub-jaki">
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: boja }} />
        <DatumBlok datum={o.datum} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{o.vrsta}</span>
            <span className="shrink-0 text-[13px] text-tekst-3">{nazivSpola(o.vrsta, o.spol)}</span>
            {o.tudji && <span className="shrink-0 rounded-full bg-povrsina-3 px-2 py-0.5 text-[11.5px] text-tekst-2">{opisStrijelca(o)}</span>}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-tekst-2">
            {[nazivLovista(baza, o.lovisteId), skupina ? SKUPINE[skupina].naziv : null].filter(Boolean).join(" · ")}
          </div>
          <div className="brojke mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-tekst-3">
            <span className="flex items-center gap-1">
              <Ikona ime="sat" velicina={13} /> {o.vrijeme}
            </span>
            {o.masa != null && (
              <span className="flex items-center gap-1">
                <Ikona ime="vaga" velicina={13} /> {o.masa.toLocaleString("hr-HR")} kg
              </span>
            )}
            {o.trofejCic != null && (
              <span className="flex items-center gap-1 text-naglasak">
                <Ikona ime="trofej" velicina={13} /> {o.trofejCic.toLocaleString("hr-HR")} CIC
              </span>
            )}
            {o.markica && <span className="font-mono text-[11.5px]">{o.markica}</span>}
          </div>
        </div>
        {fotografijeOdstrela(o).length > 0 && <Slicica id={fotografijeOdstrela(o)[0]} broj={fotografijeOdstrela(o).length} />}
      </button>
    </motion.li>
  );
}


function Slicica({ id, broj }: { id: string; broj: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let ziv = true;
    dohvatiFoto(id).then((u) => ziv && u && setUrl(u));
    return () => {
      ziv = false;
    };
  }, [id]);
  return (
    <span className="relative size-14 shrink-0 self-center overflow-hidden rounded-xl border border-rub bg-povrsina-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" className="size-full object-cover" />}
      {broj > 1 && <span className="brojke absolute right-0.5 bottom-0.5 rounded bg-black/65 px-1 text-[10px] text-white">{broj}</span>}
    </span>
  );
}
