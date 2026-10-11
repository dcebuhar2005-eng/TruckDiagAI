"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Ikona from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { otvori } from "@/components/urednici/kontroler";
import { Gumb, Naslov, PraznoStanje, cx, djeteListe, roditeljListe } from "@/components/ui";
import { TIPOVI_DOZVOLA, bojaVrste } from "@/lib/katalog";
import { datumDugi, izIso, mnozina } from "@/lib/format";
import { useBaza } from "@/lib/store";
import type { Baza, Dozvola, TipDozvole } from "@/lib/types";
import { iskoristenostKvote, nazivLovista, statusDozvole, type StatusDozvole } from "@/lib/upiti";

const GRADIJENTI: Record<TipDozvole, [string, string]> = {
  "lovacka-iskaznica": ["#2f4a2a", "#13200f"],
  "dozvola-za-lov": ["#5a3f17", "#21170a"],
  "oruzni-list": ["#2c3440", "#12161c"],
  osiguranje: ["#1f3d48", "#0c1a1f"],
  clanarina: ["#3e2b47", "#1a1220"],
  ispit: ["#40391f", "#1c190c"],
  ostalo: ["#333", "#151515"],
};

const STATUS: Record<StatusDozvole, { oznaka: string; klasa: string }> = {
  valjana: { oznaka: "Valjana", klasa: "bg-[#8cbf6e]/20 text-[#b6e09c]" },
  istice: { oznaka: "Uskoro ističe", klasa: "bg-[#e8a947]/25 text-[#f5c879]" },
  istekla: { oznaka: "Istekla", klasa: "bg-[#e2735f]/25 text-[#f4a191]" },
  buduca: { oznaka: "Još ne vrijedi", klasa: "bg-white/15 text-white/80" },
  "bez-roka": { oznaka: "Bez roka", klasa: "bg-white/15 text-white/80" },
};

