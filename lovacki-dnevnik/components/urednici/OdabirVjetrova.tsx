"use client";

import { motion } from "framer-motion";
import { STRANE, opisVjetrova } from "@/lib/vjetarCeke";

const R = 92;
const r0 = 30;

function isjecak(s: number) {
  const tocka = (kut: number, rad: number) => {
    const a = ((kut - 90) * Math.PI) / 180;
    return `${100 + rad * Math.cos(a)} ${100 + rad * Math.sin(a)}`;
  };
  const a = s - 21;
  const b = s + 21;
  return `M${tocka(a, r0)} L${tocka(a, R)} A${R} ${R} 0 0 1 ${tocka(b, R)} L${tocka(b, r0)} A${r0} ${r0} 0 0 0 ${tocka(a, r0)}Z`;
}

function oznaka(s: number) {
  const a = ((s - 90) * Math.PI) / 180;
  return { x: 100 + 62 * Math.cos(a), y: 100 + 62 * Math.sin(a) };
}

/** Kompas s osam isječaka: korisnik označi strane s kojih vjetar odgovara čeki. */
export default function OdabirVjetrova({ vrijednost, promjena }: { vrijednost: number[]; promjena: (v: number[]) => void }) {
  const prebaci = (s: number) =>
    promjena(vrijednost.includes(s) ? vrijednost.filter((x) => x !== s) : [...vrijednost, s].sort((a, b) => a - b));

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <svg viewBox="0 0 200 200" className="size-[210px] shrink-0 touch-manipulation select-none">
        <circle cx="100" cy="100" r={R + 4} fill="var(--povrsina-2)" stroke="var(--rub)" />
        {STRANE.map((st) => {
          const on = vrijednost.includes(st.s);
          const o = oznaka(st.s);
          return (
            <g key={st.s} role="button" aria-label={`Vjetar ${st.naziv}`} aria-pressed={on} onClick={() => prebaci(st.s)} className="cursor-pointer">
              <motion.path
                d={isjecak(st.s)}
                initial={false}
                animate={{ fill: on ? "#6fbf73" : "rgba(127,127,127,0.10)", opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                style={{ transformOrigin: "100px 100px" }}
                stroke="var(--pozadina)"
                strokeWidth="2"
              />
              <text
                x={o.x}
                y={o.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none text-[15px] font-bold"
                fill={on ? "#0b100c" : "var(--tekst-2)"}
              >
                {st.kratko}
              </text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r={r0 - 4} fill="var(--povrsina)" stroke="var(--rub)" />
        <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--naglasak)">
          VI
        </text>
      </svg>
      <div className="text-[13px] text-tekst-2">
        <p>
          Dodirnite strane <b className="text-tekst">s kojih vjetar smije puhati</b>. Dobar je vjetar koji vaš miris nosi dalje
          od mjesta gdje divljač dolazi – obično puše od divljači prema vama.
        </p>
        <p className="mt-2 brojke">
          Odabrano: <span className="font-medium text-tekst">{opisVjetrova(vrijednost)}</span>
        </p>
      </div>
    </div>
  );
}
