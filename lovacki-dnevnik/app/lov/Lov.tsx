"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { Koracnik, OdabirLovista } from "@/components/urednici/zajednicko";
import { Cipovi, Gumb, Naslov, Ploca, Polje, Segmenti, cx, obavijest, opruga, usePotvrda } from "@/components/ui";
import { suncevaVremena } from "@/lib/astro";
import { konfigurirano, pokreniDijeljenje, useDrustvo, zaustaviDijeljenje } from "@/lib/drustvo";
import { NACINI_LOVA, TIPOVI_TOCAKA, VRSTE, bojaVrste, nazivSpola } from "@/lib/katalog";
import { metri, sat, udaljenostM } from "@/lib/format";
import { dohvatiFoto, smanjiSliku } from "@/lib/foto";
import {
  aktivniLov,
  biljeske,
  dodajBiljesku,
  dodajFotografiju,
  dodajOpazanje,
  duljinaTraga,
  kreniULov,
  ukloniOpazanje,
  useLovPozicija,
  zavrsiLov,
} from "@/lib/lov";
import { useBaza } from "@/lib/store";
import type { Baza, Izlazak, Spol, VrstaLova } from "@/lib/types";
import { centarLovista } from "@/lib/upiti";
import { OCJENE, ocjenaVjetra, zaVjetar } from "@/lib/vjetarCeke";
import { smjerVjetra, usePrognoza } from "@/lib/vrijeme";

export default function Lov() {
  const baza = useBaza();
  if (!baza) return <Kostur />;
  const i = aktivniLov(baza);
  return (
    <AnimatePresence mode="wait">
      {i ? <Uzivo key={i.id} baza={baza} i={i} /> : <Pokretanje key="kreni" baza={baza} />}
    </AnimatePresence>
  );
}

/* ---------------- Pokretanje ---------------- */

function uPoligonu([y, x]: [number, number], p: [number, number][]) {
  let unutra = false;
  for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
    const [ya, xa] = p[a];
    const [yb, xb] = p[b];
    if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) unutra = !unutra;
  }
  return unutra;
}