export default function Dozvole() {
  const baza = useBaza();
  if (!baza) return <Kostur />;

  const poredak: StatusDozvole[] = ["istekla", "istice", "valjana", "buduca", "bez-roka"];
  const dozvole = [...baza.dozvole].sort((a, b) => poredak.indexOf(statusDozvole(a).status) - poredak.indexOf(statusDozvole(b).status));
  const problem = dozvole.filter((d) => ["istekla", "istice"].includes(statusDozvole(d).status)).length;

  return (
    <div>
      <Naslov
        natpis="Dokumenti"
        naslov="Dozvole i kvote"
        opis={
          problem
            ? `${problem} ${mnozina(problem, "dokument zahtijeva", "dokumenta zahtijevaju", "dokumenata zahtijeva")} pažnju.`
            : "Lovačka iskaznica, dozvole za lov, oružni list i osiguranje – s rokovima i kvotama."
        }
        akcija={
          <Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "dozvola" })}>
            Dodaj dokument
          </Gumb>
        }
      />

      {dozvole.length === 0 ? (
        <PraznoStanje
          ikona="dozvola"
          naslov="Nema dokumenata"
          opis="Dodajte dozvole i dokumente kako biste dobili upozorenje prije isteka i pratili kvote odstrela."
          akcija={<Gumb vrsta="primarni" ikona="plus" onClick={() => otvori({ tip: "dozvola" })}>Dodaj dokument</Gumb>}
        />
      ) : (
        <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-5 md:grid-cols-2">
          {dozvole.map((d) => (
            <motion.div key={d.id} variants={djeteListe} layout>
              <KarticaDozvole d={d} baza={baza} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="mt-8 flex items-start gap-2 text-[12.5px] text-tekst-3">
        <Ikona ime="upozorenje" velicina={14} className="mt-0.5 shrink-0" />
        Evidencija je pomoćni alat. Valjanost dokumenata i rokove lovostaja uvijek provjerite prema važećim propisima i uputama lovoovlaštenika.
      </p>
    </div>
  );
}

function KarticaDozvole({ d, baza }: { d: Dozvola; baza: Baza }) {
  const [sada] = useState(() => Date.now());
  const { status, dana } = statusDozvole(d);
  const [g1, g2] = GRADIJENTI[d.tip];
  let napredak: number | null = null;
  if (d.od && d.do) {
    const a = izIso(d.od).getTime();
    const b = izIso(d.do).getTime();
    napredak = Math.min(1, Math.max(0, (sada - a) / (b - a)));
  }

  return (
    <div className="kartica overflow-hidden" style={{ borderRadius: 24 }}>
      <motion.button
        whileHover={{ rotateX: 3, rotateY: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})`, transformPerspective: 900 }}
        onClick={() => otvori({ tip: "dozvola", id: d.id })}
        className="relative block w-full overflow-hidden p-5 text-left text-white"
      >
        <svg className="pointer-events-none absolute -right-6 -bottom-10 w-56 opacity-[0.07]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
          <path d="M12 2 6.5 10H9l-4 6h6v6h2v-6h6l-4-6h2.5z" />
        </svg>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_180px_at_0%_0%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/55 uppercase">{TIPOVI_DOZVOLA[d.tip]}</div>
            <div className="mt-1 font-display text-[21px] leading-tight font-semibold">{d.naziv}</div>
          </div>
          <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur", STATUS[status].klasa)}>
            {STATUS[status].oznaka}
          </span>
        </div>
        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 h-7 w-10 rounded-md bg-gradient-to-br from-[#f3d27a] to-[#b48a2c] opacity-90" />
            <div className="font-mono text-[15px] tracking-wider">{d.broj ?? "— — —"}</div>
            <div className="text-[12px] text-white/55">{d.izdavatelj ?? ""}</div>
          </div>
          <div className="text-right text-[12px] text-white/70">
            {d.do ? (
              <>
                <div className="text-white/45">vrijedi do</div>
                <div className="brojke text-[14px] font-semibold text-white">{datumDugi(d.do)}</div>
              </>
            ) : (
              "Bez roka valjanosti"
            )}
          </div>
        </div>
        {napredak != null && (
          <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className={cx("h-full rounded-full", status === "istekla" ? "bg-[#e2735f]" : status === "istice" ? "bg-[#e8a947]" : "bg-[#8cbf6e]")}
              initial={{ width: 0 }}
              animate={{ width: `${napredak * 100}%` }}
              transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
        {status === "istice" && dana != null && (
          <div className="relative mt-2 text-[12px] font-medium text-[#f5c879]">
            Ističe za {dana} {mnozina(dana, "dan", "dana", "dana")}
          </div>
        )}
      </motion.button>

      {(d.kvote.length > 0 || d.lovisteId || d.napomena) && (
        <div className="p-4">
          {d.lovisteId && (
            <div className="mb-3 flex items-center gap-2 text-[13px] text-tekst-2">
              <Ikona ime="loviste" velicina={15} /> {nazivLovista(baza, d.lovisteId)}
            </div>
          )}
          {d.kvote.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {d.kvote.map((k, i) => {
                const isk = iskoristenostKvote(baza, d, k);
                return <Kvota key={i} vrsta={k.vrsta} spol={k.spol} iskoristeno={isk} ukupno={k.broj} red={i} />;
              })}
            </div>
          )}
          {d.napomena && <p className="mt-3 text-[13px] text-tekst-2">{d.napomena}</p>}
        </div>
      )}
    </div>
  );
}

function Kvota({ vrsta, spol, iskoristeno, ukupno, red }: { vrsta: string; spol?: string; iskoristeno: number; ukupno: number; red: number }) {
  const udio = Math.min(1, iskoristeno / ukupno);
  const r = 18;
  const o = 2 * Math.PI * r;
  const boja = iskoristeno >= ukupno ? "var(--opasnost)" : bojaVrste(vrsta);
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-povrsina-2 p-2.5">
      <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--povrsina-3)" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={boja}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={o}
          initial={{ strokeDashoffset: o }}
          animate={{ strokeDashoffset: o * (1 - udio) }}
          transition={{ delay: 0.3 + red * 0.08, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="min-w-0">
        <div className="brojke text-[15px] font-semibold">
          {iskoristeno}
          <span className="text-tekst-3">/{ukupno}</span>
        </div>
        <div className="truncate text-[12px] text-tekst-2">
          {vrsta}
          {spol ? ` (${spol === "m" ? "m" : spol === "z" ? "ž" : "mlado"})` : ""}
        </div>
      </div>
    </div>
  );
}
