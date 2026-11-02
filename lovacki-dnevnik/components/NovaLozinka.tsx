"use client";

import { useState } from "react";
import { Gumb, Ploca, Polje, obavijest } from "./ui";
import { odustaniOdNoveLozinke, postaviNovuLozinku, useDrustvo } from "@/lib/drustvo";

/** Nakon poveznice „zaboravljena lozinka” iz e-pošte: upis nove lozinke. */
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
      obavijest("Lozinka je promijenjena – prijavljeni ste");
      setLozinka("");
      setPonovno("");
    } catch (err) {
      setGreska((err as Error).message);
    } finally {
      setRadim(false);
    }
  };

  return (
    <Ploca otvorena={d.oporavakLozinke && Boolean(d.sesija)} zatvori={odustaniOdNoveLozinke} naslov="Nova lozinka" podnaslov="Upišite novu lozinku za svoj račun" sirina={420}>
      <form onSubmit={spremi} className="grid gap-3.5 pb-2">
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
      </form>
    </Ploca>
  );
}
