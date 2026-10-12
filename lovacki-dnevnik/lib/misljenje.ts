"use client";

import { konfigurirano, sb } from "./drustvo";

/**
 * Kratko pitanje „Kako vam se sviđa CroLovac?” nakon sat vremena korištenja.
 * Vrijeme se broji samo dok je aplikacija otvorena i vidljiva, posebno za svakog korisnika.
 * Odgovor se šalje u tablicu lov_misljenja (čita je samo administrator); bez interneta čeka u redu.
 */

export const PRAG_MS = 60 * 60_000;
const ODGODA_MS = 2 * 60 * 60_000;
const MAKS_ODBIJANJA = 2;
const RED = "lovacki-dnevnik:misljenje-red";

export interface StanjeKoristenja {
  ms: number;
  odgovoreno: boolean;
  odbijeno: number;
  sljedece: number;
}

const kljuc = (id: string) => `lovacki-dnevnik:koristenje:${id}`;

export function procitaj(id: string): StanjeKoristenja {
  const p: StanjeKoristenja = { ms: 0, odgovoreno: false, odbijeno: 0, sljedece: PRAG_MS };
  try {
    return { ...p, ...JSON.parse(localStorage.getItem(kljuc(id)) ?? "{}") };
  } catch {
    return p;
  }
}

function spremi(id: string, s: StanjeKoristenja) {
  try {
    localStorage.setItem(kljuc(id), JSON.stringify(s));
  } catch {}
}

/** Dodaje vrijeme korištenja (ograničeno, da spavanje uređaja ne napuhne brojku). */
export function dodajVrijeme(id: string, ms: number) {
  const s = procitaj(id);
  s.ms += Math.max(0, Math.min(ms, 60_000));
  spremi(id, s);
  return s;
}

export const trebaPitati = (s: StanjeKoristenja) =>
  !s.odgovoreno && s.odbijeno < MAKS_ODBIJANJA && s.ms >= Math.max(PRAG_MS, s.sljedece);

export function odgodi(id: string) {
  const s = procitaj(id);
  s.odbijeno += 1;
  s.sljedece = s.ms + ODGODA_MS;
  spremi(id, s);
}

interface Odgovor {
  ocjena: 1 | -1;
  tekst: string | null;
  verzija: string;
}

function citajRed(): Odgovor[] {
  try {
    const r = JSON.parse(localStorage.getItem(RED) ?? "[]");
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

async function posalji(o: Odgovor) {
  const { error } = await sb().from("lov_misljenja").insert(o);
  if (error) throw error;
}

/** Sprema odgovor; ako slanje ne uspije, odgovor ostaje u redu i šalje se kasnije. Nikad ne baca grešku. */
export async function posaljiMisljenje(id: string, ocjena: 1 | -1, tekst: string) {
  const s = procitaj(id);
  s.odgovoreno = true;
  spremi(id, s);
  const o: Odgovor = { ocjena, tekst: tekst.trim().slice(0, 2000) || null, verzija: (process.env.NEXT_PUBLIC_VERZIJA ?? "").slice(0, 40) };
  try {
    await posalji(o);
  } catch {
    try {
      localStorage.setItem(RED, JSON.stringify([...citajRed(), o].slice(-5)));
    } catch {}
  }
}

/** Šalje odgovore koji su čekali (npr. dani bez signala). */
export async function posaljiNaCekanju() {
  if (!konfigurirano || !navigator.onLine) return;
  const red = citajRed();
  if (!red.length) return;
  const ostalo: Odgovor[] = [];
  for (const o of red) {
    try {
      await posalji(o);
    } catch {
      ostalo.push(o);
    }
  }
  try {
    if (ostalo.length) localStorage.setItem(RED, JSON.stringify(ostalo));
    else localStorage.removeItem(RED);
  } catch {}
}
