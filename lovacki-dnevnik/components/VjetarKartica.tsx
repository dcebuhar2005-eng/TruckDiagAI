"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { sat } from "@/lib/format";
import {
  beaufort,
  opisVremena,
  promjenaSmjera,
  smjerVjetra,
  trendTlaka,
  vjetarZaLov,
  type Prognoza,
} from "@/lib/vrijeme";
import Ikona from "./Ikona";
import { cx } from "./ui";

const PUNI = ["sjevera", "sjeveroistoka", "istoka", "jugoistoka", "juga", "jugozapada", "zapada", "sjeverozapada"];
const STRANE = ["sjeverne", "sjeveroistočne", "istočne", "jugoistočne", "južne", "jugozapadne", "zapadne", "sjeverozapadne"];
/** Prijedlog „s" ili „sa" (sa ispred s, š, z, ž). */
const sa = (rijec: string) => (/^[sšzž]/i.test(rijec) ? "sa" : "s");
const osmina = (st: number) => Math.round((((st % 360) + 360) % 360) / 45) % 8;

/** Kompas: strelice struje u smjeru u kojem vjetar puše; oznaka na rubu pokazuje odakle dolazi. */
function Kompas({ smjer, brzina }: { smjer: number; brzina: number }) {
  const prema = (smjer + 180) % 360;
  // Brži vjetar = brže strujanje (između 0,9 s i 3 s po prolazu).
  const trajanje = Math.max(0.9, 3 - brzina / 15);
  const linije = [-36, -22, -8, 6, 20, 34];
  return (
    <div className="relative size-[168px] shrink-0">
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        <defs>
          <radialGradient id="kompas-poz" cx="50%" cy="45%">
            <stop offset="0" stopColor="var(--povrsina-3)" />
            <stop offset="1" stopColor="var(--povrsina-2)" />
          </radialGradient>
          <clipPath id="kompas-krug">
            <circle cx="100" cy="100" r="74" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#kompas-poz)" stroke="var(--rub-jaki)" />
        {Array.from({ length: 72 }, (_, i) => (
          <line
            key={i}
            x1="100"
            y1="6"
            x2="100"
            y2={i % 18 === 0 ? 18 : i % 2 === 0 ? 12 : 9}
            stroke="var(--tekst-3)"
            strokeWidth={i % 18 === 0 ? 2 : 1}
            strokeOpacity={i % 18 === 0 ? 0.9 : 0.35}
            transform={`rotate(${i * 5} 100 100)`}
          />
        ))}
        {[
          ["S", 0],
          ["I", 90],
          ["J", 180],
          ["Z", 270],
        ].map(([t, k]) => (
          <text
            key={t as string}
            x={100 + 70 * Math.sin(((k as number) * Math.PI) / 180)}
            y={104 - 70 * Math.cos(((k as number) * Math.PI) / 180)}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill={t === "S" ? "var(--naglasak)" : "var(--tekst-2)"}
          >
            {t}
          </text>
        ))}
        {/* Strujanje zraka */}
        <g clipPath="url(#kompas-krug)" transform={`rotate(${prema} 100 100)`} opacity="0.55">
          {linije.map((x, i) => (
            <line key={x} x1={100 + x} y1="0" x2={100 + x} y2="22" stroke="var(--naglasak)" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="y1" values="200;0" dur={`${trajanje}s`} begin={`${(i * trajanje) / linije.length}s`} repeatCount="indefinite" />
              <animate attributeName="y2" values="222;22" dur={`${trajanje}s`} begin={`${(i * trajanje) / linije.length}s`} repeatCount="indefinite" />
            </line>
          ))}
        </g>
      </svg>
      {/* Oznaka odakle puše */}
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: smjer - 120 }}
        animate={{ rotate: smjer }}
        transition={{ type: "spring", stiffness: 50, damping: 12 }}
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0">
          <path d="M100 24 L111 4 L89 4 Z" fill="var(--naglasak)" />
        </svg>
      </motion.div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid size-[86px] place-items-center rounded-full border border-rub bg-povrsina/90 text-center shadow-meka backdrop-blur">
          <div>
            <div className="brojke font-display text-[30px] leading-none font-semibold">{Math.round(brzina)}</div>
            <div className="text-[11px] text-tekst-3">km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Brzina vjetra po satu (površina) i udari (isprekidano) za sljedećih 12 sati. */
