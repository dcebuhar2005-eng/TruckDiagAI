"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import Ikona from "./Ikona";
import { djeteListe } from "./ui";
import { DRZAVE, kratkiDatum, odabranaDrzava, uskoroZatvara, vrstaOtvorena } from "@/lib/lovostaj";

const PRIKAZ = 6;
// Najčešća divljač ide prva.
const NAJCESCE = ["jelen", "srna", "svinja", "zec", "fazan", "lopatar", "muflon", "divokoza", "gluhara", "patke", "bena", "sljuke", "trcka", "lisica", "cagalj"];

/** Pregled: što se danas smije loviti (u državi odabranoj u kalendaru) – vodi u Lovni kalendar. */
export default function DanasSeSmije() {
  const danas = useMemo(() => new Date(), []);
  const drzava = useMemo(() => DRZAVE.find((d) => d.k === odabranaDrzava()) ?? DRZAVE[0], []);
  const vrste = drzava.vrste;
  // Najprije krupna divljač, pa ostalo.
  const otvorene = vrste.filter((v) => vrstaOtvorena(v, danas) && v.dijelovi.some((x) => x.pravilo.tip !== "zabrana"));
  const red = (k: string) => {
    const i = NAJCESCE.indexOf(k);
    return i < 0 ? 100 : i;
  };
  const redom = [...otvorene].sort((a, b) => red(a.k) - red(b.k));
  const prvo = uskoroZatvara(vrste, danas, 14)[0];

  return (
    <motion.div variants={djeteListe} className="lg:col-span-3">
      <Link
        href="/kalendar"
        transitionTypes={["naprijed"]}
        className="block rounded-3xl border border-mahovina/35 bg-gradient-to-b from-mahovina-meka to-povrsina p-4 transition-colors hover:border-mahovina/60"
      >
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-mahovina-meka text-mahovina">
            <Ikona ime="kalendar" velicina={19} />
          </span>
          <span className="font-semibold">Danas se smije loviti</span>
          <span title={drzava.naziv} className="text-[15px]">
            {drzava.zastava}
          </span>
          <span className="ml-auto flex items-center gap-0.5 text-[13.5px] font-medium text-naglasak">
            Kalendar <Ikona ime="desno" velicina={15} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {redom.slice(0, PRIKAZ).map((v) => (
            <span key={v.k} className="rounded-full bg-mahovina-meka px-2.5 py-1 text-[12.5px] font-medium text-mahovina">
              {v.naziv.replace(/ (obični|obična|veliki)$/, "")}
            </span>
          ))}
          {redom.length > PRIKAZ && <span className="rounded-full bg-povrsina-2 px-2.5 py-1 text-[12.5px] text-tekst-2">+{redom.length - PRIKAZ}</span>}
        </div>
        {prvo && (
          <p className="mt-2 text-[12.5px] text-opasnost">
            ⏳ {prvo.dio}: lov do {kratkiDatum(prvo.zadnji)} (još {prvo.za === 1 ? "1 dan" : `${prvo.za} dana`})
          </p>
        )}
      </Link>
    </motion.div>
  );
}
