"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Ikona from "./Ikona";
import { Gumb, Ploca, cx, obavijest } from "./ui";
import { konfigurirano, posaljiSos, prekiniSos, useDrustvo } from "@/lib/drustvo";
import { pratiLokaciju } from "@/lib/nativno";

type Poz = { lat: number; lng: number; tocnost: number; vrijeme?: number };

/** Stupnjevi, minute i sekunde – operateri 112 i HGSS ih često traže. */
function dms(v: number, poz: string, neg: string) {
  const a = Math.abs(v);
  const st = Math.floor(a);
  const mi = Math.floor((a - st) * 60);
  const se = ((a - st) * 60 - mi) * 60;
  return `${st}° ${mi}′ ${se.toFixed(1)}″ ${v >= 0 ? poz : neg}`;
}

export function porukaSos(p: Poz) {
  const k = `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
  return `🆘 HITNO – trebam pomoć! Moja lokacija: ${k} (±${Math.round(p.tocnost)} m) https://maps.google.com/?q=${p.lat.toFixed(5)},${p.lng.toFixed(5)} – poslano iz CroLovca`;
}

/** Crveni gumb SOS (Lov u tijeku, Lovci, izbornik Više). */
export function SosGumb({ className, veliki }: { className?: string; veliki?: boolean }) {
  const [otvoreno, setOtvoreno] = useState(false);
  return (
    <>
      <button
        onClick={() => setOtvoreno(true)}
        aria-label="SOS – hitna pomoć"
        className={cx(
          "flex items-center justify-center gap-2 rounded-2xl bg-[#c8372d] font-semibold tracking-wide text-white shadow-[0_10px_28px_-12px_#c8372d] active:scale-[0.98]",
          veliki ? "w-full px-4 py-3.5 text-[16px]" : "px-3.5 py-2 text-[14px]",
          className,
        )}
      >
        <Ikona ime="upozorenje" velicina={veliki ? 20 : 17} />
        {veliki ? "SOS – hitna pomoć" : "SOS"}
      </button>
      <SosPloca otvorena={otvoreno} zatvori={() => setOtvoreno(false)} />
    </>
  );
}

