"use client";

import { useState } from "react";
import { Gumb, cx } from "@/components/ui";
import { datumKratki } from "@/lib/format";

export interface TesterPlay {
  gmail: string;
  ime: string | null;
  mobitel: string | null;
  racun: string | null;
  profil: string | null;
  korisnicko_ime: string | null;
  napomena: string | null;
  dani: string[];
  dani_14: number;
  izlasci: number;
  zadnje: string | null;
}

const DANA = 14;

const oznaka = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

/** 14 dana testiranja od dana početka („GGGG-MM-DD”). */
function daniTestiranja(pocetak: string) {
  const [g, m, d] = pocetak.split("-").map(Number);
  return Array.from({ length: DANA }, (_, i) => oznaka(new Date(g, m - 1, d + i)));
}

function kada(iso: string) {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 60) return `prije ${Math.max(1, min)} min`;
  if (min < 1440) return `prije ${Math.round(min / 60)} h`;
  return datumKratki(new Date(iso));
}

/** Testeri zatvorenog testiranja: dani korištenja u zadnjih 14 dana, izlasci i zadnja aktivnost. */
export default function Testiranje({ testeri, pocetak }: { testeri: TesterPlay[]; pocetak: string | null }) {
  const [kopirano, setKopirano] = useState<"gmail" | "mobitel" | null>(null);
  const dani = pocetak ? daniTestiranja(pocetak) : [];
  const danas = oznaka(new Date());
  const danTestiranja = pocetak ? dani.indexOf(danas) + 1 || (danas > dani[DANA - 1] ? DANA + 1 : 0) : 0;
  const poredak = [...testeri].sort(
    (a, b) => b.dani_14 - a.dani_14 || b.izlasci - a.izlasci || (a.ime ?? a.gmail).localeCompare(b.ime ?? b.gmail, "hr"),
  );
  const aktivnih = testeri.filter((t) => t.dani_14 > 0).length;

  // Za Play Console: sve Gmail adrese (i dodatne iz napomene), za WhatsApp: brojevi, svaki u svom redu.
  const kopiraj = (sto: "gmail" | "mobitel") => {
    const tekst =
      sto === "gmail"
        ? testeri
            .flatMap((t) => [t.gmail, ...(t.napomena?.match(/[^\s:]+@gmail\.com/gi) ?? [])])
            .filter((g, i, a) => a.indexOf(g) === i)
            .join(", ")
        : testeri.flatMap((t) => (t.mobitel ? [t.mobitel] : [])).join("\n");
    navigator.clipboard
      ?.writeText(tekst)
      .then(() => {
        setKopirano(sto);
        setTimeout(() => setKopirano(null), 2500);
      })
      .catch(() => {});
  };

  return (
    <section className="kartica p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Testiranje na Google Playu</h2>
        <div className="flex flex-wrap gap-2">
          <Gumb velicina="sm" ikona={kopirano === "gmail" ? "kvacica" : "plus"} onClick={() => kopiraj("gmail")}>
            {kopirano === "gmail" ? "Kopirano" : "Gmail adrese"}
          </Gumb>
          <Gumb velicina="sm" ikona={kopirano === "mobitel" ? "kvacica" : "plus"} onClick={() => kopiraj("mobitel")}>
            {kopirano === "mobitel" ? "Kopirano" : "Brojevi"}
          </Gumb>
        </div>
      </div>
      <p className="mb-4 text-[13px] text-tekst-3">
        {testeri.length} testera
        {pocetak ? (
          <>
            {" "}
            · {danTestiranja > DANA ? "testiranje završeno" : `dan ${danTestiranja} od ${DANA}`} · aktivnih:{" "}
            <span className="font-semibold text-tekst">{aktivnih}</span> · kružići su dani testiranja (od{" "}
            {datumKratki(new Date(`${pocetak}T12:00:00`))})
          </>
        ) : (
          " · brojanje dana kreće kad Google odobri zatvoreno testiranje"
        )}
      </p>

      <ol className="grid gap-2">
        {poredak.map((t, i) => {
          const koristio = new Set(t.dani);
          const ime = t.ime ?? t.profil ?? t.gmail;
          return (
            <li key={t.gmail} className="rounded-2xl border border-rub bg-povrsina-2 p-3">
              <div className="flex items-start gap-3">
                <span className="brojke grid size-7 shrink-0 place-items-center rounded-full bg-povrsina-3 text-[12.5px] font-semibold text-tekst-2">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{ime}</div>
                  <div className="truncate text-[12.5px] text-tekst-3">
                    {t.gmail}
                    {t.korisnicko_ime ? ` · @${t.korisnicko_ime}` : ""}
                  </div>
                </div>
                {pocetak && (
                  <div className="shrink-0 text-right">
                    <div className={cx("brojke text-[20px] leading-none font-bold", t.dani_14 ? "text-naglasak" : "text-tekst-3")}>
                      {t.dani_14}
                      <span className="text-[13px] font-medium text-tekst-3">/14</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-tekst-3">dana</div>
                  </div>
                )}
              </div>

              {pocetak && (
                <div className="mt-2.5 flex gap-[3px]" aria-label={`Koristio ${t.dani_14} od 14 dana`}>
                  {dani.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={cx(
                        "h-2.5 flex-1 rounded-full",
                        koristio.has(d) ? "bg-mahovina" : d > danas ? "bg-povrsina-3/40" : "bg-povrsina-3",
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-tekst-2">
                <span>
                  Izlazaka: <span className="brojke font-semibold text-tekst">{t.izlasci}</span>
                </span>
                <span>Zadnje: {t.zadnje ? kada(t.zadnje) : "–"}</span>
                {t.mobitel && (
                  <a href={`https://wa.me/${t.mobitel.replace("+", "")}`} target="_blank" rel="noreferrer" className="text-naglasak">
                    {t.mobitel}
                  </a>
                )}
              </div>
              {!t.racun ? (
                <div className="mt-1.5 text-[12px] font-medium text-[#e0a14f]">Nema računa u CroLovcu s ovim mailom</div>
              ) : (
                t.napomena && <div className="mt-1.5 text-[12px] text-tekst-3">{t.napomena}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
