"use client";

import { useEffect, useState } from "react";
import { Gumb, Ploca } from "./ui";
import { NOVOSTI } from "@/lib/novosti";
import { useBaza } from "@/lib/store";

const KLJUC = "lovacki-dnevnik:novosti-vidjeno";

/** Jednom nakon objave: što je novo. Novi korisnik (prazan dnevnik) ga ne vidi – za njega je sve novo. */
export default function StoJeNovo({ zauzet }: { zauzet: boolean }) {
  const baza = useBaza();
  const [otvoreno, setOtvoreno] = useState(false);
  const zadnja = NOVOSTI[0];

  useEffect(() => {
    if (!baza || zauzet || !zadnja) return;
    let vidjeno: string | null = null;
    try {
      vidjeno = localStorage.getItem(KLJUC);
    } catch {
      return;
    }
    if (vidjeno && vidjeno >= zadnja.id) return;
    const novi = !vidjeno && !baza.izlasci.length && !baza.tocke.length && !baza.lovista.length;
    if (novi) {
      try {
        localStorage.setItem(KLJUC, zadnja.id);
      } catch {}
      return;
    }
    const t = setTimeout(() => setOtvoreno(true), 1500);
    return () => clearTimeout(t);
  }, [baza, zauzet, zadnja]);

  const zatvori = () => {
    setOtvoreno(false);
    try {
      localStorage.setItem(KLJUC, zadnja.id);
    } catch {}
  };

  if (!zadnja) return null;
  return (
    <Ploca otvorena={otvoreno} zatvori={zatvori} naslov={zadnja.naslov} podnaslov="Aplikacija je ažurirana" sirina={440} podnozje={<Gumb vrsta="primarni" className="w-full" onClick={zatvori}>Super, hvala</Gumb>}>
      <ul className="grid gap-3 pb-2">
        {zadnja.stavke.map((s) => (
          <li key={s} className="rounded-2xl border border-rub bg-povrsina-2 p-3.5 text-[14.5px] leading-snug">
            {s}
          </li>
        ))}
      </ul>
    </Ploca>
  );
}
