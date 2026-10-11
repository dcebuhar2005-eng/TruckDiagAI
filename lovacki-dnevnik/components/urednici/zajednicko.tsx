"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { VRSTE, SKUPINE, type Skupina } from "@/lib/katalog";
import type { Baza } from "@/lib/types";
import Ikona from "../Ikona";
import { Gumb, cx } from "../ui";

export function Odjeljak({ naslov, children, desno }: { naslov: string; children: ReactNode; desno?: ReactNode }) {
  return (
    <section className="mt-6 first:mt-1">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">{naslov}</h3>
        <div className="h-px flex-1 bg-rub" />
        {desno}
      </div>
      <div className="grid gap-3.5">{children}</div>
    </section>
  );
}

export function Red({ children, stupci = 2 }: { children: ReactNode; stupci?: 2 | 3 }) {
  return <div className={cx("grid gap-3", stupci === 3 ? "grid-cols-3" : "grid-cols-2")}>{children}</div>;
}

export function OdabirVrste({
  vrijednost,
  promjena,
  className,
}: {
  vrijednost: string;
  promjena: (v: string) => void;
  className?: string;
}) {
  const skupine = Object.keys(SKUPINE) as Skupina[];
  return (
    <select className={cx("unos", className)} value={vrijednost} onChange={(e) => promjena(e.target.value)}>
      {skupine.map((s) => (
        <optgroup key={s} label={SKUPINE[s].naziv}>
          {VRSTE.filter((v) => v.skupina === s).map((v) => (
            <option key={v.naziv}>{v.naziv}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function OdabirLovista({
  baza,
  vrijednost,
  promjena,
}: {
  baza: Baza;
  vrijednost?: string;
  promjena: (v?: string) => void;
}) {
  return (
    <select className="unos" value={vrijednost ?? ""} onChange={(e) => promjena(e.target.value || undefined)}>
      <option value="">— Bez lovišta —</option>
      {baza.lovista.map((l) => (
        <option key={l.id} value={l.id}>
          {l.naziv}
          {l.broj ? ` (${l.broj})` : ""}
        </option>
      ))}
    </select>
  );
}

export function Zvjezdice({ vrijednost = 0, promjena }: { vrijednost?: number; promjena: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.12 }}
          onClick={() => promjena(i === vrijednost ? 0 : i)}
          className={cx("p-1", i <= vrijednost ? "text-naglasak" : "text-tekst-3")}
          aria-label={`${i} od 5`}
        >
          <Ikona ime="zvijezda" velicina={26} fill={i <= vrijednost ? "currentColor" : "none"} />
        </motion.button>
      ))}
    </div>
  );
}

export function Koracnik({ vrijednost, promjena, min = 0 }: { vrijednost: number; promjena: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center rounded-xl border border-rub bg-povrsina-2">
      <button type="button" className="grid size-10 place-items-center text-tekst-2 hover:text-tekst" onClick={() => promjena(Math.max(min, vrijednost - 1))}>
        −
      </button>
      <motion.span key={vrijednost} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="brojke w-7 text-center font-semibold">
        {vrijednost}
      </motion.span>
      <button type="button" className="grid size-10 place-items-center text-tekst-2 hover:text-tekst" onClick={() => promjena(vrijednost + 1)}>
        +
      </button>
    </div>
  );
}

export function PodnozjeObrasca({
  onSpremi,
  onObrisi,
  onOdustani,
  spremiTekst = "Spremi",
  onemoguceno,
}: {
  onSpremi: () => void;
  onObrisi?: () => void;
  onOdustani: () => void;
  spremiTekst?: string;
  onemoguceno?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {onObrisi && <Gumb vrsta="opasni" ikona="smece" onClick={onObrisi} aria-label="Obriši" />}
      <Gumb className="flex-1" onClick={onOdustani}>
        Odustani
      </Gumb>
      <Gumb vrsta="primarni" ikona="kvacica" className="flex-[1.4]" onClick={onSpremi} disabled={onemoguceno}>
        {spremiTekst}
      </Gumb>
    </div>
  );
}

export const broj = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));
export const tekst = (s: string) => (s.trim() === "" ? undefined : s.trim());
