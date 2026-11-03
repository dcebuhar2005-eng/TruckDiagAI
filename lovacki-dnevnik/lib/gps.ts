"use client";

import { obavijest } from "@/components/ui";

export type Fiks = { lat: number; lng: number; tocnost: number };

/**
 * Precizna lokacija: mobitel prvo javi grubu lokaciju (mreža, ±50–500 m), a satelit tek
 * nakon nekoliko sekundi. Čekamo dok točnost ne padne na `cilj` metara ili dok ne istekne
 * `maksMs` – tada vraćamo najbolju dobivenu.
 */
export function preciznaLokacija(opt: { cilj?: number; maksMs?: number; napredak?: (f: Fiks) => void } = {}): Promise<Fiks> {
  const { cilj = 12, maksMs = 20000, napredak } = opt;
  return new Promise((rijesi, odbij) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return odbij(new Error("Lokacija nije podržana"));
    let najbolja: Fiks | null = null;
    let gotovo = false;
    const zavrsi = (greska?: Error) => {
      if (gotovo) return;
      gotovo = true;
      navigator.geolocation.clearWatch(id);
      clearTimeout(t);
      if (najbolja) rijesi(najbolja);
      else odbij(greska ?? new Error("Lokacija nije dostupna"));
    };
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const f = { lat: p.coords.latitude, lng: p.coords.longitude, tocnost: p.coords.accuracy };
        if (!najbolja || f.tocnost <= najbolja.tocnost) najbolja = f;
        napredak?.(najbolja);
        if (najbolja.tocnost <= cilj) zavrsi();
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) zavrsi(new Error("Lokacija nije dopuštena"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maksMs },
    );
    const t = setTimeout(() => zavrsi(), maksMs);
  });
}

/** Ako je lokacija vrlo gruba, mobitel vjerojatno ima uključenu samo „približnu lokaciju”. */
export function upozoriAkoGruba(f: Fiks) {
  if (f.tocnost > 300)
    obavijest(
      `Lokacija je gruba (±${Math.round(f.tocnost)} m). Uključite „Precizna lokacija”: Postavke → Aplikacije → CroLovac (ili preglednik) → Dopuštenja → Lokacija.`,
      "info",
    );
  else if (f.tocnost > 30) obavijest(`GPS je slab (±${Math.round(f.tocnost)} m) – na otvorenom bit će točnije`, "info");
}
