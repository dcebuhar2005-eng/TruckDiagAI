"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useDrustvo } from "@/lib/drustvo";
import { podijeliTekst, tekstPozivnice } from "@/lib/pozivnica";
import { dogadaj } from "@/lib/pracenje";
import Ikona from "./Ikona";
import { Gumb, djeteListe, obavijest } from "./ui";

const KLJUC_SKRIVENO = "lovacki-dnevnik:pozovi-skriveno";

/** Pošalji osobnu pozivnicu (link profila) – na Lovcima kao gumb, na Pregledu kao kartica. */
export async function pozovi(korisnickoIme: string, gdje: string) {
  const r = await podijeliTekst(tekstPozivnice(korisnickoIme));
  if (r === "kopirano") obavijest("Pozivnica je kopirana – zalijepite je u WhatsApp ili Viber");
  if (r !== "odustao") dogadaj("pozivnica_poslana", { gdje });
}

export function GumbPozovi() {
  const d = useDrustvo();
  const ki = d.profil?.korisnicko_ime;
  if (!ki) return null;
  return (
    <Gumb velicina="sm" vrsta="primarni" ikona="plus" onClick={() => pozovi(ki, "lovci")}>
      Pozovi kolegu
    </Gumb>
  );
}

/** Pregled: kartica dok korisnik ima manje od 3 prijatelja (može se sakriti). */
export default function PozoviKolegu() {
  const d = useDrustvo();
  const ki = d.profil?.korisnicko_ime;
  const [skriveno, setSkriveno] = useState(() => {
    try {
      return !!localStorage.getItem(KLJUC_SKRIVENO);
    } catch {
      return false;
    }
  });
  const prijatelja = d.prijateljstva.filter((p) => p.status === "prihvaceno").length;
  if (!ki || skriveno || prijatelja >= 3) return null;

  return (
    <motion.div variants={djeteListe} className="kartica relative p-4 lg:col-span-3">
      <button
        onClick={() => {
          try {
            localStorage.setItem(KLJUC_SKRIVENO, "1");
          } catch {}
          setSkriveno(true);
        }}
        aria-label="Sakrij"
        className="absolute top-3 right-3 rounded-lg p-1 text-tekst-3 hover:text-tekst"
      >
        <Ikona ime="x" velicina={16} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-[20px]">🤝</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Pozovi kolegu iz društva</div>
          <div className="text-[13px] text-tekst-2">Vidite se u lovu uživo, a alarm javi kad je kolega blizu.</div>
        </div>
      </div>
      <Gumb vrsta="primarni" className="mt-3 w-full" onClick={() => pozovi(ki, "pregled")}>
        Pošalji pozivnicu
      </Gumb>
    </motion.div>
  );
}
