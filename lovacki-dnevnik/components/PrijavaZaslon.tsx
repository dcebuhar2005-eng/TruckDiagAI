"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ISTEK_PRIJAVE_DANA, prijava, registracija, useDrustvo } from "@/lib/drustvo";
import Ikona from "./Ikona";
import { Znak } from "./Navigacija";
import { Gumb, Naslov, Polje, Segmenti, cx, obavijest } from "./ui";

/** Zaslon prije prijave: dnevnik je privatan i vidi ga samo prijavljeni vlasnik. */
export default function PrijavaZaslon() {
  return (
    <motion.div
      className="fixed inset-0 z-[1500] overflow-y-auto bg-pozadina"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--naglasak-meki),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.05 }}
          className="mx-auto mb-5"
        >
          <Znak velicina={72} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-6 text-center">
          <h1 className="font-display text-[32px] leading-tight font-semibold">CroLovac</h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[14.5px] text-tekst-2">
            <Ikona ime="stit" velicina={16} className="text-naglasak" /> Vaš dnevnik je privatan – prijavite se
          </p>
        </motion.div>
        <ObrazacPrijave bezZaglavlja />
      </div>
    </motion.div>
  );
}

export function ObrazacPrijave({ bezZaglavlja }: { bezZaglavlja?: boolean }) {
  const istekla = useDrustvo().prijavaIstekla;
  const [nacin, setNacin] = useState<"prijava" | "registracija">("prijava");
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [radim, setRadim] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadim(true);
    setPoruka(null);
    try {
      if (nacin === "prijava") {
        await prijava(email.trim(), lozinka);
        obavijest("Prijavljeni ste");
      } else {
        if (lozinka.length < 8 || !/[a-zA-ZčćžšđČĆŽŠĐ]/.test(lozinka) || !/\d/.test(lozinka))
          throw new Error("Lozinka mora imati barem 8 znakova, i slova i brojke.");
        const { trebaPotvrda } = await registracija(email.trim(), lozinka);
        if (trebaPotvrda) {
          setPoruka({ tekst: "Poslali smo vam e-mail. Kliknite poveznicu u njemu, zatim se vratite ovdje i prijavite.", greska: false });
          setNacin("prijava");
        }
      }
    } catch (err) {
      setPoruka({ tekst: (err as Error).message, greska: true });
    } finally {
      setRadim(false);
    }
  };

  return (
    <div>
      {!bezZaglavlja && (
        <Naslov natpis="Sigurnost u lovu" naslov="Lovci" opis="Prijavite se za prijatelje i dijeljenje lokacije." />
      )}
      <motion.form
        onSubmit={posalji}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="kartica mx-auto max-w-md p-5"
      >
        {istekla && (
          <p className="mb-4 rounded-xl bg-naglasak-meki p-3 text-[14px]">
            Aplikacija nije otvarana više od {ISTEK_PRIJAVE_DANA / 30} mjeseca, pa vas je radi sigurnosti odjavila. Prijavite se ponovno.
          </p>
        )}
        <Segmenti
          className="mb-5"
          vrijednost={nacin}
          promjena={(v) => {
            setNacin(v);
            setPoruka(null);
          }}
          opcije={[
            { vrijednost: "prijava", oznaka: "Prijava" },
            { vrijednost: "registracija", oznaka: "Novi račun" },
          ]}
        />
        <div className="grid gap-3.5">
          <Polje oznaka="E-mail">
            <input id="lov-email" type="email" autoComplete="email" required className="unos" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Polje>
          <Polje oznaka="Lozinka" pomoc={nacin === "registracija" ? "Najmanje 8 znakova, slova i brojke" : undefined}>
            <input
              id="lov-lozinka"
              type="password"
              autoComplete={nacin === "prijava" ? "current-password" : "new-password"}
              required
              minLength={nacin === "registracija" ? 8 : 6}
              className="unos"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
            />
          </Polje>
        </div>
        <AnimatePresence>
          {poruka && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cx("mt-4 rounded-xl p-3 text-[14px]", poruka.greska ? "bg-opasnost-meka text-opasnost" : "bg-mahovina-meka text-tekst")}
            >
              {poruka.tekst}
            </motion.p>
          )}
        </AnimatePresence>
        <Gumb type="submit" vrsta="primarni" className="mt-5 w-full" disabled={radim}>
          {radim ? "Pričekajte…" : nacin === "prijava" ? "Prijavi se" : "Napravi račun"}
        </Gumb>
        <p className="mt-4 text-[12.5px] text-tekst-3">
          Dnevnik je vezan uz vaš račun: vidite ga samo kad ste prijavljeni, i to na svakom mobitelu na kojem se prijavite.
          Nitko drugi – ni prijatelji – ne može vidjeti vaše izlaske, odstrel ni lovišta.
        </p>
        <a href="/privatnost" className="mt-2 inline-block text-[12.5px] font-medium text-naglasak">
          Pravila privatnosti
        </a>
      </motion.form>
    </div>
  );
}

