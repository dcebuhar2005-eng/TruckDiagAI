"use client";

import { sb } from "./drustvo";
import { uAplikaciji } from "./nativno";

/**
 * Prijava za zatvoreno testiranje Android aplikacije na Google Playu.
 * Poziv vide samo korisnici na Androidu koji CroLovac još koriste u pregledniku ili s ikone.
 * Gmail adresa i broj mobitela (za WhatsApp grupu testera) idu u tablicu lov_testeri
 * (čita ih samo administrator). Tko se prijavio bez broja, dobije kratku obavijest da ga doda.
 */

const ODGODA_MS = 3 * 24 * 60 * 60_000;
const kljuc = (id: string) => `lovacki-dnevnik:tester:${id}`;

interface Stanje {
  prijavljen?: boolean;
  imaMobitel?: boolean;
  odbijeno?: boolean;
  sljedece?: number;
  /** Odgoda obavijesti „dodajte broj mobitela”. */
  mobitelSljedece?: number;
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

/** Hrvatski broj (09x…) ili međunarodni (+…); vraća broj bez razmaka ili null ako nije ispravan. */
export function ocistiMobitel(unos: string) {
  let m = unos.replace(/[\s/().-]/g, "");
  if (m.startsWith("00")) m = "+" + m.slice(2);
  if (/^0[1-9]\d{6,9}$/.test(m)) m = "+385" + m.slice(1);
  return /^\+[1-9]\d{7,14}$/.test(m) ? m : null;
}

/** Što ponuditi: poziv (još nije tester, samo Android), dopunu broja (tester bez broja) ili ništa. */
export function stoPonuditi(id: string): "poziv" | "mobitel" | null {
  const s = procitaj(id);
  const sada = Date.now();
  if (s.prijavljen) return s.imaMobitel || sada < (s.mobitelSljedece ?? 0) ? null : "mobitel";
  if (!naAndroidu() || s.odbijeno || sada < (s.sljedece ?? 0)) return null;
  return "poziv";
}

/** Stanje prijave na poslužitelju (npr. prijava s drugog uređaja ili prije uvođenja broja mobitela). */
export async function stanjePrijave(id: string) {
  const { data, error } = await sb().from("lov_testeri").select("mobitel").eq("korisnik", id).maybeSingle();
  if (error) throw error;
  const st = { prijavljen: Boolean(data), imaMobitel: Boolean(data?.mobitel) };
  spremi(id, st);
  return st;
}

const uredaj = () => navigator.userAgent.match(/Android[^;)]*/)?.[0]?.slice(0, 60) ?? "Android";

export async function prijaviTestera(id: string, gmail: string, mobitel: string) {
  const g = gmail.trim().toLowerCase();
  if (!GMAIL.test(g)) throw new Error("Upišite Gmail adresu (…@gmail.com) – Google Play testiranje radi samo s Google računom.");
  const m = ocistiMobitel(mobitel);
  if (!m) throw new Error("Upišite broj mobitela, npr. 091 234 5678.");
  const { error } = await sb().from("lov_testeri").upsert({ korisnik: id, gmail: g, mobitel: m, uredaj: uredaj() });
  if (error) throw new Error("Prijava nije uspjela. Provjerite internet i pokušajte ponovno.");
  spremi(id, { prijavljen: true, imaMobitel: true });
}

export async function dodajMobitel(id: string, mobitel: string) {
  const m = ocistiMobitel(mobitel);
  if (!m) throw new Error("Upišite broj mobitela, npr. 091 234 5678.");
  const { error } = await sb().from("lov_testeri").update({ mobitel: m }).eq("korisnik", id);
  if (error) throw new Error("Spremanje nije uspjelo. Provjerite internet i pokušajte ponovno.");
  spremi(id, { imaMobitel: true });
}

export const odgodiMobitel = (id: string) => spremi(id, { mobitelSljedece: Date.now() + 24 * 60 * 60_000 });

export const odgodiPoziv = (id: string) => spremi(id, { sljedece: Date.now() + ODGODA_MS });
export const odbijPoziv = (id: string) => spremi(id, { odbijeno: true });