function Satnica({ p }: { p: Prognoza }) {
  const sati = p.satno.filter((s) => s.vrijeme.getTime() > p.dohvaceno - 3600000).slice(0, 13);
  const [odabran, setOdabran] = useState(0);
  if (sati.length < 2) return null;
  const maks = Math.max(10, ...sati.map((s) => s.udari));
  const W = 360;
  const H = 74;
  const x = (i: number) => 14 + (i * (W - 28)) / (sati.length - 1);
  const y = (v: number) => H - 4 - (v / maks) * (H - 14);
  const brzine = sati.map((s, i) => `${x(i)},${y(s.vjetarBrzina)}`).join(" ");
  const odabrani = sati[odabran];
  return (
    <div className="mt-5">
      <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <span className="text-[12px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Sljedećih 12 sati · kamo puše</span>
        <span className="brojke text-[12.5px] text-tekst-2">
          <span className="font-medium text-tekst">{odabran === 0 ? "Sada" : sat(odabrani.vrijeme)}</span> · iz {smjerVjetra(odabrani.vjetarSmjer)} ·{" "}
          {Math.round(odabrani.vjetarBrzina)} km/h · udari {Math.round(odabrani.udari)}
        </span>
      </div>
      <svg viewBox={`0 -2 ${W} ${H + 42}`} className="w-full" onMouseLeave={() => setOdabran(0)}>
        <defs>
          <linearGradient id="vjetar-povrsina" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--naglasak)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--naglasak)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Strelice smjera (kamo puše) */}
        {sati.map((s, i) => (
          <g key={`s${i}`} transform={`translate(${x(i)} 10) rotate(${(s.vjetarSmjer + 180) % 360})`}>
            <line x1="0" y1="7" x2="0" y2="-3" stroke={i === odabran ? "var(--naglasak)" : "var(--tekst-2)"} strokeWidth="2" strokeLinecap="round" />
            <path d="M0 -8 L4.5 -1.5 L-4.5 -1.5 Z" fill={i === odabran ? "var(--naglasak)" : "var(--tekst-2)"} />
          </g>
        ))}
        <g transform="translate(0 22)">
          <line x1="0" x2={W} y1={H - 4} y2={H - 4} stroke="var(--rub-jaki)" />
          <polygon points={`${x(0)},${H - 4} ${brzine} ${x(sati.length - 1)},${H - 4}`} fill="url(#vjetar-povrsina)" />
          <polyline points={sati.map((s, i) => `${x(i)},${y(s.udari)}`).join(" ")} fill="none" stroke="var(--tekst-3)" strokeWidth="1.5" strokeDasharray="3 4" />
          <polyline points={brzine} fill="none" stroke="var(--naglasak)" strokeWidth="2.2" strokeLinejoin="round" />
          <line x1={x(odabran)} x2={x(odabran)} y1="0" y2={H - 4} stroke="var(--tekst-3)" strokeOpacity="0.5" />
          <circle cx={x(odabran)} cy={y(odabrani.vjetarBrzina)} r="4.5" fill="var(--naglasak)" stroke="var(--povrsina)" strokeWidth="2" />
          {sati.map((s, i) =>
            i % 3 === 0 ? (
              <text key={`t${i}`} x={x(i)} y={H + 12} textAnchor="middle" fontSize="10.5" fill="var(--tekst-3)">
                {i === 0 ? "sada" : `${s.vrijeme.getHours()}h`}
              </text>
            ) : null,
          )}
          {/* Područja za dodir/hover */}
          {sati.map((_, i) => (
            <rect
              key={`h${i}`}
              x={x(i) - (W - 28) / (sati.length - 1) / 2}
              y="-22"
              width={(W - 28) / (sati.length - 1)}
              height={H + 40}
              fill="transparent"
              onMouseEnter={() => setOdabran(i)}
              onClick={() => setOdabran(i)}
            />
          ))}
        </g>
      </svg>
      <div className="mt-1 flex gap-4 text-[11.5px] text-tekst-3">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-naglasak" /> brzina
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-[1.5px] border-dashed border-tekst-3" /> udari
        </span>
      </div>
    </div>
  );
}

