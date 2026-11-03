"use client";

import { useEffect, useState } from "react";
import { Gumb, Ploca } from "./ui";
import { dogadaj } from "@/lib/pracenje";

const KLJUC = "lovacki-dnevnik:sv-hubert";

/** 3. studenoga (sv. Hubert, zaštitnik lovaca): jednom čestitka svim korisnicima. */
export default function SvHubert({ zauzet }: { zauzet: boolean }) {
  const [otvoreno, setOtvoreno] = useState(false);
  const godina = new Date().getFullYear();

  useEffect(() => {
    if (zauzet) return;
    const d = new Date();
    if (d.getMonth() !== 10 || d.getDate() !== 3) return;
    try {
      if (localStorage.getItem(KLJUC) === String(godina)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      if (document.querySelector('[role="dialog"][aria-modal]')) return;
      setOtvoreno(true);
      dogadaj("sv_hubert_prikazan");
    }, 800);
    return () => clearTimeout(t);
  }, [zauzet, godina]);

  const zatvori = () => {
    setOtvoreno(false);
    try {
      localStorage.setItem(KLJUC, String(godina));
    } catch {}
  };

  return (
    <Ploca
      otvorena={otvoreno}
      zatvori={zatvori}
      naslov="Sretan blagdan svetog Huberta! 🦌"
      podnaslov="3. studenoga – zaštitnik lovaca"
      sirina={440}
      podnozje={
        <Gumb vrsta="primarni" className="w-full" onClick={zatvori}>
          Hvala, Lovu mir!
        </Gumb>
      }
    >
      <div className="grid gap-4 pb-1">
        <img src="/hubert.jpg" alt="Jelen i košute s lovačke kamere" className="w-full rounded-2xl border border-rub" />
        <p className="text-[15.5px] leading-relaxed text-tekst-2">
          Danas slavimo zaštitnika lovaca. Želimo vam lovačku sreću, pouzdanu pušku, siguran povratak sa svakog lova i puno lijepih
          trenutaka u prirodi.
        </p>
        <p className="text-[15.5px] leading-relaxed text-tekst-2">
          Hvala što ste dio CroLovca – sve nas je više od 450! 🙏
        </p>
        <p className="font-display text-[20px] font-semibold text-naglasak">Lovu mir! 🍀</p>
      </div>
    </Ploca>
  );
}
