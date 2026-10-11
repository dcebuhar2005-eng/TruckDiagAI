"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Ikona, { type ImeIkone } from "./Ikona";
import { Ploca, cx, opruga } from "./ui";
import { lovciUBlizini, useDrustvo } from "@/lib/drustvo";
import { useBaza } from "@/lib/store";

export const RUTE: { href: string; oznaka: string; ikona: ImeIkone; mobilno: boolean }[] = [
  { href: "/", oznaka: "Pregled", ikona: "pregled", mobilno: true },
  { href: "/dnevnik", oznaka: "Dnevnik", ikona: "dnevnik", mobilno: true },
  { href: "/karta", oznaka: "Karta", ikona: "karta", mobilno: true },
  { href: "/lovci", oznaka: "Lovci", ikona: "korisnik", mobilno: true },
  { href: "/lovista", oznaka: "Lovišta", ikona: "loviste", mobilno: false },
  { href: "/dozvole", oznaka: "Dozvole", ikona: "dozvola", mobilno: false },
  { href: "/statistika", oznaka: "Statistika", ikona: "statistika", mobilno: false },
  { href: "/postavke", oznaka: "Postavke", ikona: "postavke", mobilno: false },
];

function indeks(put: string) {
  const i = RUTE.findIndex((r) => (r.href === "/" ? put === "/" : put.startsWith(r.href)));
  return i < 0 ? 0 : i;
}

export function smjer(trenutni: string, cilj: string) {
  return indeks(cilj) >= indeks(trenutni) ? ["naprijed"] : ["natrag"];
}

export default function Navigacija() {
  const put = usePathname();
  const baza = useBaza();
  const akt = indeks(put);
  const ime = baza?.postavke.ime;
  const drustvo = useDrustvo();
  const [vise, setVise] = useState(false);
  const zahtjevi = drustvo.prijateljstva.filter((p) => p.dolazni && p.status === "ceka").length;
  const opasnost = lovciUBlizini(drustvo).length > 0;
  const znacka = (href: string) =>
    href === "/lovci" && (opasnost || zahtjevi > 0) ? (
      <span
        className={cx(
          "absolute -top-1 -right-1.5 size-2.5 rounded-full ring-2 ring-povrsina",
          opasnost ? "bg-opasnost" : "bg-naglasak",
        )}
      />
    ) : null;
  const viseAktivno = !RUTE[akt].mobilno;

  return (
    <>
      {/* Bočna traka – stolna računala */}
      <aside
        style={{ viewTransitionName: "zaglavlje" }}
        className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-rub bg-povrsina/70 px-4 py-6 backdrop-blur-xl lg:flex"
      >
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <Znak />
          <div>
            <div className="font-display text-[19px] leading-none font-semibold">Lovački dnevnik</div>
            <div className="mt-1 text-[11.5px] tracking-wide text-tekst-3">Evidencija lova</div>
          </div>
        </Link>
        <nav className="flex flex-col gap-1">
          {RUTE.map((r, i) => {
            const a = i === akt;
            return (
              <Link
                key={r.href}
                href={r.href}
                transitionTypes={smjer(put, r.href)}
                className={cx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-colors",
                  a ? "text-tekst" : "text-tekst-2 hover:text-tekst",
                )}
              >
                {a && (
                  <motion.span
                    layoutId="nav-bocno"
                    transition={opruga}
                    className="absolute inset-0 rounded-xl border border-rub bg-povrsina-2"
                  />
                )}
                {a && (
                  <motion.span
                    layoutId="nav-bocno-crta"
                    transition={opruga}
                    className="absolute top-2 bottom-2 -left-4 w-[3px] rounded-r-full bg-naglasak"
                  />
                )}
                <span className="relative">
                  <Ikona ime={r.ikona} velicina={19} className={cx(a && "text-naglasak")} />
                  {znacka(r.href)}
                </span>
                <span className="relative">{r.oznaka}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-rub bg-povrsina-2 p-3">
          <div className="grid size-9 place-items-center rounded-full bg-naglasak-meki font-display font-semibold text-naglasak">
            {(ime || "L").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{ime || "Lovac"}</div>
            <div className="truncate text-xs text-tekst-3">{baza?.postavke.drustvo || "Lovačko društvo"}</div>
          </div>
        </div>
      </aside>

      {/* Donja traka – mobitel/tablet */}
      <nav
        style={{ viewTransitionName: "navigacija" }}
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between rounded-[26px] border border-rub-jaki bg-povrsina/85 p-1.5 shadow-jaka backdrop-blur-2xl">
          {RUTE.filter((r) => r.mobilno).map((r) => {
            const a = RUTE.indexOf(r) === akt;
            return (
              <Link
                key={r.href}
                href={r.href}
                transitionTypes={smjer(put, r.href)}
                className="relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2"
              >
                {a && (
                  <motion.span
                    layoutId="nav-dolje"
                    transition={opruga}
                    className="absolute inset-0 rounded-[20px] bg-naglasak-meki"
                  />
                )}
                <motion.span
                  animate={{ y: a ? -1 : 0, scale: a ? 1.08 : 1 }}
                  transition={opruga}
                  className={cx("relative", a ? "text-naglasak" : "text-tekst-3")}
                >
                  <Ikona ime={r.ikona} velicina={21} debljina={a ? 2 : 1.7} />
                  {znacka(r.href)}
                </motion.span>
                <span
                  className={cx(
                    "relative text-[10.5px] font-medium tracking-wide",
                    a ? "text-tekst" : "text-tekst-3",
                  )}
                >
                  {r.oznaka}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setVise(true)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2"
          >
            {viseAktivno && (
              <motion.span layoutId="nav-dolje" transition={opruga} className="absolute inset-0 rounded-[20px] bg-naglasak-meki" />
            )}
            <span className={cx("relative", viseAktivno ? "text-naglasak" : "text-tekst-3")}>
              <Ikona ime="vise" velicina={21} debljina={2.4} />
            </span>
            <span className={cx("relative text-[10.5px] font-medium tracking-wide", viseAktivno ? "text-tekst" : "text-tekst-3")}>
              Više
            </span>
          </button>
        </div>
      </nav>

      <Ploca otvorena={vise} zatvori={() => setVise(false)} naslov="Više" sirina={420}>
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          {RUTE.filter((r) => !r.mobilno).map((r) => {
            const a = RUTE.indexOf(r) === akt;
            return (
              <Link
                key={r.href}
                href={r.href}
                transitionTypes={smjer(put, r.href)}
                onClick={() => setVise(false)}
                className={cx(
                  "flex flex-col gap-3 rounded-2xl border p-4 transition-colors",
                  a ? "border-naglasak bg-naglasak-meki" : "border-rub bg-povrsina-2 hover:border-rub-jaki",
                )}
              >
                <Ikona ime={r.ikona} velicina={22} className="text-naglasak" />
                <span className="font-medium">{r.oznaka}</span>
              </Link>
            );
          })}
        </div>
      </Ploca>
    </>
  );
}

export function Znak({ velicina = 40 }: { velicina?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-192.png"
      alt=""
      width={velicina}
      height={velicina}
      className="shrink-0"
      style={{ borderRadius: velicina * 0.24 }}
    />
  );
}
