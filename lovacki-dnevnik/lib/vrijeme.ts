"use client";

import { useEffect, useState } from "react";
import type { Vrijeme } from "./types";

export interface SatnaPrognoza {
  vrijeme: Date;
  temperatura: number;
  vjetarBrzina: number;
  vjetarSmjer: number;
  udari: number;
  oborinePosto: number;
  kod: number;
  tlak: number;
}

export interface Prognoza {
  trenutno: Vrijeme;
  satno: SatnaPrognoza[];
  dohvaceno: number;
}

const predmemorija = new Map<string, Prognoza>();

/** Prognoza spremljena pri prošlom otvaranju (štedi zahtjeve prema Open-Meteu). */
function izSpremnika(kljuc: string): Prognoza | undefined {
  try {
    const j = localStorage.getItem(`lovacki-dnevnik:prognoza:${kljuc}`);
    if (!j) return undefined;
    const p = JSON.parse(j) as Prognoza;
    p.satno = p.satno.map((s) => ({ ...s, vrijeme: new Date(s.vrijeme) }));
    predmemorija.set(kljuc, p);
    return p;
  } catch {
    return undefined;
  }
}

export async function dohvatiPrognozu(lat: number, lng: number): Promise<Prognoza> {
  const kljuc = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const p = predmemorija.get(kljuc) ?? izSpremnika(kljuc);
  if (p && Date.now() - p.dohvaceno < 15 * 60000) return p;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current:
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    hourly:
      "temperature_2m,precipitation_probability,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    // 8 dana: dovoljno za „Kad u lov?” (tjedan unaprijed).
    forecast_days: "8",
    timezone: "auto",
    wind_speed_unit: "kmh",
  }).toString();

  let res: Response;
  try {
    // Bez signala odmah spremljena prognoza; sa slabim signalom ne čeka se dulje od 8 s.
    if (!navigator.onLine) throw new Error();
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error();
  } catch {
    // Bez signala: zadnja spremljena prognoza je bolja od nikakve.
    if (p && Date.now() - p.dohvaceno < 3 * 86400000) return p;
    throw new Error("Prognoza nije dostupna");
  }
  const j = await res.json();
  const c = j.current;
  const h = j.hourly;
  const satno: SatnaPrognoza[] = (h.time as string[]).map((t, i) => ({
    vrijeme: new Date(t),
    temperatura: h.temperature_2m[i],
    vjetarBrzina: h.wind_speed_10m[i],
    vjetarSmjer: h.wind_direction_10m[i],
    udari: h.wind_gusts_10m?.[i] ?? h.wind_speed_10m[i],
    oborinePosto: h.precipitation_probability[i] ?? 0,
    kod: h.weather_code[i],
    tlak: h.surface_pressure[i],
  }));
  const rez: Prognoza = {
    trenutno: {
      temperatura: c.temperature_2m,
      vlaga: c.relative_humidity_2m,
      oborine: c.precipitation,
      kod: c.weather_code,
      oblacnost: c.cloud_cover,
      tlak: c.surface_pressure,
      vjetarBrzina: c.wind_speed_10m,
      vjetarSmjer: c.wind_direction_10m,
      udari: c.wind_gusts_10m,
    },
    satno,
    dohvaceno: Date.now(),
  };
  predmemorija.set(kljuc, rez);
  try {
    localStorage.setItem(`lovacki-dnevnik:prognoza:${kljuc}`, JSON.stringify(rez));
  } catch {}
  return rez;
}

export function usePrognoza(lat?: number, lng?: number) {
  const [stanje, setStanje] = useState<{
    podaci: Prognoza | null;
    greska: string | null;
    kljuc: string | null;
  }>({ podaci: null, greska: null, kljuc: null });

  const kljuc = lat != null && lng != null ? `${lat.toFixed(2)},${lng.toFixed(2)}` : null;

  useEffect(() => {
    if (lat == null || lng == null) return;
    let ziv = true;
    dohvatiPrognozu(lat, lng)
      .then((p) => ziv && setStanje({ podaci: p, greska: null, kljuc: `${lat.toFixed(2)},${lng.toFixed(2)}` }))
      .catch((e: Error) => ziv && setStanje({ podaci: null, greska: e.message, kljuc: `${lat.toFixed(2)},${lng.toFixed(2)}` }));
    return () => {
      ziv = false;
    };
  }, [lat, lng]);

  const svjez = stanje.kljuc === kljuc;
  return {
    podaci: svjez ? stanje.podaci : null,
    greska: svjez ? stanje.greska : null,
    ucitava: kljuc != null && !svjez,
  };
}

