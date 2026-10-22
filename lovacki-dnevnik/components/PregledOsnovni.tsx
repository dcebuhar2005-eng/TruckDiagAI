"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import Ikona from "./Ikona";
import { FazaMjeseca, TrakaDana } from "./Nebo";
import { cx, djeteListe } from "./ui";
import { mjesec, mjesecevaVremena, solunar, suncevaVremena } from "@/lib/astro";
import { sat, trajanje } from "@/lib/format";

/** Dijelovi Pregleda u besplatnoj verziji: Mjesec sa solunarom i svjetlo danas (u PRO ih zamjenjuje tijek dana). */
function useAstro(lat: number, lng: number) {
  const danas = useMemo(() => new Date(), []);
  return useMemo(
    () => ({ danas, sv: suncevaVremena(danas, lat, lng), mv: mjesecevaVremena(danas, lat, lng), m: mjesec(danas), sol: solunar(danas, lat, lng) }),
    [danas, lat, lng],
  );
}

export function AktivnostDivljaci({ lat, lng }: { lat: number; lng: number }) {
  const astro = useAstro(lat, lng);
  return (
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
        <p className="mt-3 text-[12.5px] text-tekst-3">Mlađak: Mjesec izlazi i zalazi blizu Sunca, pa se danju ne vidi, a noć je potpuno tamna.</p>
      )}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-povrsina-2 p-3.5">
        <div>
          <div className="text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">Solunarna ocjena</div>
          <div className="font-medium">{astro.sol.opis}</div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 400, damping: 15 }}>
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

export function SvjetloDanas({ lat, lng }: { lat: number; lng: number }) {
  const astro = useAstro(lat, lng);
  return (
    <motion.section variants={djeteListe} className="kartica p-5 lg:col-span-3">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="mr-auto text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Svjetlo danas</h2>
        <Vrijeme oznaka="Zora" v={sat(astro.sv.zora)} />
        <Vrijeme oznaka="Izlazak" v={sat(astro.sv.izlazak)} naglaseno />
        <Vrijeme oznaka="Zalazak" v={sat(astro.sv.zalazak)} naglaseno />
        <Vrijeme oznaka="Sumrak" v={sat(astro.sv.sumrak)} />
        <Vrijeme oznaka="Dan" v={trajanje(astro.sv.duljinaDana)} />
      </div>
      <TrakaDana sv={astro.sv} razdoblja={astro.sol.razdoblja} datum={astro.danas} />
      <p className="mt-3 text-[12px] text-tekst-3">
        Žuti stupci označavaju glavna (viša) i sporedna solunarna razdoblja. Zora i sumrak su građanski (Sunce 6° ispod obzora).
      </p>
    </motion.section>
  );
}
