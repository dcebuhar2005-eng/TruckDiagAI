"use client";

import { useEffect, useState } from "react";
import { moguDijeliti, nacrtajKarticu, podijeliKarticu } from "@/lib/kartica";
import { dogadaj } from "@/lib/pracenje";
import type { Odstrel } from "@/lib/types";
import { Gumb, Ploca, obavijest } from "./ui";

/** Pregled kartice lova i dijeljenje (WhatsApp, Facebook, Instagram…). */
export default function KarticaLova({
  odstrel,
  foto,
  lovisteNaziv,
  otvorena,
  zatvori,
}: {
  odstrel: Odstrel;
  foto?: string;
  lovisteNaziv?: string;
  otvorena: boolean;
  zatvori: () => void;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [radim, setRadim] = useState(false);
  const moze = moguDijeliti();

  useEffect(() => {
    let ziv = true;
    let u: string | null = null;
    nacrtajKarticu(odstrel, foto, lovisteNaziv)
      .then((b) => {
        if (!ziv) return;
        u = URL.createObjectURL(b);
        setBlob(b);
        setUrl(u);
      })
      .catch(() => obavijest("Kartica nije napravljena", "greska"));
    return () => {
      ziv = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [odstrel, foto, lovisteNaziv]);

  const podijeli = async () => {
    if (!blob) return;
    setRadim(true);
    try {
      const ok = await podijeliKarticu(blob, `crolovac-${odstrel.datum}.png`, `${odstrel.vrsta} – Dobra kob! 🍀 Zapisano u CroLovcu: https://crolovac.com`);
      if (ok) dogadaj("kartica_lova_podijeljena", { vrsta: odstrel.vrsta });
    } catch {
      obavijest("Dijeljenje nije uspjelo", "greska");
    } finally {
      setRadim(false);
    }
  };

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Podijeli kartu lova"
      podnaslov="Slika za WhatsApp, Facebook ili Instagram"
      sirina={460}
      podnozje={
        moze ? (
          <Gumb vrsta="primarni" className="w-full" disabled={!blob || radim} onClick={podijeli}>
            {radim ? "Pripremam…" : "Podijeli"}
          </Gumb>
        ) : (
          <p className="text-center text-[13.5px] text-tekst-2">Za dijeljenje ažurirajte CroLovac na Google Playu.</p>
        )
      }
    >
      <div className="pb-2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Kartica lova" className="w-full rounded-2xl border border-rub" />
        ) : (
          <div className="svjetlucanje aspect-[4/5] w-full rounded-2xl" />
        )}
      </div>
    </Ploca>
  );
}