function Pokretanje({ baza }: { baza: Baza }) {
  const d = useDrustvo();
  const zadnji = baza.izlasci[0];
  const [lovisteId, setLoviste] = useState<string | undefined>(zadnji?.lovisteId ?? baza.lovista[0]?.id);
  const [tockaId, setTocka] = useState<string>("");
  const [nacin, setNacin] = useState<VrstaLova>(zadnji?.nacin ?? "cekanje");
  const [poz, setPoz] = useState<{ lat: number; lng: number } | null>(null);
  const prijatelja = d.prijateljstva.filter((p) => p.status === "prihvaceno").length;
  const [dijeli, setDijeli] = useState(true);
  const mozeDijeliti = konfigurirano && !!d.sesija && prijatelja > 0;

  // Gdje sam? Predloži lovište i najbližu čeku/zasjedu (unutar 250 m).
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const t = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPoz(t);
        const l = baza.lovista.find((x) => x.granica && x.granica.length > 2 && uPoligonu([t.lat, t.lng], x.granica));
        if (l) setLoviste(l.id);
        const najbliza = baza.tocke
          .filter((x) => zaVjetar(x.tip))
          .map((x) => ({ x, m: udaljenostM(x, t) }))
          .sort((a, b) => a.m - b.m)[0];
        if (najbliza && najbliza.m < 250) {
          setTocka(najbliza.x.id);
          if (najbliza.x.lovisteId) setLoviste(najbliza.x.lovisteId);
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [baza.lovista, baza.tocke]);

  const sredina = centarLovista(baza, lovisteId);
  const prognoza = usePrognoza(sredina.lat, sredina.lng);
  const smjer = prognoza.podaci?.trenutno.vjetarSmjer;
  const brzina = prognoza.podaci?.trenutno.vjetarBrzina;
  const red = { dobar: 0, rubno: 1, nestalan: 2, nepoznato: 3, los: 4 } as const;
  const tocke = baza.tocke
    .filter((t) => zaVjetar(t.tip) && (!lovisteId || t.lovisteId === lovisteId))
    .map((t) => ({ t, o: ocjenaVjetra(t, smjer, brzina), m: poz ? udaljenostM(t, poz) : null }))
    .sort((a, b) => red[a.o] - red[b.o] || (a.m ?? 0) - (b.m ?? 0));

  const kreni = () => {
    const t = baza.tocke.find((x) => x.id === tockaId);
    kreniULov({ lovisteId, tockaId: t?.id, nacin, lat: poz?.lat, lng: poz?.lng });
    if (mozeDijeliti && dijeli && !d.dijelim) pokreniDijeljenje(240).catch(() => {});
    navigator.vibrate?.(60);
    obavijest("Lovu blagoslov! Lov je započeo.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={opruga}>
      <Naslov natpis="Izlazak" naslov="Kreni u lov" opis="Aplikacija otvara izlazak, bilježi vrijeme i trag, a vi uživo dodajete što vidite." />
      <div className="kartica mx-auto grid max-w-xl gap-4 p-5">
        <Polje oznaka="Lovište">
          <OdabirLovista
            baza={baza}
            vrijednost={lovisteId}
            promjena={(v) => {
              setLoviste(v);
              setTocka("");
            }}
          />
        </Polje>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Čeka ili zasjeda</span>
            {smjer != null && (
              <span className="brojke text-[12px] text-tekst-3">
                Vjetar {smjerVjetra(smjer)} · {Math.round(brzina ?? 0)} km/h
              </span>
            )}
          </div>
          <div className="grid gap-1.5">
            <Izbor aktivan={tockaId === ""} onClick={() => setTocka("")}>
              <span className="grid size-8 place-items-center rounded-full bg-povrsina-3 text-tekst-2">
                <Ikona ime="gps" velicina={16} />
              </span>
              <span className="flex-1">Bez točke – moja trenutna lokacija</span>
            </Izbor>
            {tocke.map(({ t, o, m }) => (
              <Izbor key={t.id} aktivan={tockaId === t.id} onClick={() => setTocka(t.id)}>
                <span
                  className="grid size-8 place-items-center rounded-full text-[12px] font-bold text-black/75"
                  style={{ background: TIPOVI_TOCAKA[t.tip].boja }}
                >
                  {TIPOVI_TOCAKA[t.tip].slovo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{t.naziv}</span>
                  <span className="block text-[12px] text-tekst-3">
                    {m != null && `${metri(m)} od vas · `}
                    <span style={{ color: o === "nepoznato" ? undefined : OCJENE[o].boja }}>{o === "nepoznato" ? "vjetar nije određen" : OCJENE[o].naziv.toLowerCase()}</span>
                  </span>
                </span>
              </Izbor>
            ))}
          </div>
        </div>

        <Polje oznaka="Način lova">
          <Cipovi
            opcije={Object.entries(NACINI_LOVA).map(([v, o]) => ({ vrijednost: v, oznaka: o }))}
            odabrano={nacin}
            promjena={(v) => setNacin(v as VrstaLova)}
          />
        </Polje>

        {mozeDijeliti && !d.dijelim && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-povrsina-2 p-3.5 text-[14.5px]">
            <span>
              Podijeli lokaciju s prijateljima
              <span className="block text-[12.5px] text-tekst-3">4 sata · uključen alarm blizine</span>
            </span>
            <input type="checkbox" className="size-5 accent-[var(--naglasak)]" checked={dijeli} onChange={(e) => setDijeli(e.target.checked)} />
          </label>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={kreni}
          className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-naglasak text-[17px] font-semibold text-[#17130a] shadow-[0_12px_30px_-12px_var(--naglasak)]"
        >
          <Ikona ime="nisan" velicina={22} /> Kreni u lov
        </motion.button>
        <p className="text-center text-[12.5px] text-tekst-3">Ništa ne morate unositi uživo – sve možete dopuniti i na kraju lova.</p>
      </div>
    </motion.div>
  );
}

function Izbor({ aktivan, onClick, children }: { aktivan: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center gap-3 rounded-2xl border p-2.5 text-left text-[14.5px] transition-colors",
        aktivan ? "border-naglasak bg-naglasak-meki" : "border-rub bg-povrsina-2 hover:bg-povrsina-3",
      )}
    >
      {children}
      <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", aktivan ? "border-naglasak bg-naglasak" : "border-rub-jaki")}>
        {aktivan && <span className="size-1.5 rounded-full bg-[#17130a]" />}
      </span>
    </button>
  );
}

/* ---------------- Lov u tijeku ---------------- */

function trajanjeOd(datum: string, od: string, sad: number) {
  const [h, m] = od.split(":").map(Number);
  const [g, mj, d] = datum.split("-").map(Number);
  const s = Math.max(0, Math.floor((sad - new Date(g, mj - 1, d, h, m).getTime()) / 1000));
  const dvije = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(s / 3600)}:${dvije(Math.floor((s % 3600) / 60))}:${dvije(s % 60)}`;
}

function Uzivo({ baza, i }: { baza: Baza; i: Izlazak }) {
  const router = useRouter();
  const d = useDrustvo();
  const poz = useLovPozicija();
  const potvrda = usePotvrda();
  const [sad, setSad] = useState(() => Date.now());
  const [ploca, setPloca] = useState<"opazanje" | "biljeska" | null>(null);
  const kamera = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setSad(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const tocka = baza.tocke.find((t) => t.id === i.tockaId);
  const loviste = baza.lovista.find((l) => l.id === i.lovisteId);
  const loc = tocka ?? (i.lat != null && i.lng != null ? { lat: i.lat, lng: i.lng } : centarLovista(baza, i.lovisteId));
  const prognoza = usePrognoza(loc.lat, loc.lng);
  const smjer = prognoza.podaci?.trenutno.vjetarSmjer;
  const brzina = prognoza.podaci?.trenutno.vjetarBrzina;
  const ocjena = tocka ? ocjenaVjetra(tocka, smjer, brzina) : null;
  const sv = useMemo(() => suncevaVremena(new Date(), loc.lat, loc.lng), [loc.lat, loc.lng]);
  const svjetlo = svjetloZaLov(sv, sad);

  const odstrel = baza.odstrel.filter((o) => o.izlazakId === i.id);
  const vidjeno = i.opazanja.reduce((s, o) => s + o.broj, 0);
  const prijedeno = duljinaTraga(i.trag);

  const dogadaji = [
    { vrijeme: i.od, ikona: "nisan" as ImeIkone, tekst: "Početak lova", boja: "var(--naglasak)" },
    ...i.opazanja.map((o, k) => ({
      vrijeme: o.vrijeme ?? "",
      ikona: "oko" as ImeIkone,
      tekst: `${o.vrsta} × ${o.broj}${o.spol ? ` · ${nazivSpola(o.vrsta, o.spol)}` : ""}`,
      boja: bojaVrste(o.vrsta),
      ukloni: () => ukloniOpazanje(i.id, k),
    })),
    ...odstrel.map((o) => ({
      vrijeme: o.vrijeme,
      ikona: "meta" as ImeIkone,
      tekst: `Odstrel: ${o.vrsta} · ${nazivSpola(o.vrsta, o.spol)}`,
      boja: "var(--opasnost)",
      otvori: () => otvori({ tip: "detalj-odstrel", id: o.id }),
    })),
    ...biljeske(i).map((b) => ({ vrijeme: b.vrijeme, ikona: "uredi" as ImeIkone, tekst: b.tekst, boja: "var(--tekst-2)" })),
  ].sort((a, b) => b.vrijeme.localeCompare(a.vrijeme));

  const fotografiraj = async (f?: File) => {
    if (!f) return;
    try {
      await dodajFotografiju(i.id, await smanjiSliku(f));
      obavijest("Fotografija je spremljena");
    } catch {
      obavijest("Fotografija nije spremljena", "greska");
    }
  };

  const zavrsi = () =>
    potvrda.pitaj("Završiti lov?", "Izlazak se zatvara s trenutnim vremenom. Zatim možete dopuniti ocjenu, bilješke i fotografije.", () => {
      zavrsiLov(i.id);
      if (d.dijelim) zaustaviDijeljenje().catch(() => {});
      router.push("/dnevnik");
      setTimeout(() => otvori({ tip: "izlazak", id: i.id }), 350);
      obavijest("Lov je završen – dopunite izlazak");
    }, { oznaka: "Završi lov", ikona: "kvacica", vrsta: "primarni" });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={opruga} className="mx-auto max-w-xl">
      {/* Zaglavlje */}
      <div className="kartica relative overflow-hidden border-mahovina/40 p-5">
        <div className="absolute -top-20 -right-16 size-56 rounded-full bg-mahovina opacity-15 blur-3xl" />
        <div className="relative flex items-center gap-2 text-[12.5px] font-semibold tracking-[0.14em] text-mahovina uppercase">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-mahovina opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-mahovina" />
          </span>
          Lov u tijeku
        </div>
        <div className="brojke relative mt-1 font-display text-[46px] leading-none font-semibold tracking-tight">{trajanjeOd(i.datum, i.od, sad)}</div>
        <div className="relative mt-1.5 text-[14px] text-tekst-2">
          {[loviste?.naziv, tocka?.naziv ?? "Moja lokacija", NACINI_LOVA[i.nacin]].filter(Boolean).join(" · ")}
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Mala oznaka="Vjetar" vrijednost={smjer != null ? `${smjerVjetra(smjer)} ${Math.round(brzina ?? 0)}` : "–"} dodatak={ocjena && ocjena !== "nepoznato" ? OCJENE[ocjena].naziv : smjer != null ? "km/h" : undefined} boja={ocjena && ocjena !== "nepoznato" ? OCJENE[ocjena].boja : undefined} />
          <Mala oznaka={svjetlo.oznaka} vrijednost={svjetlo.vrijednost} dodatak={svjetlo.dodatak} />
          <Mala oznaka="Prijeđeno" vrijednost={prijedeno >= 1000 ? `${(prijedeno / 1000).toFixed(1)} km` : `${Math.round(prijedeno)} m`} dodatak={poz ? `GPS ±${Math.round(poz.tocnost)} m` : "čekam GPS…"} />
        </div>
      </div>

      {/* Brze radnje */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Radnja ikona="oko" oznaka="Vidio sam" opis="Opažanje divljači" onClick={() => setPloca("opazanje")} istaknuto />
        <Radnja
          ikona="meta"
          oznaka="Odstrel"
          opis="Upiši odstrel"
          onClick={() =>
            otvori({
              tip: "odstrel",
              pocetno: { izlazakId: i.id, datum: i.datum, lovisteId: i.lovisteId, lat: poz?.lat ?? tocka?.lat, lng: poz?.lng ?? tocka?.lng },
            })
          }
        />
        <Radnja ikona="kamera" oznaka="Fotografija" opis={`${i.fotoIds?.length ?? 0} snimljeno`} onClick={() => kamera.current?.click()} />
        <Radnja ikona="uredi" oznaka="Bilješka" opis="Kratki zapis" onClick={() => setPloca("biljeska")} />
      </div>
      <input ref={kamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (fotografiraj(e.target.files?.[0]), (e.target.value = ""))} />

      <SlikeLova ids={i.fotoIds ?? []} />

      {/* Tijek lova */}
      <div className="kartica mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Tijek lova</h2>
          <span className="brojke text-[12.5px] text-tekst-3">
            {vidjeno} {vidjeno === 1 ? "grlo" : "grla"} viđeno
          </span>
        </div>
        <ol className="relative grid gap-1">
          <AnimatePresence initial={false}>
            {dogadaji.map((e, k) => (
              <motion.li
                key={`${e.vrijeme}-${e.tekst}-${k}`}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-xl px-1 py-2"
              >
                <span className="brojke w-11 shrink-0 text-[13px] text-tekst-3">{e.vrijeme}</span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${e.boja} 18%, transparent)`, color: e.boja }}>
                  <Ikona ime={e.ikona} velicina={15} />
                </span>
                {"otvori" in e && e.otvori ? (
                  <button onClick={e.otvori} className="min-w-0 flex-1 truncate text-left text-[14.5px] underline-offset-2 hover:underline">
                    {e.tekst}
                  </button>
                ) : (
                  <span className="min-w-0 flex-1 text-[14.5px]">{e.tekst}</span>
                )}
                {"ukloni" in e && e.ukloni && (
                  <button onClick={e.ukloni} className="p-1.5 text-tekst-3 hover:text-opasnost" aria-label="Ukloni opažanje">
                    <Ikona ime="x" velicina={14} />
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>

      <div className="mt-4 mb-2 flex gap-2">
        <Link href="/karta" transitionTypes={["naprijed"]} className="flex-1">
          <Gumb ikona="karta" className="w-full">
            Karta
          </Gumb>
        </Link>
        <Gumb vrsta="opasni" ikona="kvacica" className="flex-[1.6]" onClick={zavrsi}>
          Završi lov
        </Gumb>
      </div>

      <PlocaOpazanja otvorena={ploca === "opazanje"} zatvori={() => setPloca(null)} baza={baza} id={i.id} />
      <PlocaBiljeske otvorena={ploca === "biljeska"} zatvori={() => setPloca(null)} id={i.id} />
      {potvrda.element}
    </motion.div>
  );
}

