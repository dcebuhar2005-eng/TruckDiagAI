"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { Gumb, Naslov, PraznoStanje, Znacka, cx, djeteListe, mekaOpruga, roditeljListe } from "@/components/ui";
import { TIPOVI_TOCAKA, bojaVrste } from "@/lib/katalog";
import { datumKratki, povrsinaHa } from "@/lib/format";
import { useBaza } from "@/lib/store";
import type { Baza, Loviste } from "@/lib/types";
import { sortirajPoDatumu } from "@/lib/upiti";
import { KarticaPodijeli, PodijeliLoviste, PrimljenaLovista } from "./Podijeli";

function Obris({ l, tocke, velicina = 120 }: { l: Loviste; tocke?: Baza["tocke"]; velicina?: number }) {
  const g = l.granica ?? [];
  if (g.length < 3) {
    return (
      <div className="grid h-full w-full place-items-center text-tekst-3">
        <div className="flex flex-col items-center gap-1.5 text-[12px]">
          <Ikona ime="poligon" velicina={26} debljina={1.4} />
          Granica nije ucrtana
        </div>
      </div>
    );
  }
  const lats = g.map((p) => p[0]);
  const lngs = g.map((p) => p[1]);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const w = (maxLng - minLng) * k || 1e-6;
  const h = maxLat - minLat || 1e-6;
  const s = 80 / Math.max(w, h);
  const ox = (100 - w * s) / 2;
  const oy = (100 - h * s) / 2;
  const xy = (lat: number, lng: number) => [ox + (lng - minLng) * k * s, oy + (maxLat - lat) * s];
  const d = g.map((p, i) => `${i ? "L" : "M"}${xy(p[0], p[1]).join(",")}`).join(" ") + "Z";
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ maxHeight: velicina }}>
      <defs>
        <pattern id={`mreza-${l.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill={`url(#mreza-${l.id})`} className="text-tekst" />
      <motion.path
        d={d}
        fill={l.boja}
        fillOpacity={0.14}
        stroke={l.boja}
        strokeWidth={1.4}
        strokeLinejoin="round"
        initial={{ pathLength: 0, fillOpacity: 0 }}
        animate={{ pathLength: 1, fillOpacity: 0.14 }}
        transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
      />
      {tocke?.map((t, i) => {
        const [x, y] = xy(t.lat, t.lng);
        return (
          <motion.circle
            key={t.id}
            cx={x}
            cy={y}
            r={2.2}
            fill={TIPOVI_TOCAKA[t.tip].boja}
            stroke="var(--povrsina)"
            strokeWidth={0.8}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 + i * 0.03, type: "spring", stiffness: 400, damping: 14 }}
          />
        );
      })}
    </svg>
  );
}

