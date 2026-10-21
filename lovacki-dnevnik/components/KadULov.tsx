"use client";

import { useMemo } from "react";
import { danUTjednu, datumKratki, sat } from "@/lib/format";
import { izgledLova, najboljiTermin, type Termin } from "@/lib/izgledLova";
import type { Prognoza } from "@/lib/vrijeme";

const IZGLED: Record<Termin["oznaka"], { znak: string; boja: string }> = {
  Odlično: { znak: "✅", boja: "#7fd37a" },
  Dobro: { znak: "👍", boja: "#c3d66a" },
  Slabije: { znak: "🤏", boja: "#e8a640" },
  Loše: { znak: "❌", boja: "#ff7a5c" },
};

function nazivDana(d: Date, puni = false) {
  const razlika = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400e3);
  if (razlika === 0) return "Danas";
  if (razlika === 1) return "Sutra";
  const dan = puni ? danUTjednu(d) : `${danUTjednu(d).slice(0, 3)} ${datumKratki(d)}`;
  return dan[0].toUpperCase() + dan.slice(1);
}

function Red({ dio, t }: { dio: string; t: Termin | null }) {
  if (!t) return null;
  const iz = IZGLED[t.oznaka];
  return (
    <div className="flex items-baseline gap-2 text-[14px]">
      <span className="w-12 shrink-0 text-[12.5px] text-tekst-3">{dio}</span>
      <span className="shrink-0">{iz.znak}</span>
      <span className="min-w-0">
        <b className="font-semibold" style={{ color: iz.boja }}>
          {t.oznaka}
        </b>
        <span className="text-tekst-2"> – {t.ukratko}</span>
      </span>
    </div>
  );
}

/** Kad u lov? – za svaki od sljedećih dana jednostavno: ide li se ujutro i navečer i zašto. */
export default function KadULov({ p, lat, lng }: { p: Prognoza; lat: number; lng: number }) {
  const dani = useMemo(() => izgledLova(p.satno, lat, lng), [p, lat, lng]);
  const naj = useMemo(() => najboljiTermin(dani), [dani]);
  if (!dani.length) return null;

  return (
    <div>
      <h2 className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Kad u lov?</h2>
      {naj && naj.t.oznaka !== "Loše" && (
        <div className="mb-4 rounded-2xl border border-naglasak/40 bg-naglasak-meki p-4">
          <div className="font-display text-[20px] leading-tight font-semibold">
            🎯 Najbolje: {nazivDana(naj.dan.datum, true).toLowerCase()} {naj.dio === "jutro" ? "ujutro" : "navečer"}
          </div>
          <div className="mt-1 text-[14px] text-tekst-2">
            {naj.t.ukratko[0].toUpperCase() + naj.t.ukratko.slice(1)} · budite na čeki {sat(naj.t.od)}–{sat(naj.t.do)}
          </div>
        </div>
      )}
      <ul className="grid gap-2">
        {dani.map((d, i) => (
          <li key={i} className="rounded-2xl bg-povrsina-2 px-3.5 py-2.5">
            <div className="mb-1 text-[13.5px] font-semibold">{nazivDana(d.datum)}</div>
            <div className="grid gap-1">
              <Red dio="Jutro" t={d.jutro} />
              <Red dio="Večer" t={d.vecer} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11.5px] text-tekst-3">Prema prognozi vjetra, kiše i Mjeseca za vaše lovište.</p>
    </div>
  );
}
