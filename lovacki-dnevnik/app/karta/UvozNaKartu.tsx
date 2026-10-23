"use client";

import { useRef, useState } from "react";
import Ikona from "@/components/Ikona";
import ZalijepiLokaciju from "@/components/lokacija/ZalijepiLokaciju";
import { Gumb, obavijest } from "@/components/ui";
import { metri } from "@/lib/format";
import type { Koordinate } from "@/lib/lokacijaIzTeksta";
import { uveziStazu } from "@/lib/staze";
import { db } from "@/lib/store";
import type { Staza } from "@/lib/types";

/** Dio izbornika slojeva: lokacija iz Google karata i uvoz staza (GPX/KML) s popisom uvezenih. */
export default function UvozNaKartu({
  pro,
  staze,
  pokaziStazu,
  lokacija,
}: {
  /** Uvoz staza (GPX/KML) je PRO funkcija; lokacija iz Google karata je za sve. */
  pro: boolean;
  staze: Staza[];
  pokaziStazu: (s: Staza) => void;
  lokacija: (k: Koordinate) => void;
}) {
  const ulaz = useRef<HTMLInputElement>(null);
  const [radim, setRadim] = useState(false);

  const odabrano = async (datoteke: FileList | null) => {
    if (!datoteke?.length) return;
    setRadim(true);
    let zadnja: Staza | null = null;
    for (const d of Array.from(datoteke)) {
      try {
        zadnja = await uveziStazu(d);
      } catch (e) {
        obavijest(`${d.name}: ${(e as Error).message}`, "greska");
      }
    }
    setRadim(false);
    if (ulaz.current) ulaz.current.value = "";
    if (zadnja) {
      obavijest(`Staza „${zadnja.naziv}” je dodana na kartu`);
      pokaziStazu(zadnja);
    }
  };

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="mb-2 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Uvoz</div>
      <ZalijepiLokaciju tamno primijeni={lokacija} />
      {pro && (
        <>
        <Gumb velicina="sm" ikona="ucitaj" className="mt-2 w-full border-white/10 bg-white/10 text-white" onClick={() => ulaz.current?.click()} disabled={radim}>
          {radim ? "Učitavam…" : "Uvezi stazu (GPX, KML)"}
        </Gumb>
        <input
          ref={ulaz}
          type="file"
          multiple
          // Neki mobiteli GPX/KML ne prepoznaju po vrsti, pa se dopušta i bilo koja datoteka.
          accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml,application/xml,text/xml,*/*"
          className="hidden"
          onChange={(e) => odabrano(e.target.files)}
        />
        {staze.length > 0 && (
          <ul className="mt-2 grid gap-1">
            {staze.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-[13px] hover:bg-white/5">
                <span className="h-1 w-4 shrink-0 rounded-full" style={{ background: s.boja }} />
                <button className="min-w-0 flex-1 text-left" onClick={() => pokaziStazu(s)}>
                  <span className="block truncate">{s.naziv}</span>
                  {s.duljina > 0 && <span className="text-[11.5px] text-white/50">{metri(s.duljina)}</span>}
                </button>
                <button
                  aria-label={`Obriši stazu ${s.naziv}`}
                  className="p-1 text-white/40 hover:text-[#e2735f]"
                  onClick={() => {
                    db.obrisi("staze", s.id);
                    obavijest("Staza je obrisana");
                  }}
                >
                  <Ikona ime="smece" velicina={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        </>
      )}
    </div>
  );
}