export default function Lovista() {
  const baza = useBaza();
  const [odabrano, setOdabrano] = useState<string | null>(null);

  useEffect(() => {
    if (!odabrano) return;
    const t = (e: KeyboardEvent) => e.key === "Escape" && setOdabrano(null);
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [odabrano]);

  if (!baza) return <Kostur />;
  const l = baza.lovista.find((x) => x.id === odabrano);

  return (
    <div>
      <Naslov
        natpis="Teren"
        naslov="Lovišta"
        opis="Granice, točke u lovištu i povijest lova po lovištima."
        akcija={
          <Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "loviste" })}>
            Novo lovište
          </Gumb>
        }
      />
      {baza.lovista.length > 0 && (
        <div className="mb-5">
          <KarticaPodijeli />
        </div>
      )}
      <PrimljenaLovista />

      {baza.lovista.length === 0 ? (
        <PraznoStanje
          ikona="loviste"
          naslov="Dodajte prvo lovište"
          opis="Unesite naziv i broj lovišta, zatim ucrtajte granicu i čeke na karti."
          akcija={<Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "loviste" })}>Novo lovište</Gumb>}
        />
      ) : (
        <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {baza.lovista.map((x) => {
            const izl = baza.izlasci.filter((i) => i.lovisteId === x.id).length;
            const ods = baza.odstrel.filter((o) => o.lovisteId === x.id).length;
            const tck = baza.tocke.filter((t) => t.lovisteId === x.id);
            const ha = x.povrsinaHa ?? (x.granica ? Math.round(povrsinaHa(x.granica)) : undefined);
            return (
              <motion.div key={x.id} variants={djeteListe}>
                <motion.button
                  layoutId={`loviste-${x.id}`}
                  onClick={() => setOdabrano(x.id)}
                  whileHover={{ y: -4 }}
                  transition={mekaOpruga}
                  className="kartica group w-full overflow-hidden text-left"
                  style={{ borderRadius: 20 }}
                >
                  <motion.div layoutId={`obris-${x.id}`} className="relative h-40 border-b border-rub bg-povrsina-2 p-3">
                    <Obris l={x} tocke={tck} />
                    <span className="absolute top-3 left-3 size-2.5 rounded-full" style={{ background: x.boja, boxShadow: `0 0 0 4px ${x.boja}33` }} />
                  </motion.div>
                  <div className="p-4">
                    <div className="flex items-baseline gap-2">
                      <motion.h3 layoutId={`naziv-${x.id}`} className="font-display text-[21px] font-semibold">
                        {x.naziv}
                      </motion.h3>
                      {x.broj && <span className="brojke text-sm text-tekst-3">{x.broj}</span>}
                    </div>
                    <p className="truncate text-[13px] text-tekst-2">{[x.ovlastenik, x.zupanija].filter(Boolean).join(" · ") || "—"}</p>
                    <div className="brojke mt-4 grid grid-cols-4 gap-2 text-center">
                      <Stat v={ha != null ? ha.toLocaleString("hr-HR") : "–"} o="ha" />
                      <Stat v={tck.length} o="točaka" />
                      <Stat v={izl} o="izlazaka" />
                      <Stat v={ods} o="odstrel" />
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Preko donje navigacije: <main> ima vlastiti z-index, pa prozor ide izravno u body. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {l && (
              <>
                <motion.div
                  key="zastor"
                  className="fixed inset-0 z-[1500] bg-black/55 backdrop-blur-[3px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOdabrano(null)}
                />
                <div className="pointer-events-none fixed inset-0 z-[1501] flex items-end justify-center md:items-center md:p-6">
                  <motion.div
                    layoutId={`loviste-${l.id}`}
                    transition={mekaOpruga}
                    className="pointer-events-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden border border-rub bg-povrsina shadow-jaka"
                    style={{ borderRadius: 28 }}
                  >
                    <DetaljLovista baza={baza} l={l} zatvori={() => setOdabrano(null)} />
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function Stat({ v, o }: { v: number | string; o: string }) {
  return (
    <div className="rounded-xl bg-povrsina-2 py-2">
      <div className="text-[16px] font-semibold">{v}</div>
      <div className="text-[10.5px] tracking-wide text-tekst-3 uppercase">{o}</div>
    </div>
  );
}

function DetaljLovista({ baza, l, zatvori }: { baza: Baza; l: Loviste; zatvori: () => void }) {
  const tocke = baza.tocke.filter((t) => t.lovisteId === l.id);
  const izlasci = sortirajPoDatumu(baza.izlasci.filter((i) => i.lovisteId === l.id));
  const odstrel = baza.odstrel.filter((o) => o.lovisteId === l.id);
  const poVrsti = Object.entries(
    odstrel.reduce<Record<string, number>>((a, o) => ({ ...a, [o.vrsta]: (a[o.vrsta] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const ha = l.povrsinaHa ?? (l.granica ? Math.round(povrsinaHa(l.granica)) : undefined);
  const [dijeli, setDijeli] = useState(false);

  return (
    <>
      <motion.div layoutId={`obris-${l.id}`} className="relative h-48 shrink-0 border-b border-rub bg-povrsina-2 p-4 md:h-56">
        <Obris l={l} tocke={tocke} velicina={220} />
        <button onClick={zatvori} className="absolute top-3 right-3 grid size-10 place-items-center rounded-xl border border-rub bg-povrsina/80 backdrop-blur" aria-label="Zatvori">
          <Ikona ime="x" velicina={18} />
        </button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        className="min-h-0 flex-1 overflow-y-auto p-5"
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <motion.h2 layoutId={`naziv-${l.id}`} className="font-display text-[28px] font-semibold">
            {l.naziv}
          </motion.h2>
          {l.broj && <span className="brojke text-tekst-3">{l.broj}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {l.ovlastenik && <Znacka>{l.ovlastenik}</Znacka>}
          {l.zupanija && <Znacka>{l.zupanija} županija</Znacka>}
          {l.tip && <Znacka boja={l.boja}>{l.tip.replace(/^./, (c) => c.toUpperCase())}</Znacka>}
          {ha != null && <Znacka>{ha.toLocaleString("hr-HR")} ha</Znacka>}
        </div>
        {l.napomena && <p className="mt-4 text-[15px] text-tekst-2">{l.napomena}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Akcija ikona="uredi" oznaka="Uredi" onClick={() => otvori({ tip: "loviste", id: l.id })} />
          <Akcija ikona="poligon" oznaka={l.granica?.length ? "Uredi granicu" : "Ucrtaj granicu"} href={`/karta?granica=${l.id}`} />
          <Akcija ikona="lokacija" oznaka="Dodaj točku" onClick={() => otvori({ tip: "tocka", pocetno: { lovisteId: l.id } })} />
          <Akcija ikona="dnevnik" oznaka="Izlazak" onClick={() => otvori({ tip: "izlazak", pocetno: { lovisteId: l.id } })} />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setDijeli(true)}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-rub bg-povrsina-2 px-4 py-3 text-left transition-colors hover:border-naglasak"
        >
          <Ikona ime="korisnik" className="text-naglasak" />
          <span className="flex-1">
            <span className="block text-[14.5px] font-medium">Podijeli s lovcem</span>
            <span className="block text-[12.5px] text-tekst-3">Granica i točke na kartu prijatelja iz LD-a</span>
          </span>
          <Ikona ime="desno" velicina={16} className="text-tekst-3" />
        </motion.button>
        <PodijeliLoviste key={String(dijeli)} otvorena={dijeli} zatvori={() => setDijeli(false)} l={l} tocke={tocke} />

        <h3 className="mt-7 mb-2.5 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Točke u lovištu</h3>
        {tocke.length ? (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {tocke.map((t) => (
              <button key={t.id} onClick={() => otvori({ tip: "tocka", id: t.id })} className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3 py-2.5 text-left hover:bg-povrsina-3">
                <span className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-black/75" style={{ background: TIPOVI_TOCAKA[t.tip].boja }}>
                  {TIPOVI_TOCAKA[t.tip].slovo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{t.naziv}</span>
                  <span className="block text-[11.5px] text-tekst-3">{TIPOVI_TOCAKA[t.tip].naziv}</span>
                </span>
                <span className="brojke text-[12px] text-tekst-3">{baza.izlasci.filter((i) => i.tockaId === t.id).length}×</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-tekst-3">Nema točaka. Dodajte čeke, hranilišta i solišta na karti.</p>
        )}

        {poVrsti.length > 0 && (
          <>
            <h3 className="mt-7 mb-2.5 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Odstrel u lovištu</h3>
            <div className="grid gap-2">
              {poVrsti.map(([v, n]) => (
                <div key={v} className="flex items-center gap-3">
                  <span className="w-36 truncate text-[14px]">{v}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-povrsina-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: bojaVrste(v) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(n / poVrsti[0][1]) * 100}%` }}
                      transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="brojke w-6 text-right font-semibold">{n}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {izlasci.length > 0 && (
          <>
            <h3 className="mt-7 mb-2.5 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Zadnji izlasci</h3>
            <div className="grid gap-1.5">
              {izlasci.slice(0, 5).map((i) => (
                <button key={i.id} onClick={() => otvori({ tip: "detalj-izlazak", id: i.id })} className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-povrsina-2">
                  <span className="brojke w-16 text-[13px] text-tekst-3">{datumKratki(i.datum)}</span>
                  <span className="flex-1 truncate text-[14px]">
                    {i.od}
                    {i.do ? `–${i.do}` : ""} · {baza.tocke.find((t) => t.id === i.tockaId)?.naziv ?? "bez točke"}
                  </span>
                  <Ikona ime="desno" velicina={15} className="text-tekst-3" />
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

function Akcija({ ikona, oznaka, onClick, href }: { ikona: ImeIkone; oznaka: string; onClick?: () => void; href?: string }) {
  const sadrzaj = (
    <motion.span
      whileTap={{ scale: 0.95 }}
      className={cx("flex h-full flex-col items-center gap-1.5 rounded-2xl border border-rub bg-povrsina-2 px-2 py-3 text-center text-[12.5px] font-medium transition-colors hover:border-naglasak hover:text-naglasak")}
    >
      <Ikona ime={ikona} />
      {oznaka}
    </motion.span>
  );
  return href ? (
    <Link href={href} transitionTypes={["naprijed"]}>
      {sadrzaj}
    </Link>
  ) : (
    <button onClick={onClick}>{sadrzaj}</button>
  );
}
