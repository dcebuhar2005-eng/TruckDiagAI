"use client";

import { useMemo, useState } from "react";
import { danUTjednu, datumKratki, sat } from "@/lib/format";
import { izgledLova, najboljiTermin, type Termin } from "@/lib/izgledLova";
import { smjerVjetra, type Prognoza } from "@/lib/vrijeme";
import { cx } from "./ui";

const BOJA: Record<Termin["oznaka"], string> = {
  Odlično: "#7fd37a",
  Dobro: "#c3d66a",
  Osrednje: "#e8a640",
  Loše: "#ff7a5c",
};

function nazivDana(d: Date) {
  const danas = new Date();
  const razlika = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(danas).setHours(0, 0, 0, 0)) / 86400e3);
  if (razlika === 0) return "Danas";
  if (razlika === 1) return "Sutra";
  const dan = danUTjednu(d).slice(0, 3);
  return `${dan[0].toUpperCase()}${dan.slice(1)} ${datumKratki(d)}`;
}

function Cip({ t }: { t: Termin | null }) {
  if (!t) return <div className="flex-1 rounded-xl bg-povrsina-2/50 py-2 text-center text-[12px] text-tekst-3">prošlo</div>;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5" style={{ background: `${BOJA[t.oznaka]}1f` }}>
      <span className="brojke grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-[#17130a]" style={{ background: BOJA[t.oznaka] }}>
        {t.ocjena}
      </span>
      <span className="brojke flex min-w-0 items-center gap-1 text-[12px] whitespace-nowrap text-tekst-2">
        <svg width="11" height="11" viewBox="0 0 24 24" className="shrink-0" style={{ transform: `rotate(${t.vjetarSmjer + 180}deg)` }} aria-hidden>
          <path d="M12 2l6 18-6-4-6 4z" fill="currentColor" />
        </svg>
        {smjerVjetra(t.vjetarSmjer)} {Math.round(t.vjetarBrzina)}
      </span>
    </div>
  );
}

/** Kad u lov? – ocjena jutra i večeri za sljedećih 8 dana na lokaciji lovišta. */
export default function KadULov({ p, lat, lng }: { p: Prognoza; lat: number; lng: number }) {
  const dani = useMemo(() => izgledLova(p.satno, lat, lng), [p, lat, lng]);
  const naj = useMemo(() => najboljiTermin(dani), [dani]);
  const [otvoren, setOtvoren] = useState<number | null>(null);
  if (!dani.length) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Kad u lov?</h2>
        <span className="text-[12px] text-tekst-3">{dani.length} dana · jutro i večer</span>
      </div>
      {naj && (
        <div className="mb-3 rounded-2xl border border-naglasak/40 bg-naglasak-meki p-3.5">
          <div className="text-[12px] font-medium tracking-wide text-naglasak uppercase">Najbolji termin</div>
          <div className="mt-0.5 font-display text-[19px] leading-tight font-semibold">
            {nazivDana(naj.dan.datum)} {naj.dio === "jutro" ? "ujutro" : "navečer"} · {naj.t.oznaka.toLowerCase()} ({naj.t.ocjena})
          </div>
          <div className="mt-1 text-[12.5px] text-tekst-2">
            {sat(naj.t.od)}–{sat(naj.t.do)} · {naj.t.razlozi.slice(0, 2).join(" · ")}
          </div>
        </div>
      )}
      <div className="mb-1 flex gap-2 text-[11.5px] font-medium tracking-wide text-tekst-3 uppercase">
        <span className="w-[66px] shrink-0" />
        <span className="flex-1">Jutro</span>
        <span className="flex-1">Večer</span>
      </div>
      <ul className="grid gap-1.5">
        {dani.map((d, i) => (
          <li key={i}>
            <button onClick={() => setOtvoren(otvoren === i ? null : i)} aria-expanded={otvoren === i} className="flex w-full items-center gap-2 text-left">
              <span className="w-[66px] shrink-0 text-[13px] leading-tight font-medium">{nazivDana(d.datum)}</span>
              <Cip t={d.jutro} />
              <Cip t={d.vecer} />
            </button>
            {otvoren === i && (
              <div className="mt-1.5 mb-1 grid gap-2 rounded-xl bg-povrsina-2 p-3 text-[12.5px] sm:grid-cols-2">
                {(["jutro", "vecer"] as const).map((dio) => {
                  const t = d[dio];
                  if (!t) return null;
                  return (
                    <div key={dio}>
                      <div className="font-medium">
                        {dio === "jutro" ? "Jutro" : "Večer"} {sat(t.od)}–{sat(t.do)}
                      </div>
                      <div className="brojke text-tekst-3">
                        {Math.round(t.temperatura)} °C · udari {Math.round(t.udari)} km/h · kiša {Math.round(t.oborine)} %
                      </div>
                      <ul className="mt-1 grid gap-0.5 text-tekst-2">
                        {t.razlozi.map((r) => (
                          <li key={r} className={cx("flex gap-1.5")}>
                            <span className="text-tekst-3">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11.5px] text-tekst-3">Ocjena 0–100 iz prognoze vjetra (km/h), kiše, tlaka i Mjeseca za vaše lovište. Dodirnite dan za razloge.</p>
    </div>
  );
}
