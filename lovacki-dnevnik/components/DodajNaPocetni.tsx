"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uAplikaciji } from "@/lib/nativno";
import Ikona from "./Ikona";
import { opruga } from "./ui";

/**
 * Poziv korisnicima u mobilnom pregledniku da CroLovac dodaju na početni zaslon. Na Androidu jedan dodir
 * otvara sistemski prozor za instalaciju; iPhone to ne dopušta stranicama, pa se pokažu koraci uz strelicu
 * prema gumbu Dijeli. Ne pokazuje se u Android aplikaciji ni kad je već dodano na početni zaslon.
 */

type ZahtjevInstalacije = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const KLJUC = "lovacki-dnevnik:pocetni-zaslon";
const KASNJENJE_MS = 25_000;
const DAN = 86_400_000;

let zahtjev: ZahtjevInstalacije | null = null;
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => {
    // Umjesto Chromeove trake, ponudi se u pravom trenutku (vlastitom karticom).
    e.preventDefault();
    zahtjev = e as ZahtjevInstalacije;
  });
  addEventListener("appinstalled", () => odgodi(Infinity));
}

function odgodi(ms: number) {
  try {
    localStorage.setItem(KLJUC, JSON.stringify({ iduce: ms === Infinity ? 9e15 : Date.now() + ms }));
  } catch {}
}
function smijeSe() {
  try {
    return Date.now() > ((JSON.parse(localStorage.getItem(KLJUC) ?? "{}") as { iduce?: number }).iduce ?? 0);
  } catch {
    return false;
  }
}

function platforma(): "ios" | "android" | null {
  const ua = navigator.userAgent;
  const samostalno = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (samostalno || uAplikaciji()) return null;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

const nestoOtvoreno = () => Boolean(document.querySelector('.fixed.inset-0.z-\\[2000\\], [role="dialog"]'));

function IkonaDijeli({ velicina = 20 }: { velicina?: number }) {
  return (
    <svg width={velicina} height={velicina} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

export default function DodajNaPocetni({ zauzet }: { zauzet: boolean }) {
  const [faza, setFaza] = useState<"skriveno" | "poziv" | "ios" | "android">("skriveno");
  const [sustav, setSustav] = useState<"ios" | "android" | null>(null);
  const putanja = usePathname();
  const blokirano = useRef(true);
  useEffect(() => {
    blokirano.current = zauzet || putanja === "/lov" || putanja.startsWith("/admin") || putanja === "/privatnost";
  }, [zauzet, putanja]);

  useEffect(() => {
    const p = platforma();
    if (!p || !smijeSe()) return;
    let t: ReturnType<typeof setTimeout>;
    const pokusaj = () => {
      if (blokirano.current || nestoOtvoreno() || document.visibilityState !== "visible") {
        t = setTimeout(pokusaj, 15_000);
        return;
      }
      setSustav(p);
      setFaza("poziv");
    };
    t = setTimeout(pokusaj, KASNJENJE_MS);
    return () => clearTimeout(t);
  }, []);

  const neSad = () => {
    odgodi(7 * DAN);
    setFaza("skriveno");
  };

  const dodaj = async () => {
    if (sustav === "android" && zahtjev) {
      const z = zahtjev;
      zahtjev = null;
      await z.prompt();
      const { outcome } = await z.userChoice;
      odgodi(outcome === "accepted" ? Infinity : 3 * DAN);
      setFaza("skriveno");
      return;
    }
    setFaza(sustav === "ios" ? "ios" : "android");
  };

  const ipad = typeof navigator !== "undefined" && !/iPhone|iPod/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      {faza !== "skriveno" && (
        <motion.div
          key="pocetni"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={opruga}
          role="dialog"
          aria-label="Dodaj na početni zaslon"
          className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[1900] px-3 lg:bottom-6"
        >
          <div className="kartica relative mx-auto max-w-md border-naglasak/40 p-4 shadow-jaka">
            <button onClick={neSad} aria-label="Zatvori" className="absolute top-3 right-3 rounded-lg p-1 text-tekst-3 hover:text-tekst">
              <Ikona ime="x" velicina={18} />
            </button>
            {faza === "poziv" && (
              <>
                <div className="flex items-center gap-3 pr-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/icon-192.png" alt="" className="size-12 rounded-xl" />
                  <div>
                    <div className="font-display text-[17px] leading-tight font-semibold">Dodaj CroLovac na početni zaslon</div>
                    <div className="text-[13px] text-tekst-2">Otvara se kao prava aplikacija, preko cijelog zaslona i brže.</div>
                  </div>
                </div>
                <button onClick={dodaj} className="mt-3 w-full rounded-xl bg-naglasak py-2.5 text-[15px] font-semibold text-[#0b100c]">
                  Dodaj na početni zaslon
                </button>
                <button onClick={neSad} className="mt-1 w-full py-1.5 text-[13px] text-tekst-3">
                  Ne sad
                </button>
              </>
            )}
            {faza === "ios" && (
              <>
                <div className="pr-8 font-display text-[17px] font-semibold">Dva dodira i gotovo</div>
                <ol className="mt-2 grid gap-2.5 text-[14px]">
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-povrsina-2 text-[#4ea1ff]">
                      <IkonaDijeli />
                    </span>
                    <span>
                      Dodirnite <b>Dijeli</b> {ipad ? "gore desno" : "na dnu Safarija"}
                      <span className="block text-[12px] text-tekst-3">Ne vidite ga? Prvo dodirnite ••• pa Dijeli.</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-povrsina-2 text-[18px]">＋</span>
                    <span>
                      Odaberite <b>Dodaj na početni zaslon</b>
                      <span className="block text-[12px] text-tekst-3">malo niže u popisu, ispod ikona aplikacija</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-lg bg-povrsina-2 px-1.5 text-[12px] font-semibold text-[#4ea1ff]">Dodaj</span>
                    <span>
                      Gore desno dodirnite <b>Dodaj</b>
                    </span>
                  </li>
                </ol>
                <button onClick={() => (odgodi(30 * DAN), setFaza("skriveno"))} className="mt-3 w-full rounded-xl bg-povrsina-2 py-2.5 text-[14px] font-medium">
                  U redu
                </button>
              </>
            )}
            {faza === "android" && (
              <>
                <div className="pr-8 font-display text-[17px] font-semibold">Dodavanje na početni zaslon</div>
                <ol className="mt-2 grid gap-2 text-[14px]">
                  <li>
                    1. Dodirnite izbornik <b>⋮</b> gore desno u pregledniku
                  </li>
                  <li>
                    2. Odaberite <b>Dodaj na početni zaslon</b> ili <b>Instaliraj aplikaciju</b>
                  </li>
                  <li>
                    3. Potvrdite s <b>Dodaj</b> / <b>Instaliraj</b>
                  </li>
                </ol>
                <button onClick={() => (odgodi(30 * DAN), setFaza("skriveno"))} className="mt-3 w-full rounded-xl bg-povrsina-2 py-2.5 text-[14px] font-medium">
                  U redu
                </button>
              </>
            )}
          </div>
          {faza === "ios" && !ipad && (
            // Strelica prema gumbu Dijeli u donjoj traci Safarija (ispod stranice).
            <motion.div
              className="pointer-events-none fixed bottom-[max(0.25rem,env(safe-area-inset-bottom))] left-1/2 -ml-4 text-naglasak"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 4v15M6 13l6 6 6-6" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
