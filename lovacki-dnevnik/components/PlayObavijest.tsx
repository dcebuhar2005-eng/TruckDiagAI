"use client";

import { useEffect, useState } from "react";
import Ikona from "./Ikona";
import { Gumb, Ploca } from "./ui";
import { uAplikaciji } from "@/lib/nativno";
import { dogadaj } from "@/lib/pracenje";

const KLJUC = "lovacki-dnevnik:play-obavijest";
const PLAY = "https://play.google.com/store/apps/details?id=com.crolovac.app&referrer=utm_source%3Dcrolovac_web%26utm_medium%3Dobavijest%26utm_campaign%3Dplay";
const KASNIJE_DANA = 3;
const NAJVISE_PUTA = 3;

type Stanje = { puta: number; sljedece: number; instalirano?: boolean };

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
 * Android u pregledniku (ne aplikacija s Playa): ponuda da se instalira CroLovac s Google Playa.
 * Na „Kasnije” se javi za 3 dana, najviše 3 puta; nikad usred lova ni dok je otvorena druga ploča.
 */
export default function PlayObavijest({ zauzet }: { zauzet: boolean }) {
  const [otvoreno, setOtvoreno] = useState(false);

  useEffect(() => {
    if (zauzet || !/Android/i.test(navigator.userAgent) || uAplikaciji()) return;
    const s = procitaj();
    if (s.instalirano || s.puta >= NAJVISE_PUTA || Date.now() < s.sljedece) return;
    const t = setTimeout(() => {
      if (document.querySelector('[role="dialog"][aria-modal]') || document.visibilityState !== "visible") return;
      setOtvoreno(true);
      dogadaj("play_obavijest_prikazana");
    }, 6000);
    return () => clearTimeout(t);
  }, [zauzet]);

  const kasnije = () => {
    const s = procitaj();
    spremi({ ...s, puta: s.puta + 1, sljedece: Date.now() + KASNIJE_DANA * 86400e3 });
    setOtvoreno(false);
  };
  const instaliraj = () => {
    spremi({ ...procitaj(), instalirano: true });
    dogadaj("play_obavijest_instaliraj");
    setOtvoreno(false);
    window.location.href = PLAY;
  };

  return (
    <Ploca
      otvorena={otvoreno}
      zatvori={kasnije}
      naslov="CroLovac je sada na Google Playu! 🎉"
      podnaslov="Koristite CroLovac preko preglednika. Instalirajte pravu aplikaciju – radi bolje i dobivate:"
      sirina={440}
      podnozje={
        <div className="grid gap-1">
          <Gumb vrsta="primarni" className="w-full" onClick={instaliraj}>
            Instaliraj s Google Playa
          </Gumb>
          <button type="button" onClick={kasnije} className="py-2 text-[14.5px] text-tekst-3 hover:text-tekst">
            Kasnije
          </button>
        </div>
      }
    >
      <div className="grid gap-3 pb-1">
        <ul className="grid gap-2.5 text-[15px]">
          <li className="flex gap-2.5">
            <span>🔔</span>Obavijesti – lovac blizu, večer prije lova
          </li>
          <li className="flex gap-2.5">
            <span>⚡</span>Brže otvaranje, kao svaka aplikacija
          </li>
          <li className="flex gap-2.5">
            <span>🦌</span>Ikonu CroLovca na početnom zaslonu
          </li>
        </ul>
        <p className="flex gap-2.5 rounded-xl bg-povrsina-2 p-3 text-[13.5px] text-tekst-2">
          <Ikona ime="stit" velicina={17} className="mt-0.5 shrink-0 text-naglasak" />
          Vaš dnevnik je spremljen u računu – u aplikaciji se samo prijavite istim e-mailom i lozinkom.
        </p>
      </div>
    </Ploca>
  );
}