function svjetloZaLov(sv: ReturnType<typeof suncevaVremena>, sad: number) {
  const za = (d: Date | null) => (d ? Math.round((d.getTime() - sad) / 60000) : null);
  const doIzlaska = za(sv.izlazak);
  const doSumraka = za(sv.sumrak);
  if (doIzlaska != null && doIzlaska > 0 && (sv.zora ? sv.zora.getTime() - sad < 3 * 3600000 : true))
    return { oznaka: "Izlazak Sunca", vrijednost: sat(sv.izlazak), dodatak: `za ${doIzlaska} min` };
  if (doSumraka != null && doSumraka > 0)
    return {
      oznaka: "Lovno svjetlo",
      vrijednost: `do ${sat(sv.sumrak)}`,
      dodatak: doSumraka < 180 ? `još ${doSumraka} min` : `zalazak ${sat(sv.zalazak)}`,
    };
  return { oznaka: "Svjetlo", vrijednost: "noć", dodatak: `izlazak ${sat(sv.izlazak)}` };
}

function Mala({ oznaka, vrijednost, dodatak, boja }: { oznaka: string; vrijednost: string; dodatak?: string; boja?: string }) {
  return (
    <div className="rounded-2xl bg-povrsina-2/80 p-2.5">
      <div className="truncate text-[10.5px] font-medium tracking-wide text-tekst-3 uppercase">{oznaka}</div>
      <div className="brojke truncate text-[16px] font-semibold">{vrijednost}</div>
      {dodatak && (
        <div className="truncate text-[11.5px]" style={{ color: boja ?? "var(--tekst-3)" }}>
          {dodatak}
        </div>
      )}
    </div>
  );
}

