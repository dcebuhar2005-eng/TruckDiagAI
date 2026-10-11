"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import Ikona from "./Ikona";
import { otvori } from "./urednici/kontroler";
import { cx } from "./ui";
import { sat } from "@/lib/format";
import type { Baza } from "@/lib/types";
import { OCJENE, imaVjetrove, zaVjetar, ocjenaVjetra, opisVjetrova, sljedeciDobar } from "@/lib/vjetarCeke";
import { smjerVjetra, type Prognoza } from "@/lib/vrijeme";

const REDOSLIJED = { dobar: 0, rubno: 1, nestalan: 2, los: 3, nepoznato: 4 } as const;

/** Koje čeke danas odgovaraju vjetru (HuntStand „Hunt Area“ na naš način). */
export default function CekeDanas({ baza, p }: { baza: Baza; p: Prognoza | null }) {
  const [sada] = useState(() => Date.now());
  const ceke = baza.tocke.filter((t) => zaVjetar(t.tip));
  if (!ceke.length) return null;

  const smjer = p?.trenutno.vjetarSmjer;
  const brzina = p?.trenutno.vjetarBrzina;
  const sOcjenom = ceke
    .map((t) => ({ t, o: ocjenaVjetra(t, smjer, brzina), sljedeci: p ? sljedeciDobar(t, p.satno, sada) : null }))
    .sort((a, b) => REDOSLIJED[a.o] - REDOSLIJED[b.o] || a.t.naziv.localeCompare(b.t.naziv, "hr"));
  const dobre = sOcjenom.filter((x) => x.o === "dobar");
  const bezVjetra = ceke.filter((t) => !imaVjetrove(t));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Čeke i zasjede za ovaj vjetar</h2>
        {smjer != null && (
          <span className="brojke text-[12.5px] text-tekst-3">
            Sada {smjerVjetra(smjer)} · {Math.round(brzina ?? 0)} km/h
          </span>
        )}
      </div>
      {smjer != null && bezVjetra.length < ceke.length && (
        <p className="mb-3 text-[15px]">
          {dobre.length ? (
            <>
              Danas su dobre: <span className="font-semibold text-[#6fbf73]">{dobre.map((d) => d.t.naziv).join(", ")}</span>
            </>
          ) : (
            <span className="text-tekst-2">Trenutni vjetar ne odgovara nijednoj čeki.</span>
          )}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sOcjenom.slice(0, 9).map(({ t, o, sljedeci }, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3"
          >
            <span className="size-3 shrink-0 rounded-full" style={{ background: OCJENE[o].boja, boxShadow: `0 0 0 4px ${OCJENE[o].boja}33` }} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{t.naziv}</div>
              <div className="truncate text-[12.5px] text-tekst-3">
                {o === "nepoznato" && imaVjetrove(t) ? (
                  <>Vjetar trenutno nije dostupan · dobar: {opisVjetrova(t.vjetrovi)}</>
                ) : o === "nepoznato" ? (
                  <button className="font-medium text-naglasak" onClick={() => otvori({ tip: "tocka", id: t.id })}>
                    Odredite dobar vjetar
                  </button>
                ) : (
                  <>
                    <span className={cx(o === "dobar" && "text-[#6fbf73]", o === "los" && "text-opasnost")}>{OCJENE[o].naziv}</span>
                    {" · "}
                    {o === "dobar"
                      ? sljedeci && !sljedeci.sada
                        ? `od ${sat(sljedeci.od)}`
                        : sljedeci
                          ? `do ${sat(sljedeci.do)}`
                          : ""
                      : sljedeci
                        ? `dobar od ${sat(sljedeci.od)}`
                        : `treba: ${opisVjetrova(t.vjetrovi)}`}
                  </>
                )}
              </div>
            </div>
            <Link
              href={`/karta?fokus=${t.lat},${t.lng}`}
              transitionTypes={["naprijed"]}
              aria-label={`${t.naziv} na karti`}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-tekst-3 hover:bg-povrsina-3 hover:text-naglasak"
            >
              <Ikona ime="karta" velicina={17} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
