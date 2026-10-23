"use client";

import { useState } from "react";
import { lokacijaIzUnosa, procitajMedjuspremnik } from "@/lib/lokacijaIzGoogla";
import type { Koordinate } from "@/lib/lokacijaIzTeksta";
import { Gumb, cx, obavijest } from "../ui";

/**
 * Lokacija iz Google karata: najprije pokuša s međuspremnikom (link ili koordinate koje je lovac
 * upravo kopirao), a ako to ne ide, otvori polje u koje ih sam zalijepi.
 */
export default function ZalijepiLokaciju({
  primijeni,
  className,
  tamno,
}: {
  primijeni: (k: Koordinate) => void;
  className?: string;
  /** Na tamnoj podlozi karte. */
  tamno?: boolean;
}) {
  const [polje, setPolje] = useState(false);
  const [tekst, setTekst] = useState("");
  const [radim, setRadim] = useState(false);

  const probaj = async (unos: string, tiho = false) => {
    setRadim(true);
    try {
      const k = await lokacijaIzUnosa(unos);
      primijeni(k);
      setPolje(false);
      setTekst("");
      obavijest("Lokacija iz Google karata je preuzeta");
      return true;
    } catch (e) {
      if (!tiho) obavijest((e as Error).message, "greska");
      return false;
    } finally {
      setRadim(false);
    }
  };

  const klik = async () => {
    if (polje) return setPolje(false);
    const iz = await procitajMedjuspremnik();
    if (iz && (await probaj(iz, true))) return;
    setPolje(true);
  };

  return (
    <div className={className}>
      <Gumb
        velicina="sm"
        ikona="lokacija"
        onClick={klik}
        disabled={radim}
        className={cx("w-full", tamno && "border-white/10 bg-white/10 text-white")}
      >
        {radim ? "Tražim…" : "Iz Google karata"}
      </Gumb>
      {polje && (
        <div className="mt-2 grid gap-2">
          <textarea
            autoFocus
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={2}
            placeholder="Zalijepite link ili koordinate (npr. 45.31234, 14.72345)"
            className={cx(
              "w-full resize-none rounded-xl border px-3 py-2 text-[14px] outline-none",
              tamno ? "border-white/15 bg-black/30 text-white placeholder:text-white/40" : "border-rub bg-povrsina placeholder:text-tekst-3",
            )}
          />
          <p className={cx("text-[12px]", tamno ? "text-white/55" : "text-tekst-3")}>
            U Google kartama dodirnite mjesto → <b>Dijeli</b> → <b>Kopiraj link</b>. Ili dugo pritisnite mjesto i kopirajte koordinate.
          </p>
          <Gumb velicina="sm" vrsta="primarni" onClick={() => probaj(tekst)} disabled={!tekst.trim() || radim}>
            Preuzmi lokaciju
          </Gumb>
        </div>
      )}
    </div>
  );
}