function Radnja({ ikona, oznaka, opis, onClick, istaknuto }: { ikona: ImeIkone; oznaka: string; opis: string; onClick: () => void; istaknuto?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cx(
        "flex min-h-[92px] flex-col items-start justify-between rounded-3xl border p-4 text-left",
        istaknuto ? "border-naglasak/50 bg-naglasak text-[#17130a]" : "border-rub bg-povrsina hover:bg-povrsina-2",
      )}
    >
      <Ikona ime={ikona} velicina={24} className={istaknuto ? "" : "text-naglasak"} />
      <span>
        <span className="block text-[16px] font-semibold">{oznaka}</span>
        <span className={cx("block text-[12.5px]", istaknuto ? "text-[#17130a]/70" : "text-tekst-3")}>{opis}</span>
      </span>
    </motion.button>
  );
}

function SlikeLova({ ids }: { ids: string[] }) {
  const [slike, setSlike] = useState<{ id: string; url: string }[]>([]);
  const kljuc = ids.join(",");
  useEffect(() => {
    if (!kljuc) return;
    let ziv = true;
    Promise.all(kljuc.split(",").map(async (id) => ({ id, url: await dohvatiFoto(id) }))).then(
      (r) => ziv && setSlike(r.flatMap((x) => (x.url ? [{ id: x.id, url: x.url }] : []))),
    );
    return () => {
      ziv = false;
    };
  }, [kljuc]);
  if (!kljuc || !slike.length) return null;
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {slike.map((s) => (
        <motion.img key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} src={s.url} alt="" className="size-20 shrink-0 rounded-2xl object-cover" />
      ))}
    </div>
  );
}