export default function VjetarKartica({ p }: { p: Prognoza }) {
  const t = p.trenutno;
  const smjer = t.vjetarSmjer ?? 0;
  const brzina = t.vjetarBrzina ?? 0;
  const bf = beaufort(brzina);
  const lov = vjetarZaLov(brzina);
  const iz = osmina(smjer);
  const prema = (iz + 4) % 8;
  const buduci = p.satno.filter((s) => s.vrijeme.getTime() > p.dohvaceno - 3600000);
  const promjena = promjenaSmjera(buduci);
  const trend = trendTlaka(p);

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex justify-center md:justify-start">
          <Kompas smjer={smjer} brzina={brzina} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] text-tekst-3">Vjetar puše</div>
          <div className="font-display text-[26px] leading-tight font-semibold">
            {sa(PUNI[iz]).replace(/^./, (c) => c.toUpperCase())} {PUNI[iz]}
            <span className="brojke ml-2 text-[15px] font-normal text-tekst-3">{Math.round(smjer)}°</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-povrsina-2 px-2.5 py-1 text-[12.5px]">
              <span className="brojke font-semibold">{bf.stupanj} Bf</span> · {bf.naziv}
            </span>
            <span className="brojke rounded-full bg-povrsina-2 px-2.5 py-1 text-[12.5px]">Udari {Math.round(t.udari ?? brzina)} km/h</span>
            <span
              className={cx(
                "rounded-full px-2.5 py-1 text-[12.5px] font-medium",
                lov.ocjena === "dobar" && "bg-mahovina-meka text-mahovina",
                lov.ocjena === "nestalan" && "bg-naglasak-meki text-naglasak",
                (lov.ocjena === "jak" || lov.ocjena === "nepovoljan") && "bg-opasnost-meka text-opasnost",
              )}
            >
              {lov.ocjena === "dobar" ? "Povoljan za čeku" : lov.ocjena === "nestalan" ? "Nestalan" : lov.ocjena === "jak" ? "Jak" : "Nepovoljan"}
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-rub bg-povrsina-2 p-3 text-[13.5px] leading-snug">
            <div className="flex gap-2">
              <Ikona ime="meta" velicina={16} className="mt-0.5 shrink-0 text-naglasak" />
              <span>
                Divljač očekujte {sa(STRANE[iz])} <b>{STRANE[iz]}</b> strane. Čeki prilazite {sa(STRANE[prema])} <b>{STRANE[prema]}</b> strane, s vjetrom u lice – vaš miris
                odlazi prema {PUNI[prema].replace(/a$/, "u")}.
              </span>
            </div>
            <p className="mt-1.5 pl-6 text-[12.5px] text-tekst-2">{lov.opis}</p>
          </div>

          <div
            className={cx(
              "mt-2 flex items-center gap-2 text-[13px]",
              promjena ? "text-naglasak" : "text-tekst-2",
            )}
          >
            <Ikona ime={promjena ? "upozorenje" : "kvacica"} velicina={15} />
            {promjena
              ? `Oko ${sat(promjena.vrijeme)} okreće na ${smjerVjetra(promjena.vjetarSmjer)} – zona mirisa se mijenja.`
              : "Smjer stabilan sljedećih 8 sati."}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-rub pt-3 text-[13px] text-tekst-2">
        <span className="font-medium text-tekst">
          {Math.round(t.temperatura ?? 0)}° {opisVremena(t.kod).toLowerCase()}
        </span>
        <span className="brojke">
          Tlak {Math.round(t.tlak ?? 0)} hPa {trend.opis === "raste" ? "↗" : trend.opis === "pada" ? "↘" : "→"}
        </span>
        <span className="brojke">Vlaga {t.vlaga ?? "–"} %</span>
        <span className="brojke">Naoblaka {t.oblacnost ?? "–"} %</span>
      </div>

      <Satnica p={p} />
    </div>
  );
}
