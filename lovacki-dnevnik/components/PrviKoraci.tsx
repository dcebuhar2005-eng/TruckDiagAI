"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Ikona, { type ImeIkone } from "./Ikona";
import { otvori } from "./urednici/kontroler";
import { cx, djeteListe } from "./ui";
import { konfigurirano, useDrustvo } from "@/lib/drustvo";
import { dogadaj } from "@/lib/pracenje";
import type { Baza } from "@/lib/types";

const KLJUC = "lovacki-dnevnik:prvi-koraci-skriveni";

type Korak = { k: string; gotovo: boolean; ikona: ImeIkone; naslov: string; opis: string; trajanje?: string; akcija?: () => void; href?: string };

/**
 * Novi korisnik (još bez izlazaka i odstrela) na vrhu Pregleda dobije „Postavi svoje lovište”:
 * račun ✓ → lovište → čeka → prijatelj iz LD-a → prvi izlazak, s trakom napretka.
 * Nestane nakon prvog izlaska ili odstrela, ili kad ga korisnik sakrije.
 */
export default function PrviKoraci({ baza }: { baza: Baza }) {
  const drustvo = useDrustvo();
  const [skriveno, setSkriveno] = useState(() => {
    try {
      return localStorage.getItem(KLJUC) === "1";
    } catch {
      return false;
    }
  });
  const vidljivo = !skriveno && !baza.izlasci.length && !baza.odstrel.length;
  useEffect(() => {
    if (vidljivo) dogadaj("prvi_koraci_prikazani");
  }, [vidljivo]);
  if (!vidljivo) return null;

  const prijatelji = drustvo.prijateljstva.some((p) => p.status === "prihvaceno");
  const koraci: Korak[] = [
    { k: "racun", gotovo: true, ikona: "korisnik", naslov: "Napravite račun", opis: "" },
    {
      k: "loviste",
      gotovo: baza.lovista.length > 0,
      ikona: "loviste",
      naslov: "Dodajte svoje lovište",
      opis: "Naziv je dovoljno – granicu možete nacrtati i kasnije.",
      trajanje: "20 s",
      akcija: () => otvori({ tip: "loviste" }),
    },
    {
      k: "ceka",
      gotovo: baza.tocke.length > 0,
      ikona: "lokacija",
      naslov: "Označite svoju prvu čeku",
      opis: "Pa vidite je li dobra za današnji vjetar.",
      trajanje: "30 s",
      akcija: () => otvori({ tip: "tocka", pocetno: { tip: "ceka", lovisteId: baza.lovista[0]?.id } }),
    },
    ...(konfigurirano
      ? [
          {
            k: "prijatelj",
            gotovo: prijatelji,
            ikona: "korisnik" as ImeIkone,
            naslov: "Dodajte prijatelja iz LD-a",
            opis: "Vidite se u lovu i alarm vas upozori kad ste blizu.",
            href: "/lovci",
          },
        ]
      : []),
    {
      k: "izlazak",
      gotovo: false,
      ikona: "dnevnik",
      naslov: "Krenite u lov ili zapišite izlazak",
      opis: "Aplikacija bilježi vrijeme, vjetar i trag.",
      href: "/lov",
    },
  ];
  const gotovih = koraci.filter((k) => k.gotovo).length;
  const sljedeci = koraci.findIndex((k) => !k.gotovo);

  const makni = () => {
    setSkriveno(true);
    dogadaj("prvi_koraci_sakriveni", { gotovih });
    try {
      localStorage.setItem(KLJUC, "1");
    } catch {}
  };

  return (
    <motion.section
      variants={djeteListe}
      className="rounded-3xl border border-naglasak/40 bg-gradient-to-b from-naglasak-meki to-povrsina p-5 shadow-[0_18px_40px_-24px_rgba(232,169,71,.55)] lg:col-span-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[21px] font-semibold">Postavite svoje lovište</h2>
          <p className="mt-0.5 text-[13.5px] text-tekst-2">Dvije minute i CroLovac vam pokazuje vjetar za vaše čeke.</p>
        </div>
        <button onClick={makni} className="shrink-0 text-[12.5px] text-tekst-3 hover:text-tekst" data-bez-utiska>
          Sakrij
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-povrsina-3">
          <motion.div
            className="h-full rounded-full bg-naglasak"
            initial={{ width: 0 }}
            animate={{ width: `${(gotovih / koraci.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="brojke text-[12.5px] font-medium text-tekst-2">
          {gotovih}/{koraci.length}
        </span>
      </div>
      <ol className="mt-3 grid gap-2">
        {koraci.map((k, i) => {
          const sad = i === sljedeci;
          const sadrzaj = (
            <>
              <span
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  k.gotovo ? "bg-mahovina/20 text-mahovina" : sad ? "bg-naglasak text-[#17130a]" : "bg-povrsina-2 text-tekst-3",
                )}
              >
                <Ikona ime={k.gotovo ? "kvacica" : k.ikona} velicina={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx("block font-medium", k.gotovo && "text-tekst-3 line-through")}>{k.naslov}</span>
                {!k.gotovo && sad && k.opis && <span className="block text-[13px] text-tekst-2">{k.opis}</span>}
              </span>
              {!k.gotovo && sad && k.trajanje && (
                <span className="shrink-0 rounded-full bg-naglasak px-2.5 py-1 text-[12px] font-semibold text-[#17130a]">{k.trajanje} →</span>
              )}
              {!k.gotovo && !(sad && k.trajanje) && <Ikona ime="desno" className="text-tekst-3" />}
            </>
          );
          const klase = cx(
            "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
            sad ? "border-naglasak/60 bg-povrsina" : "border-rub bg-povrsina/60",
            !k.gotovo && "hover:border-naglasak",
          );
          const klik = () => dogadaj("prvi_koraci_korak", { korak: k.k });
          return (
            <li key={k.k}>
              {k.gotovo ? (
                <div className={klase}>{sadrzaj}</div>
              ) : k.href ? (
                <Link href={k.href} transitionTypes={["naprijed"]} className={klase} onClick={klik}>
                  {sadrzaj}
                </Link>
              ) : (
                <button onClick={() => (klik(), k.akcija?.())} className={klase}>
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
