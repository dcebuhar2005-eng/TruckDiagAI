"use client";

import { sb } from "./drustvo";
import { uAplikaciji } from "./nativno";

/**
 * Prijava za zatvoreno testiranje Android aplikacije na Google Playu.
 * Poziv vide samo korisnici na Androidu koji CroLovac još koriste u pregledniku ili s ikone.
 * Gmail adresa ide u tablicu lov_testeri (čita je samo administrator).
 */

const ODGODA_MS = 3 * 24 * 60 * 60_000;
const kljuc = (id: string) => `lovacki-dnevnik:tester:${id}`;

interface Stanje {
  prijavljen?: boolean;
  odbijeno?: boolean;
  sljedece?: number;
}

function procitaj(id: string): Stanje {
  try {
    return JSON.parse(localStorage.getItem(kljuc(id)) ?? "{}");
  } catch {
    return {};
  }
}

function spremi(id: string, s: Stanje) {
  try {
    localStorage.setItem(kljuc(id), JSON.stringify({ ...procitaj(id), ...s }));
  } catch {}
}

export const naAndroidu = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent) && !uAplikaciji();

export const GMAIL = /^[^@\s]+@(gmail|googlemail)\.com$/i;

/** Treba li ponuditi poziv (lokalna provjera; poslužitelj se pita tek ako je ovo da). */
export function trebaPozvati(id: string) {
  if (!naAndroidu()) return false;
  const s = procitaj(id);
  return !s.prijavljen && !s.odbijeno && Date.now() >= (s.sljedece ?? 0);
}

/** Je li se korisnik već prijavio (npr. s drugog uređaja). */
export async function vecPrijavljen(id: string) {
  const { data, error } = await sb().from("lov_testeri").select("korisnik").eq("korisnik", id).maybeSingle();
  if (error) throw error;
  if (data) spremi(id, { prijavljen: true });
  return Boolean(data);
}

export async function prijaviTestera(id: string, gmail: string) {
  const g = gmail.trim().toLowerCase();
  if (!GMAIL.test(g)) throw new Error("Upišite Gmail adresu (…@gmail.com) – Google Play testiranje radi samo s Google računom.");
  const { error } = await sb()
    .from("lov_testeri")
    .upsert({ korisnik: id, gmail: g, uredaj: navigator.userAgent.match(/Android[^;)]*/)?.[0]?.slice(0, 60) ?? "Android" });
  if (error) throw new Error("Prijava nije uspjela. Provjerite internet i pokušajte ponovno.");
  spremi(id, { prijavljen: true });
}

export const odgodiPoziv = (id: string) => spremi(id, { sljedece: Date.now() + ODGODA_MS });
export const odbijPoziv = (id: string) => spremi(id, { odbijeno: true });
