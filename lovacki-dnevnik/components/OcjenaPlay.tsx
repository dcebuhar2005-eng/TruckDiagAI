"use client";

import { useEffect, useState } from "react";
import { Gumb, Ploca } from "./ui";
import { uAplikaciji } from "@/lib/nativno";
import { dogadaj } from "@/lib/pracenje";
import { useBaza } from "@/lib/store";

const KLJUC = "lovacki-dnevnik:ocjena-play";
// U Android aplikaciji poveznica na Play otvara Trgovinu Play izravno na stranici CroLovca.
const PLAY = "https://play.google.com/store/apps/details?id=com.crolovac.app";
const NAKON_IZLAZAKA = 3;
const KASNIJE_DANA = 14;
const NAJVISE_PUTA = 2;

type Stanje = { puta: number; sljedece: number; gotovo?: boolean };

function procitaj(): Stanje {
  try {
    return { puta: 0, sljedece: 0, ...JSON.parse(localStorage.getItem(KLJUC) ?? "{}") };
  } catch {
    return { puta: 0, sljedece: 0 };
  }
}
function spremi(s: Stanje) {
  try {
    localStorage.setItem(KLJUC, JSON.stringify(s));
  } catch {}
}

/**
 * Samo u Android aplikaciji: nakon 3. upisanog izlaska jednom zamoli ocjenu na Google Playu.
 * „Kasnije” → ponovno za 14 dana, najviše 2 puta. Nikad usred lova ni preko druge ploče.
 */
export default function OcjenaPlay({ zauzet }: { zauzet: boolean }) {
  const baza = useBaza();
  const izlazaka = baza?.izlasci.length ?? 0;
  const [otvoreno, setOtvoreno] = useState(false);

  useEffect(() => {
    if (zauzet || izlazaka < NAKON_IZLAZAKA || !uAplikaciji()) return;
    const s = procitaj();
    if (s.gotovo || s.puta >= NAJVISE_PUTA || Date.now() < s.sljedece) return;
    const t = setTimeout(() => {
      if (document.querySelector('[role="dialog"]') || document.visibilityState !== "visible") return;
      setOtvoreno(true);
      dogadaj("ocjena_play_prikazana", { izlazaka });
    }, 3000);
    return () => clearTimeout(t);
  }, [zauzet, izlazaka]);

  const kasnije = () => {
    const s = procitaj();
    spremi({ ...s, puta: s.puta + 1, sljedece: Date.now() + KASNIJE_DANA * 86400e3 });
    dogadaj("ocjena_play_kasnije");
    setOtvoreno(false);
  };
  const ocijeni = () => {
    spremi({ ...procitaj(), gotovo: true });
    dogadaj("ocjena_play_ocijeni");
    setOtvoreno(false);
    window.location.href = PLAY;
  };

  return (
    <Ploca
      otvorena={otvoreno}
      zatvori={kasnije}
      naslov="Sviđa vam se CroLovac? ⭐"
      sirina={420}
      podnozje={
        <div className="grid gap-1">
          <Gumb vrsta="primarni" className="w-full" onClick={ocijeni}>
            ⭐ Ocijeni na Google Playu
          </Gumb>
          <button type="button" onClick={kasnije} className="py-2 text-[14.5px] text-tekst-3 hover:text-tekst">
            Kasnije
          </button>
        </div>
      }
    >
      <div className="grid gap-3 pb-1 text-[15px] text-tekst-2">
        <p>Upisali ste već {izlazaka} {izlazaka % 10 >= 2 && izlazaka % 10 <= 4 && (izlazaka % 100 < 12 || izlazaka % 100 > 14) ? "izlaska" : "izlazaka"} – hvala što lovite s nama! 🦌</p>
        <p>
          Aplikaciju radi jedan lovac. Kratka ocjena na Google Playu pomaže da CroLovac pronađu i drugi lovci – traje 10 sekundi.
        </p>
      </div>
    </Ploca>
  );
}