const SMJEROVI = ["S", "SSI", "SI", "ISI", "I", "IJI", "JI", "JJI", "J", "JJZ", "JZ", "ZJZ", "Z", "ZSZ", "SZ", "SSZ"];

/** Strana svijeta odakle puše vjetar (S = sjever, I = istok, J = jug, Z = zapad). */
export function smjerVjetra(stupnjevi?: number) {
  if (stupnjevi == null) return "–";
  return SMJEROVI[Math.round(((stupnjevi % 360) / 22.5)) % 16];
}

export function opisVremena(kod?: number) {
  if (kod == null) return "–";
  if (kod === 0) return "Vedro";
  if (kod <= 2) return "Djelomično oblačno";
  if (kod === 3) return "Oblačno";
  if (kod <= 48) return "Magla";
  if (kod <= 57) return "Rosulja";
  if (kod <= 67) return "Kiša";
  if (kod <= 77) return "Snijeg";
  if (kod <= 82) return "Pljuskovi";
  if (kod <= 86) return "Snježni pljuskovi";
  return "Grmljavina";
}

/** Procjena trenda tlaka u sljedeća 3 sata (za ponašanje divljači). */
export function trendTlaka(p: Prognoza) {
  const sad = Date.now();
  const i = p.satno.findIndex((s) => s.vrijeme.getTime() > sad);
  if (i < 1 || i + 3 >= p.satno.length) return { razlika: 0, opis: "stabilan" };
  const razlika = p.satno[i + 2].tlak - p.satno[i - 1].tlak;
  return {
    razlika,
    opis: razlika > 0.8 ? "raste" : razlika < -0.8 ? "pada" : "stabilan",
  };
}

/** Beaufortova ljestvica (km/h) s hrvatskim nazivima. */
const BEAUFORT: [number, string][] = [
  [1, "Tišina"],
  [6, "Lahor"],
  [12, "Povjetarac"],
  [20, "Slab vjetar"],
  [29, "Umjeren vjetar"],
  [39, "Umjereno jak vjetar"],
  [50, "Jak vjetar"],
  [62, "Žestok vjetar"],
  [75, "Olujni vjetar"],
  [Infinity, "Jak olujni vjetar"],
];

export function beaufort(kmh: number) {
  const i = BEAUFORT.findIndex(([g]) => kmh < g);
  return { stupanj: i, naziv: BEAUFORT[i][1] };
}

/** Kako jačina vjetra utječe na lov s čeke. */
export function vjetarZaLov(kmh: number) {
  if (kmh < 4) return { ocjena: "nestalan", opis: "Preslab vjetar – miris se diže i kovitla u svim smjerovima." };
  if (kmh <= 20) return { ocjena: "dobar", opis: "Stalan vjetar – dobro nosi miris u jednom smjeru." };
  if (kmh <= 35) return { ocjena: "jak", opis: "Jači vjetar – divljač je opreznija, ali buka prikriva kretanje." };
  return { ocjena: "nepovoljan", opis: "Jak vjetar – divljač se zavlači u zaklon, slab izgled za lov." };
}

/** Razlika dvaju smjerova u stupnjevima (0–180). */
export function razlikaSmjera(a: number, b: number) {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/** Prva promjena smjera veća od 45° u sljedećih `sati` sati, ako postoji. */
export function promjenaSmjera(satno: SatnaPrognoza[], sati = 8) {
  if (!satno.length) return null;
  const pocetni = satno[0].vjetarSmjer;
  for (const s of satno.slice(1, sati + 1)) {
    if (s.vjetarBrzina >= 3 && razlikaSmjera(s.vjetarSmjer, pocetni) > 45) return s;
  }
  return null;
}
