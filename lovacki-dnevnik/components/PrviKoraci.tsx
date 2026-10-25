"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import Ikona, { type ImeIkone } from "./Ikona";
import { otvori } from "./urednici/kontroler";
import { cx, djeteListe } from "./ui";
import type { Baza } from "@/lib/types";

const KLJUC = "lovacki-dnevnik:prvi-koraci-skriveni";

/**
 * Novi korisnik (još bez izlazaka i odstrela) dobije na Pregledu tri koraka do prvog zapisa:
 * lovište → čeka → prvi izlazak. Nestane nakon prvog izlaska ili kad ga korisnik makne.
 */
export default function PrviKoraci({ baza }: { baza: Baza }) {
  const [skriveno, setSkriveno] = useState(() => {
    try {
      return localStorage.getItem(KLJUC) === "1";
    } catch {
      return false;
    }
  });
  if (skriveno || baza.izlasci.length || baza.odstrel.length) return null;

  const koraci: { gotovo: boolean; ikona: ImeIkone; naslov: string; opis: string; akcija: () => void; href?: string }[] = [
    {
      gotovo: baza.lovista.length > 0,
      ikona: "loviste",
      naslov: "Dodajte svoje lovište",
      opis: "Naziv je dovoljno, granicu možete nacrtati i kasnije.",
      akcija: () => otvori({ tip: "loviste" }),
    },
    {
      gotovo: baza.tocke.length > 0,
      ikona: "lokacija",
      naslov: "Označite čeku",
      opis: "Pa vidite je li dobra za današnji vjetar.",
      akcija: () => otvori({ tip: "tocka", pocetno: { tip: "ceka", lovisteId: baza.lovista[0]?.id } }),
    },
    {
      gotovo: false,
      ikona: "dnevnik",
      naslov: "Krenite u lov ili zapišite izlazak",
      opis: "Aplikacija bilježi vrijeme, vjetar i trag.",
      akcija: () => {},
      href: "/lov",
    },
  ];
  const sljedeci = koraci.findIndex((k) => !k.gotovo);

  const makni = () => {
    setSkriveno(true);
    try {
      localStorage.setItem(KLJUC, "1");
    } catch {}
  };

  return (
    <motion.section variants={djeteListe} className="kartica p-5 lg:col-span-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Prvi koraci</h2>
        <button onClick={makni} className="text-[12.5px] text-tekst-3 hover:text-tekst">
          Sakrij
        </button>
      </div>
      <ol className="grid gap-2">
        {koraci.map((k, i) => {
          const sadrzaj = (
            <>
              <span
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  k.gotovo ? "bg-mahovina/20 text-mahovina" : i === sljedeci ? "bg-naglasak text-[#17130a]" : "bg-povrsina-2 text-tekst-3",
                )}
              >
                <Ikona ime={k.gotovo ? "kvacica" : k.ikona} velicina={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx("block font-medium", k.gotovo && "text-tekst-3 line-through")}>{k.naslov}</span>
                {!k.gotovo && <span className="block text-[13px] text-tekst-2">{k.opis}</span>}
              </span>
              {!k.gotovo && <Ikona ime="desno" className="text-tekst-3" />}
            </>
          );
          const klase = cx(
            "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
            i === sljedeci ? "border-naglasak/50 bg-naglasak-meki/40" : "border-rub",
            !k.gotovo && "hover:border-naglasak",
          );
          return (
            <li key={k.naslov}>
              {k.gotovo ? (
                <div className={klase}>{sadrzaj}</div>
              ) : k.href ? (
                <Link href={k.href} transitionTypes={["naprijed"]} className={klase}>
                  {sadrzaj}
                </Link>
              ) : (
                <button onClick={k.akcija} className={klase}>
                  {sadrzaj}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
}
