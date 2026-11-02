"use client";

import { useEffect, useState } from "react";
import { Gumb, Ploca } from "./ui";
import { jeOsnivac, useDrustvo } from "@/lib/drustvo";
import { dogadaj } from "@/lib/pracenje";

const KLJUC = "lovacki-dnevnik:osnivac-zahvala";
const ZLATNA = "linear-gradient(135deg,#f5cf7a,#e8a947 55%,#c98a2b)";

/** Zlatna značka „Osnivač” – prvi testeri CroLovca. */
export function ZnackaOsnivac({ velika, tekst = "Osnivač" }: { velika?: boolean; tekst?: string }) {
  return (
    <span
      title="Osnivač CroLovca – među prvim testerima"
      className={
        "inline-flex shrink-0 items-center gap-1 rounded-full align-middle font-bold whitespace-nowrap text-[#1b1407] shadow-[0_0_0_1px_rgba(255,220,150,.35),0_4px_14px_-4px_rgba(232,169,71,.6)] " +
        (velika ? "px-3.5 py-1 text-[13px]" : "px-2 py-px text-[11px]")
      }
      style={{ background: ZLATNA }}
    >
      🦌 {tekst}
    </span>
  );
}

/** Značka uz lovca s danim id-jem (ništa ako nije osnivač). */
export function OsnivacUz({ id }: { id: string | undefined | null }) {
  return jeOsnivac(id) ? <ZnackaOsnivac /> : null;
}

/** Jednom: zahvala testeru kad prvi put otvori aplikaciju nakon dodjele značke. */
export default function ZahvalaOsnivacu({ zauzet }: { zauzet: boolean }) {
  const d = useDrustvo();
  const osnivac = jeOsnivac(d.sesija?.user.id);
  const [otvoreno, setOtvoreno] = useState(false);

  useEffect(() => {
    if (zauzet || !osnivac) return;
    try {
      if (localStorage.getItem(KLJUC)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      if (document.querySelector('[role="dialog"][aria-modal]') || document.visibilityState !== "visible") return;
      setOtvoreno(true);
      dogadaj("osnivac_zahvala");
    }, 2500);
    return () => clearTimeout(t);
  }, [zauzet, osnivac]);

  const zatvori = () => {
    try {
      localStorage.setItem(KLJUC, "1");
    } catch {}
    setOtvoreno(false);
  };

  return (
    <Ploca
      otvorena={otvoreno}
      zatvori={zatvori}
      naslov="Vi ste Osnivač CroLovca!"
      sirina={420}
      podnozje={
        <Gumb vrsta="primarni" className="w-full" onClick={zatvori}>
          Hvala, idemo u lov!
        </Gumb>
      }
    >
      <div className="grid justify-items-center gap-4 pb-1 text-center">
        <div
          className="grid size-24 place-items-center rounded-full text-[46px] shadow-[0_0_40px_rgba(232,169,71,.45),inset_0_-6px_12px_rgba(0,0,0,.25)]"
          style={{ background: "radial-gradient(circle at 35% 30%,#ffe3a0,#e8a947 55%,#a86d1c)" }}
        >
          🦌
        </div>
        <p className="text-[15px] text-tekst-2">Bili ste među prvim testerima i pomogli nam izgraditi aplikaciju. Hvala vam! 🙏</p>
        <p className="text-[15px] text-tekst-2">
          Značka <ZnackaOsnivac /> sada stoji uz vaše ime – vide je vaši prijatelji i ostaje zauvijek.
        </p>
      </div>
    </Ploca>
  );
}
