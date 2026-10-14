"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { konfigurirano } from "@/lib/drustvo";
import { GMAIL, odbijPoziv, odgodiPoziv, prijaviTestera, trebaPozvati, vecPrijavljen } from "@/lib/testeri";
import Ikona from "./Ikona";
import { cx, opruga } from "./ui";

const KASNJENJE_MS = 20_000;
const nesToOtvoreno = () =>
  Boolean(document.querySelector('.fixed.inset-0.z-\\[2000\\], [role="dialog"][aria-label="Vaše mišljenje"]'));

/** Poziv Android korisnicima da postanu testeri aplikacije na Google Playu. Nikad usred upisa ili lova. */
export default function PozivTesterima({ korisnik, email, zauzet }: { korisnik?: string; email?: string; zauzet: boolean }) {
  const [faza, setFaza] = useState<"skriveno" | "poziv" | "obrazac" | "hvala">("skriveno");
  const [gmail, setGmail] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [saljem, setSaljem] = useState(false);
  const putanja = usePathname();
  const blokirano = useRef(true);
  useEffect(() => {
    blokirano.current = zauzet || putanja === "/lov" || putanja.startsWith("/admin") || putanja === "/privatnost";
  }, [zauzet, putanja]);

  useEffect(() => {
    if (!konfigurirano || !korisnik || !trebaPozvati(korisnik)) return;
    let ziv = true;
    let t: ReturnType<typeof setTimeout>;
    const pokusaj = () => {
      if (!ziv) return;
      if (blokirano.current || nesToOtvoreno() || document.visibilityState !== "visible") {
        t = setTimeout(pokusaj, 15_000);
        return;
      }
      vecPrijavljen(korisnik)
        .then((da) => ziv && !da && setFaza("poziv"))
        .catch(() => {});
    };
    t = setTimeout(pokusaj, KASNJENJE_MS);
    return () => {
      ziv = false;
      clearTimeout(t);
    };
  }, [korisnik]);

  useEffect(() => {
    if (faza !== "hvala") return;
    const t = setTimeout(() => setFaza("skriveno"), 6000);
    return () => clearTimeout(t);
  }, [faza]);

  if (!korisnik) return null;

  const kasnije = () => {
    odgodiPoziv(korisnik);
    setFaza("skriveno");
  };
  const neHvala = () => {
    odbijPoziv(korisnik);
    setFaza("skriveno");
  };
  const otvoriObrazac = () => {
    setGmail(email && GMAIL.test(email) ? email : "");
    setGreska(null);
    setFaza("obrazac");
  };
  const posalji = async () => {
    setSaljem(true);
    setGreska(null);
    try {
      await prijaviTestera(korisnik, gmail);
      setFaza("hvala");
    } catch (e) {
      setGreska((e as Error).message);
    } finally {
      setSaljem(false);
    }
  };

  return (
    <AnimatePresence>
      {faza !== "skriveno" && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={opruga}
          role="dialog"
          aria-label="Postani tester"
          className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[1900] px-3 lg:bottom-6"
        >
          <div className="kartica relative mx-auto max-w-md border-naglasak/40 p-4 shadow-jaka">
            {faza !== "hvala" && (
              <button onClick={kasnije} aria-label="Zatvori" className="absolute top-3 right-3 rounded-lg p-1 text-tekst-3 hover:text-tekst">
                <Ikona ime="x" velicina={18} />
              </button>
            )}
            {faza === "poziv" && (
              <>
                <div className="pr-8 font-display text-[18px] font-semibold">🦌 CroLovac stiže na Google Play!</div>
                <p className="mt-1 text-[13.5px] text-tekst-2">
                  Tražim lovce s Androidom da prvi isprobaju aplikaciju: trag se bilježi i kad je mobitel zaključan u džepu, a
                  alarm zavibrira kad je lovac blizu.
                </p>
                <ul className="mt-2 grid gap-1 text-[13.5px]">
                  <li>🏅 Značka <b>Osnivač</b> uz vaše ime</li>
                  <li>💎 Sve buduće premium opcije <b>besplatno, zauvijek</b></li>
                  <li>🎁 Nagradna igra za testere</li>
                </ul>
                <p className="mt-2 text-[12.5px] text-tekst-3">Trebate Gmail adresu i 14 dana korištenja (par minuta tjedno).</p>
                <button onClick={otvoriObrazac} className="mt-3 w-full rounded-xl bg-naglasak py-2.5 text-[15px] font-semibold text-[#0b100c]">
                  Postani tester
                </button>
                <div className="mt-1 grid grid-cols-2">
                  <button onClick={kasnije} className="py-1.5 text-[13px] text-tekst-3">
                    Kasnije
                  </button>
                  <button onClick={neHvala} className="py-1.5 text-[13px] text-tekst-3">
                    Ne hvala
                  </button>
                </div>
              </>
            )}
            {faza === "obrazac" && (
              <>
                <div className="pr-8 font-display text-[17px] font-semibold">Vaša Gmail adresa</div>
                <p className="mt-1 text-[13px] text-tekst-2">
                  Na nju dodajem pristup testiranju u Google Playu. Mora biti Google račun s kojim ste prijavljeni u Trgovinu Play
                  na ovom mobitelu.
                </p>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value.slice(0, 120))}
                  placeholder="ime.prezime@gmail.com"
                  className="unos mt-3 w-full text-[16px]"
                />
                {greska && <p className="mt-2 text-[13px] text-opasnost">{greska}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setFaza("poziv")} className="flex-1 rounded-xl py-2.5 text-[14px] text-tekst-2">
                    Natrag
                  </button>
                  <button
                    onClick={posalji}
                    disabled={saljem}
                    className={cx("flex-[2] rounded-xl bg-naglasak py-2.5 text-[14.5px] font-semibold text-[#0b100c]", (saljem || !gmail.trim()) && "opacity-70")}
                  >
                    {saljem ? "Šaljem…" : "Prijavi me"}
                  </button>
                </div>
              </>
            )}
            {faza === "hvala" && (
              <div className="flex items-start gap-3">
                <Ikona ime="kvacica" className="mt-0.5 shrink-0 text-naglasak" />
                <div className="text-[14.5px]">
                  <b>Prijavljeni ste, hvala!</b> Kad testiranje krene, na Gmail ćete dobiti poveznicu za preuzimanje aplikacije.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