/* ---------------- Ploče ---------------- */

function PlocaOpazanja({ otvorena, zatvori, baza, id }: { otvorena: boolean; zatvori: () => void; baza: Baza; id: string }) {
  // Najprije vrste koje korisnik najčešće viđa.
  const vrste = useMemo(() => {
    const broj = new Map<string, number>();
    for (const iz of baza.izlasci) for (const o of iz.opazanja) broj.set(o.vrsta, (broj.get(o.vrsta) ?? 0) + 1);
    for (const o of baza.odstrel) broj.set(o.vrsta, (broj.get(o.vrsta) ?? 0) + 1);
    const osnovne = ["Srna obična", "Divlja svinja", "Jelen obični", "Lisica", "Zec obični", "Fazan", "Čagalj", "Jazavac"];
    return [...VRSTE.map((v) => v.naziv)].sort(
      (a, b) => (broj.get(b) ?? 0) - (broj.get(a) ?? 0) || (osnovne.indexOf(a) + 1 || 99) - (osnovne.indexOf(b) + 1 || 99),
    );
  }, [baza.izlasci, baza.odstrel]);
  const [vrsta, setVrsta] = useState(vrste[0]);
  const [broj, setBroj] = useState(1);
  const [spol, setSpol] = useState<Spol | "">("");
  const [svi, setSvi] = useState(false);

  const dodaj = () => {
    dodajOpazanje(id, { vrsta, broj, spol: spol || undefined });
    navigator.vibrate?.(40);
    obavijest(`${vrsta} × ${broj} zabilježeno`);
    setBroj(1);
    setSpol("");
    zatvori();
  };

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Vidio sam"
      podnaslov="Opažanje se sprema s vremenom i mjestom"
      podnozje={
        <Gumb vrsta="primarni" ikona="plus" className="w-full" onClick={dodaj}>
          Dodaj {vrsta} × {broj}
        </Gumb>
      }
    >
      <div className="flex flex-wrap gap-2">
        {(svi ? vrste : vrste.slice(0, 10)).map((v) => (
          <motion.button
            key={v}
            whileTap={{ scale: 0.94 }}
            onClick={() => setVrsta(v)}
            className={cx(
              "flex items-center gap-2 rounded-full border px-3.5 py-2 text-[14px]",
              v === vrsta ? "border-naglasak bg-naglasak-meki font-medium" : "border-rub bg-povrsina-2",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: bojaVrste(v) }} />
            {v}
          </motion.button>
        ))}
        {!svi && (
          <button onClick={() => setSvi(true)} className="rounded-full px-3.5 py-2 text-[14px] text-naglasak">
            Sve vrste…
          </button>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div>
          <div className="mb-1.5 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Broj</div>
          <Koracnik vrijednost={broj} min={1} promjena={setBroj} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Spol / dob</div>
          <Segmenti
            vrijednost={spol}
            promjena={(v) => setSpol(v)}
            opcije={[
              { vrijednost: "" as const, oznaka: "?" },
              ...(["m", "z", "n"] as Spol[]).map((s) => ({ vrijednost: s, oznaka: nazivSpola(vrsta, s).replace(/^./, (c) => c.toUpperCase()) })),
            ]}
          />
        </div>
      </div>
    </Ploca>
  );
}

function PlocaBiljeske({ otvorena, zatvori, id }: { otvorena: boolean; zatvori: () => void; id: string }) {
  const [tekst, setTekst] = useState("");
  const spremi = () => {
    dodajBiljesku(id, tekst);
    setTekst("");
    zatvori();
    obavijest("Bilješka je zapisana");
  };
  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Bilješka"
      podnaslov="Zapisuje se s trenutnim vremenom"
      podnozje={
        <Gumb vrsta="primarni" ikona="kvacica" className="w-full" onClick={spremi} disabled={!tekst.trim()}>
          Zapiši
        </Gumb>
      }
    >
      <textarea
        autoFocus
        className="unos min-h-32"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        placeholder="npr. Svinje prošle prosjekom prema potoku, vjetar se okreće…"
      />
    </Ploca>
  );
}

