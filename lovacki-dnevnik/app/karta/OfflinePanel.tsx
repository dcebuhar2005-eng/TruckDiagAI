"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import Ikona from "@/components/Ikona";
import { cx, obavijest, opruga } from "@/components/ui";
import { datumKratki } from "@/lib/format";
import {
  MAKS_PLOCICA,
  type Granice,
  type Napredak,
  type SlojZaPreuzimanje,
  obrisiPodrucje,
  preuzmiPodrucje,
  procjenaMB,
  urloviPlocica,
  useOfflinePodrucja,
} from "@/lib/offline";
import type { Loviste } from "@/lib/types";
import { predmemorirajPuteve } from "./SumskiPutevi";

export interface PodlogaZaOffline {
  kljuc: string;
  naziv: string;
  slojevi: SlojZaPreuzimanje[];
}

const ZOOMOVI = [
  { z: 15, opis: "Pregled" },
  { z: 16, opis: "Detaljno" },
  { z: 17, opis: "Vrlo detaljno" },
];

function prosiri(g: Granice, m: number): Granice {
  const dLat = m / 111320;
  const dLng = m / (111320 * Math.cos((((g.j + g.s) / 2) * Math.PI) / 180));
  return { j: g.j - dLat, s: g.s + dLat, z: g.z - dLng, i: g.i + dLng };
}

