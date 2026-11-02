"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Ikona from "./Ikona";
import { Znak } from "./Navigacija";
import { Gumb, Polje, obavijest } from "./ui";
import { odustaniOdNoveLozinke, postaviNovuLozinku, useDrustvo } from "@/lib/drustvo";

/**
 * Poveznica „zaboravljena lozinka” iz e-pošte otvara samo ovaj zaslon (račun ostaje zatvoren):
 * nakon nove lozinke korisnik se odjavi i prijavi novom lozinkom.
 */
export default function NovaLozinka() {
  const d = useDrustvo();
  const [lozinka, setLozinka] = useState("");
  const [ponovno, setPonovno] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [radim, setRadim] = useState(false);

  const spremi = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    if (lozinka !== ponovno) return setGreska("Lozinke se ne podudaraju.");
    setRadim(true);
    try {
      await postaviNovuLozinku(lozinka);
      obavijest("Lozinka je promijenjena – prijavite se novom lozinkom");
    } catch (err) {
      setGreska((err as Error).message);
      setRadim(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[1600] overflow-y-auto bg-pozadina" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--naglasak-meki),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-5">
          <Znak velicina={64} />
        </div>
        <div className="mb-6 text-center">
          <h1 className="font-display text-[30px] leading-tight font-semibold">Nova lozinka</h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[14.5px] text-tekst-2">
            <Ikona ime="stit" velicina={16} className="text-naglasak" /> Zatim se prijavite s njom
          </p>
        </div>
        <form onSubmit={spremi} className="kartica grid gap-3.5 p-5">
          {d.sesija ? (
            <>
              <Polje oznaka="Nova lozinka" pomoc="Najmanje 8 znakova, slova i brojke">
                <input type="password" autoComplete="new-password" required minLength={8} className="unos" value={lozinka} onChange={(e) => setLozinka(e.target.value)} />
              </Polje>
              <Polje oznaka="Ponovite lozinku">
                <input type="password" autoComplete="new-password" required minLength={8} className="unos" value={ponovno} onChange={(e) => setPonovno(e.target.value)} />
              </Polje>
              {greska && <p className="rounded-xl bg-opasnost-meka p-3 text-[14px] text-opasnost">{greska}</p>}
              <Gumb type="submit" vrsta="primarni" className="w-full" disabled={radim}>
                {radim ? "Spremam…" : "Spremi novu lozinku"}
              </Gumb>
            </>
          ) : (
            <p className="py-4 text-center text-[14.5px] text-tekst-2">Provjeravam poveznicu…</p>
          )}
          <button type="button" onClick={() => void odustaniOdNoveLozinke()} className="justify-self-center text-[13.5px] font-medium text-tekst-3 hover:text-tekst">
            Odustani
          </button>
        </form>
      </div>
    </motion.div>
  );
}
