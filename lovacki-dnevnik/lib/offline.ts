"use client";

import { useSyncExternalStore } from "react";

/**
 * Karta bez signala: preuzimanje pločica odabranog područja u Cache Storage
 * (service worker ih poslužuje kad nema interneta) te popis spremljenih područja.
 */

export const SPREMISTE = "lov-offline-v1";
const KLJUC = "lovacki-dnevnik:offline-podrucja";
/** Gornja granica po području – umjerena upotreba besplatnih servisa. */
export const MAKS_PLOCICA = 5000;
const ISTODOBNO = 6;

export interface SlojZaPreuzimanje {
  url: string;
  retina?: boolean;
}

export interface Granice {
  j: number;
  s: number;
  z: number;
  i: number;
}

export interface OfflinePodrucje {
  id: string;
  naziv: string;
  granice: Granice;
  podloga: string;
  nazivPodloge: string;
  maksZoom: number;
  plocica: number;
  bajtova: number;
  datum: number;
}

/* ---------------- Registracija service workera ---------------- */

export function registrirajSW() {
  if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      // Jednom po pokretanju osvježi spremljenu ljusku (nova verzija aplikacije).
      setTimeout(() => (reg?.active ?? navigator.serviceWorker.controller)?.postMessage("osvjezi-ljusku"), 15000);
    })
    .catch(() => {});
}

/* ---------------- Popis područja ---------------- */

let podrucja: OfflinePodrucje[] | null = null;
const slusaci = new Set<() => void>();
const PRAZNO: OfflinePodrucje[] = [];

function ucitaj(): OfflinePodrucje[] {
  if (podrucja) return podrucja;
  try {
    podrucja = JSON.parse(localStorage.getItem(KLJUC) ?? "[]");
  } catch {
    podrucja = [];
  }
  return podrucja!;
}

function spremi(p: OfflinePodrucje[]) {
  podrucja = p;
  try {
    localStorage.setItem(KLJUC, JSON.stringify(p));
  } catch {}
  slusaci.forEach((f) => f());
}

export function useOfflinePodrucja() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    ucitaj,
    () => PRAZNO,
  );
}

/* ---------------- Izračun pločica ---------------- */

function plocicaX(lng: number, z: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function plocicaY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

/** Svi URL-ovi pločica za područje – isti oblik kakav traži Leaflet (uklj. retina pomak zooma). */
export function urloviPlocica(g: Granice, slojevi: SlojZaPreuzimanje[], minZoom: number, maksZoom: number) {
  const retina = typeof window !== "undefined" && window.devicePixelRatio > 1;
  const urlovi: string[] = [];
  for (const sl of slojevi) {
    const pomak = sl.retina && retina ? 1 : 0;
    for (let z = minZoom + pomak; z <= maksZoom + pomak; z++) {
      const x0 = plocicaX(g.z, z);
      const x1 = plocicaX(g.i, z);
      const y0 = plocicaY(g.s, z);
      const y1 = plocicaY(g.j, z);
      for (let x = x0; x <= x1; x++)
        for (let y = y0; y <= y1; y++) urlovi.push(sl.url.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)));
    }
  }
  return urlovi;
}

/** Procjena veličine (satelitske pločice ~25 kB, prozirne oznake ~4 kB). */
export function procjenaMB(broj: number) {
  return Math.max(1, Math.round((broj * 16) / 1024));
}

/* ---------------- Preuzimanje ---------------- */

export interface Napredak {
  gotovo: number;
  ukupno: number;
  greske: number;
}

export async function preuzmiPodrucje(
  opis: Omit<OfflinePodrucje, "id" | "plocica" | "bajtova" | "datum">,
  slojevi: SlojZaPreuzimanje[],
  napredak: (n: Napredak) => void,
  signal: AbortSignal,
) {
  const urlovi = urloviPlocica(opis.granice, slojevi, 10, opis.maksZoom);
  if (urlovi.length > MAKS_PLOCICA) throw new Error("Područje je preveliko");
  // Zamoli preglednik da spremljeno ne briše kad ponestane prostora.
  navigator.storage?.persist?.().catch(() => {});
  const c = await caches.open(SPREMISTE);
  const n: Napredak = { gotovo: 0, ukupno: urlovi.length, greske: 0 };
  let bajtova = 0;
  let i = 0;
  const radnik = async () => {
    while (i < urlovi.length && !signal.aborted) {
      const u = urlovi[i++];
      try {
        const postoji = await c.match(u);
        if (postoji) {
          bajtova += Number(postoji.headers.get("content-length")) || 16000;
        } else {
          const r = await fetch(u, { mode: "cors", credentials: "omit", signal });
          if (!r.ok) throw new Error(String(r.status));
          const b = await r.clone().blob();
          bajtova += b.size;
          await c.put(u, r);
        }
      } catch {
        if (signal.aborted) break;
        n.greske++;
      }
      n.gotovo++;
      napredak({ ...n });
    }
  };
  await Promise.all(Array.from({ length: ISTODOBNO }, radnik));
  if (signal.aborted) throw new DOMException("Prekinuto", "AbortError");
  const novo: OfflinePodrucje = { ...opis, id: Math.random().toString(36).slice(2), plocica: urlovi.length, bajtova, datum: Date.now() };
  spremi([novo, ...ucitaj()]);
  return { podrucje: novo, greske: n.greske };
}

/** Briše područje; pločice koje dijeli s drugim spremljenim područjima ostaju. */
export async function obrisiPodrucje(id: string, slojeviZa: (podloga: string) => SlojZaPreuzimanje[]) {
  const sva = ucitaj();
  const p = sva.find((x) => x.id === id);
  if (!p) return;
  const ostala = sva.filter((x) => x.id !== id);
  const zadrzi = new Set(ostala.flatMap((o) => urloviPlocica(o.granice, slojeviZa(o.podloga), 10, o.maksZoom)));
  const c = await caches.open(SPREMISTE);
  await Promise.all(
    urloviPlocica(p.granice, slojeviZa(p.podloga), 10, p.maksZoom)
      .filter((u) => !zadrzi.has(u))
      .map((u) => c.delete(u)),
  );
  spremi(ostala);
}

export function uPodrucju(g: Granice, lat: number, lng: number) {
  return lat >= g.j && lat <= g.s && lng >= g.z && lng <= g.i;
}