export function SosPloca({ otvorena, zatvori }: { otvorena: boolean; zatvori: () => void }) {
  const d = useDrustvo();
  const [poz, setPoz] = useState<Poz | null>(null);
  const [greska, setGreska] = useState(false);
  const [saljem, setSaljem] = useState(false);

  useEffect(() => {
    if (!otvorena) return;
    return pratiLokaciju(
      (p) => {
        setPoz({ lat: p.lat, lng: p.lng, tocnost: p.tocnost, vrijeme: Date.now() });
        setGreska(false);
      },
      () => setGreska(true),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }, [otvorena]);

  const prijatelja = d.prijateljstva.filter((p) => p.status === "prihvaceno").length;
  const tekst = poz ? porukaSos(poz) : "";

  const podijeli = async () => {
    if (!poz) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: tekst });
        return;
      } catch {}
    }
    window.location.href = `sms:?&body=${encodeURIComponent(tekst)}`;
  };
  const kopiraj = async () => {
    try {
      await navigator.clipboard.writeText(tekst);
      obavijest("Lokacija je kopirana");
    } catch {
      obavijest("Kopiranje nije uspjelo – prepišite koordinate", "greska");
    }
  };
  const uzbuni = async () => {
    setSaljem(true);
    try {
      await posaljiSos(poz);
      obavijest("Prijatelji su uzbunjeni");
    } catch (e) {
      obavijest((e as Error).message, "greska");
    }
    setSaljem(false);
  };

  return (
    <Ploca otvorena={otvorena} zatvori={zatvori} naslov="SOS – hitna pomoć" podnaslov="Ostanite mirni. Recite gdje ste i što se dogodilo." sirina={460}>
      <div className="grid gap-3 pb-2">
        <a href="tel:112" className="flex items-center justify-center gap-3 rounded-2xl bg-[#c8372d] py-4 text-[20px] font-bold text-white active:scale-[0.99]">
          <Ikona ime="upozorenje" velicina={24} />
          Nazovi 112
        </a>

        <div className="rounded-2xl border border-rub bg-povrsina-2 p-4">
          <div className="text-[11.5px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Moja lokacija</div>
          {poz ? (
            <>
              <div className="brojke mt-1 text-[22px] font-semibold">
                {poz.lat.toFixed(5)}, {poz.lng.toFixed(5)}
              </div>
              <div className="brojke text-[14px] text-tekst-2">
                {dms(poz.lat, "N", "S")} · {dms(poz.lng, "E", "W")}
              </div>
              <div className={cx("mt-1 text-[13px]", poz.tocnost > 50 ? "text-naglasak" : "text-tekst-3")}>
                Točnost ±{Math.round(poz.tocnost)} m{poz.tocnost > 50 ? " · izoštravam GPS…" : ""}
              </div>
            </>
          ) : (
            <div className="mt-1 text-[15px] text-tekst-2">
              {greska ? "Lokacija nije dostupna – uključite lokaciju (GPS) na mobitelu." : "Tražim GPS… (radi i bez interneta)"}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Gumb ikona="lokacija" vrsta="primarni" onClick={podijeli} disabled={!poz}>
              Pošalji lokaciju
            </Gumb>
            <Gumb ikona="kvacica" onClick={kopiraj} disabled={!poz}>
              Kopiraj
            </Gumb>
          </div>
          <p className="mt-2 text-[12.5px] text-tekst-3">
            Šalje poruku s koordinatama i poveznicom na kartu (WhatsApp, SMS…). SMS prolazi i kad nema mobilnih podataka.
          </p>
        </div>

        {konfigurirano && d.sesija && prijatelja > 0 && (
          <div className="rounded-2xl border border-rub bg-povrsina-2 p-4">
            {d.sos ? (
              <>
                <div className="font-medium text-[#e2735f]">Prijatelji su uzbunjeni</div>
                <p className="mt-1 text-[13px] text-tekst-2">
                  Vide vašu lokaciju u Lovcima i na karti dok je dijeljenje uključeno. Kad je sve u redu, prekinite SOS.
                </p>
                <Gumb className="mt-3 w-full" onClick={() => void prekiniSos().then(() => obavijest("SOS je prekinut"))}>
                  Sve je u redu – prekini SOS
                </Gumb>
              </>
            ) : (
              <>
                <div className="font-medium">Uzbuni prijatelje u CroLovcu</div>
                <p className="mt-1 text-[13px] text-tekst-2">
                  {prijatelja} {prijatelja === 1 ? "prijatelj dobije" : "prijatelja dobiju"} uzbunu i vašu lokaciju (ako imaju otvoren CroLovac ili su u lovu).
                </p>
                <Gumb className="mt-3 w-full border-[#c8372d]/60 text-[#e2735f]" onClick={uzbuni} disabled={saljem}>
                  {saljem ? "Šaljem…" : "Uzbuni prijatelje"}
                </Gumb>
              </>
            )}
          </div>
        )}

        <ul className="grid gap-1.5 rounded-2xl border border-rub p-4 text-[13.5px] text-tekst-2">
          <li>• Ako možete, ostanite na mjestu – lakše vas je pronaći.</li>
          <li>• Operateru 112 pročitajte koordinate s ovog zaslona.</li>
          <li>• Kod krvarenja čvrsto pritisnite ranu čistom tkaninom.</li>
          <li>• Štedite bateriju: smanjite svjetlinu, ne gasite GPS.</li>
        </ul>
      </div>
    </Ploca>
  );
}

/** Uzbuna na vrhu zaslona kad je netko od prijatelja uključio SOS. */
export function SosPrijatelja() {
  const d = useDrustvo();
  const sos = d.lokacije.filter((l) => l.sos);
  if (!sos.length) return null;
  const l = sos[0];
  return (
    <Link
      href={`/karta?fokus=${l.lat.toFixed(5)},${l.lng.toFixed(5)}`}
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[1900] flex items-center gap-3 rounded-2xl bg-[#c8372d] p-3.5 text-white shadow-jaka"
    >
      <Ikona ime="upozorenje" velicina={22} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">SOS: {l.profil.ime} treba pomoć!</span>
        <span className="block text-[13px] opacity-90">
          {l.lat.toFixed(5)}, {l.lng.toFixed(5)} · dodirnite za kartu
        </span>
      </span>
      <Ikona ime="desno" />
    </Link>
  );
}
