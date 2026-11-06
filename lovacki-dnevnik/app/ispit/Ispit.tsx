"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Kostur } from "@/components/Kostur";
import { slavi } from "@/components/Slavlje";
import { Gumb, Naslov, cx, useKlijent } from "@/components/ui";
import { noviKrug, type Pitanje } from "@/lib/ispit";
import { DRZAVE, odabranaDrzava } from "@/lib/lovostaj";
import { dodir } from "@/lib/nativno";
import { dogadaj } from "@/lib/pracenje";

const KLJUC = "lovacki-dnevnik:ispit-najbolje";

function najbolje(): number {
  try {
    return Number(localStorage.getItem(KLJUC) ?? 0);
  } catch {
    return 0;
  }
}

export default function Ispit() {
  const klijent = useKlijent();
  if (!klijent) return <Kostur />;
  return <Kviz />;
}

function Kviz() {
  const [drzavaK] = useState(odabranaDrzava);
  const drzava = DRZAVE.find((d) => d.k === drzavaK) ?? DRZAVE[0];
  const [pitanja, setPitanja] = useState<Pitanje[]>(() => noviKrug(drzavaK));
  const [i, setI] = useState(0);
  const [odabran, setOdabran] = useState<number | null>(null);
  const [tocnih, setTocnih] = useState(0);
  const [rekord, setRekord] = useState(najbolje);
  const gotovo = i >= pitanja.length;
  const p = pitanja[i];

  const odgovori = (k: number) => {
    if (odabran != null) return;
    setOdabran(k);
    const ok = k === p.tocan;
    dodir(ok ? "uspjeh" : "lagano");
    if (ok) setTocnih((t) => t + 1);
  };
  const dalje = () => {
    const sljedece = i + 1;
    if (sljedece >= pitanja.length) {
      const rez = tocnih;
      dogadaj("ispit_krug", { tocnih: rez, od: pitanja.length, drzava: drzavaK });
      if (rez > rekord) {
        setRekord(rez);
        try {
          localStorage.setItem(KLJUC, String(rez));
        } catch {}
      }
      if (rez >= 8) slavi("konfete");
    }
    setOdabran(null);
    setI(sljedece);
  };
  const ponovi = () => {
    setPitanja(noviKrug(drzavaK));
    setI(0);
    setTocnih(0);
    setOdabran(null);
  };

  return (
    <div className="mx-auto max-w-xl">
      <Naslov natpis="Vježba" naslov="Lovački ispit" opis={`10 pitanja: biologija, sigurnost, lovačka praksa i lovostaj (${drzava.zastava} ${drzava.naziv}).`} />

      {!gotovo ? (
        <div className="kartica p-5">
          <div className="mb-3 flex items-center justify-between text-[12.5px] text-tekst-3">
            <span className="font-semibold tracking-[0.12em] uppercase">{p.tema}</span>
            <span className="brojke">
              {i + 1} / {pitanja.length}
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-povrsina-3">
            <motion.div className="h-full bg-naglasak" animate={{ width: `${(i / pitanja.length) * 100}%` }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={p.id + i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <h2 className="mb-4 font-display text-[21px] leading-snug font-semibold">{p.pitanje}</h2>
              <div className="grid gap-2">
                {p.odgovori.map((o, k) => {
                  const pokazi = odabran != null;
                  const tocno = k === p.tocan;
                  return (
                    <button
                      key={k}
                      onClick={() => odgovori(k)}
                      disabled={pokazi}
                      className={cx(
                        "rounded-2xl border px-4 py-3 text-left text-[15px] transition-colors",
                        !pokazi && "border-rub bg-povrsina-2 hover:border-naglasak",
                        pokazi && tocno && "border-mahovina bg-mahovina-meka font-semibold text-mahovina",
                        pokazi && !tocno && k === odabran && "border-opasnost bg-opasnost-meka text-opasnost",
                        pokazi && !tocno && k !== odabran && "border-rub opacity-60",
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {odabran != null && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-3">
                  <p className={cx("text-[14.5px] font-semibold", odabran === p.tocan ? "text-mahovina" : "text-opasnost")}>
                    {odabran === p.tocan ? "✓ Točno!" : "✗ Netočno"}
                  </p>
                  {p.objasnjenje && <p className="text-[13.5px] text-tekst-2">{p.objasnjenje}</p>}
                  <Gumb vrsta="primarni" className="w-full" onClick={dalje}>
                    {i + 1 < pitanja.length ? "Sljedeće pitanje" : "Rezultat"}
                  </Gumb>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="kartica p-6 text-center">
          <div className="text-[48px]">{tocnih >= 8 ? "🏆" : tocnih >= 5 ? "🦌" : "📚"}</div>
          <div className="mt-2 font-display text-[34px] font-semibold">
            {tocnih} / {pitanja.length}
          </div>
          <p className="mt-1 text-tekst-2">
            {tocnih >= 8 ? "Odlično – spremni ste za ispit!" : tocnih >= 5 ? "Dobro, još malo vježbe." : "Ponovite gradivo i pokušajte opet."}
          </p>
          {rekord > 0 && <p className="mt-1 text-[13px] text-tekst-3">Najbolji rezultat: {rekord} / 10</p>}
          <Gumb vrsta="primarni" className="mt-5 w-full" onClick={ponovi}>
            Novi krug pitanja
          </Gumb>
        </motion.div>
      )}

      <p className="mt-4 px-1 text-[12px] text-tekst-3">
        Za vježbu. Pitanja o lovostaju slažu se iz službenih propisa (lovni kalendar), državu mijenjate u Lovnom kalendaru. Službeni program i
        literaturu za lovački ispit daje vaš lovački savez.
      </p>
    </div>
  );
}