/** Ploča za spremanje područja karte na uređaj (rad bez signala u lovištu). */
export default function OfflinePanel({
  vidljivo,
  lovista,
  podloge,
  zadana,
  zatvori,
  pokazi,
}: {
  vidljivo: Granice | null;
  lovista: Loviste[];
  podloge: PodlogaZaOffline[];
  zadana: string;
  zatvori: () => void;
  pokazi: (g: Granice) => void;
}) {
  const spremljena = useOfflinePodrucja();
  const sGranicom = lovista.filter((l) => (l.granica?.length ?? 0) > 2);
  const [izvor, setIzvor] = useState<string>(sGranicom[0]?.id ?? "vidljivo");
  const [podloga, setPodloga] = useState(podloge.find((p) => p.kljuc === zadana)?.kljuc ?? podloge[0].kljuc);
  const [zoom, setZoom] = useState(16);
  const [napredak, setNapredak] = useState<Napredak | null>(null);
  const kontrola = useRef<AbortController | null>(null);

  const odabrano = useMemo(() => {
    if (izvor === "vidljivo") return vidljivo ? { naziv: "Odabrano područje", g: vidljivo } : null;
    const l = sGranicom.find((x) => x.id === izvor);
    if (!l?.granica) return null;
    const lat = l.granica.map((p) => p[0]);
    const lng = l.granica.map((p) => p[1]);
    return { naziv: l.naziv, g: prosiri({ j: Math.min(...lat), s: Math.max(...lat), z: Math.min(...lng), i: Math.max(...lng) }, 300) };
  }, [izvor, vidljivo, sGranicom]);

  const pod = podloge.find((p) => p.kljuc === podloga)!;
  const broj = odabrano ? urloviPlocica(odabrano.g, pod.slojevi, 10, zoom).length : 0;
  const prevelik = broj > MAKS_PLOCICA;

  const preuzmi = async () => {
    if (!odabrano || prevelik) return;
    const k = new AbortController();
    kontrola.current = k;
    setNapredak({ gotovo: 0, ukupno: broj, greske: 0 });
    try {
      const { greske } = await preuzmiPodrucje(
        { naziv: odabrano.naziv, granice: odabrano.g, podloga: pod.kljuc, nazivPodloge: pod.naziv, maksZoom: zoom },
        pod.slojevi,
        setNapredak,
        k.signal,
      );
      await predmemorirajPuteve(odabrano.g, k.signal).catch(() => {});
      obavijest(greske ? `Spremljeno uz ${greske} nedostupnih pločica` : `„${odabrano.naziv}” je spremljeno za rad bez signala`, greske ? "info" : "uspjeh");
    } catch (e) {
      if ((e as Error).name !== "AbortError") obavijest((e as Error).message || "Preuzimanje nije uspjelo", "greska");
    } finally {
      setNapredak(null);
      kontrola.current = null;
    }
  };

  const slojeviZa = (k: string) => podloge.find((p) => p.kljuc === k)?.slojevi ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={opruga}
      style={{ transformOrigin: "top right" }}
      className="absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] right-3 z-[650] max-h-[calc(100dvh-14rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d130e]/94 p-3.5 text-white shadow-jaka backdrop-blur-xl md:top-20 md:right-5"
    >
      <div className="mb-1 flex items-center">
        <span className="flex-1 font-semibold">Karta bez signala</span>
        <button onClick={zatvori} className="p-1 text-white/50 hover:text-white" aria-label="Zatvori">
          <Ikona ime="x" velicina={16} />
        </button>
      </div>
      <p className="mb-3 text-[12.5px] text-white/60">Spremite lovište na mobitel prije odlaska – karta, šumski putevi i vaše točke radit će i bez interneta.</p>

      <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Područje</div>
      <div className="mb-3 grid gap-1">
        {sGranicom.map((l) => (
          <Izbor key={l.id} aktivan={izvor === l.id} onClick={() => setIzvor(l.id)}>
            <span className="size-2.5 rounded-full" style={{ background: l.boja }} /> {l.naziv}
          </Izbor>
        ))}
        <Izbor aktivan={izvor === "vidljivo"} onClick={() => setIzvor("vidljivo")}>
          <Ikona ime="karta" velicina={14} /> Ono što sada vidim na karti
        </Izbor>
      </div>

      <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Podloga</div>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {podloge.map((p) => (
          <button
            key={p.kljuc}
            onClick={() => setPodloga(p.kljuc)}
            className={cx("rounded-xl border px-2 py-2 text-[12.5px]", podloga === p.kljuc ? "border-[#e8a947] bg-[#e8a947]/15" : "border-white/10 hover:bg-white/5")}
          >
            {p.naziv}
          </button>
        ))}
      </div>

      <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Detalji</div>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {ZOOMOVI.map((z) => (
          <button
            key={z.z}
            onClick={() => setZoom(z.z)}
            className={cx("rounded-xl border px-1.5 py-2 text-[12px] leading-tight", zoom === z.z ? "border-[#e8a947] bg-[#e8a947]/15" : "border-white/10 hover:bg-white/5")}
          >
            {z.opis}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {napredak ? (
          <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-1.5 flex justify-between text-[12.5px] text-white/70">
              <span>Preuzimam…</span>
              <span className="brojke">
                {napredak.gotovo} / {napredak.ukupno}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-[#e8a947]" animate={{ width: `${(napredak.gotovo / Math.max(1, napredak.ukupno)) * 100}%` }} />
            </div>
            <button onClick={() => kontrola.current?.abort()} className="mt-2.5 w-full rounded-xl border border-white/15 py-2 text-[13px]">
              Prekini
            </button>
          </motion.div>
        ) : (
          <motion.div key="g" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={cx("mb-2 text-[12.5px]", prevelik ? "text-[#ff8a80]" : "text-white/60")}>
              {odabrano
                ? prevelik
                  ? "Područje je preveliko – smanjite detalje ili približite kartu."
                  : `${broj.toLocaleString("hr-HR")} pločica · oko ${procjenaMB(broj)} MB`
                : "Pomaknite kartu na područje lova."}
            </div>
            <div className="flex gap-2">
              {odabrano && (
                <button onClick={() => pokazi(odabrano.g)} className="rounded-xl border border-white/15 px-3 text-[13px]" aria-label="Prikaži područje">
                  <Ikona ime="oko" velicina={16} />
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!odabrano || prevelik}
                onClick={preuzmi}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#e8a947] text-[14px] font-semibold text-[#17130a] disabled:opacity-40"
              >
                <Ikona ime="preuzmi" velicina={17} /> Spremi na mobitel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {spremljena.length > 0 && (
        <>
          <div className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Spremljeno</div>
          <div className="grid gap-1.5">
            {spremljena.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2.5">
                <button className="min-w-0 flex-1 text-left" onClick={() => pokazi(p.granice)}>
                  <div className="truncate text-[13.5px] font-medium">{p.naziv}</div>
                  <div className="brojke text-[11.5px] text-white/50">
                    {p.nazivPodloge} · {Math.max(1, Math.round(p.bajtova / 1048576))} MB · {datumKratki(new Date(p.datum))}
                  </div>
                </button>
                <button
                  onClick={() => obrisiPodrucje(p.id, slojeviZa).then(() => obavijest("Spremljeno područje je obrisano", "info"))}
                  className="grid size-8 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-[#ff8a80]"
                  aria-label={`Obriši ${p.naziv}`}
                >
                  <Ikona ime="smece" velicina={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="mt-3 text-[11px] text-white/40">
        Bez signala rade samo podloge ponuđene ovdje (Esri). HR ortofoto, TK25, Reljef i Putevi trebaju internet.
      </p>
    </motion.div>
  );
}

function Izbor({ aktivan, onClick, children }: { aktivan: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13.5px]",
        aktivan ? "border-[#e8a947] bg-[#e8a947]/15" : "border-white/10 hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}
