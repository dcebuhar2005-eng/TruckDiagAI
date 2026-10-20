"use client";

// „Kreni u lov”: izlazak u tijeku. Dok traje, aplikacija bilježi GPS trag, a korisnik uživo
// dodaje opažanja, odstrel, fotografije i bilješke. Na kraju se izlazak dopuni i zatvori.

import { useSyncExternalStore } from "react";
import { isoDatum, isoVrijeme, udaljenostM } from "./format";
import { spremiFoto } from "./foto";
import { pratiLokaciju } from "./nativno";
import { db, noviId } from "./store";
import type { Baza, Izlazak, Spol, Trag, VrstaLova } from "./types";
import { dohvatiPrognozu } from "./vrijeme";

export const aktivniLov = (b: Baza | null) => b?.izlasci.find((i) => i.uTijeku);

/* ---------------- Pozicija i trag ---------------- */

export interface Pozicija {
  lat: number;
  lng: number;
  tocnost: number;
  t: number;
}

let pozicija: Pozicija | null = null;
const slusaci = new Set<() => void>();
const javi = () => slusaci.forEach((f) => f());

export function useLovPozicija() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => pozicija,
    () => null,
  );
}

let zaustaviPracenje: (() => void) | null = null;
let izlazakId: string | null = null;
let novi: [number, number][] = [];
let zadnjeSpremanje = 0;

function spremiTrag() {
  if (!izlazakId || !novi.length) return;
  const i = db.dohvati().izlasci.find((x) => x.id === izlazakId);
  if (!i) return;
  db.uredi("izlasci", izlazakId, { trag: [...(i.trag ?? []), ...novi] });
  novi = [];
  zadnjeSpremanje = Date.now();
}

function zadnjaTockaTraga(): [number, number] | undefined {
  if (novi.length) return novi[novi.length - 1];
  const i = db.dohvati().izlasci.find((x) => x.id === izlazakId);
  return i?.trag?.[i.trag.length - 1];
}

/** Pokreće ili zaustavlja praćenje prema tome je li neki lov u tijeku (poziva ljuska aplikacije). */
export function uskladiPracenje(id: string | null) {
  if (id === izlazakId) return;
  spremiTrag();
  zaustaviPracenje?.();
  zaustaviPracenje = null;
  izlazakId = id;
  if (!id) return;
  zaustaviPracenje = pratiLokaciju(
    (p) => {
      pozicija = { lat: p.lat, lng: p.lng, tocnost: p.tocnost, t: p.vrijeme ?? Date.now() };
      javi();
      // Trag: samo svježe i dovoljno točne pozicije, najmanje 20 m od prethodne
      // (zadnja poznata lokacija s početka može biti stara pa se samo prikazuje).
      if (p.tocnost > 60 || Date.now() - (p.vrijeme ?? Date.now()) > 2 * 60_000) return;
      const z = zadnjaTockaTraga();
      if (!z || udaljenostM({ lat: z[0], lng: z[1] }, pozicija) >= 20) {
        novi.push([Number(pozicija.lat.toFixed(6)), Number(pozicija.lng.toFixed(6))]);
        if (novi.length >= 10 || Date.now() - zadnjeSpremanje > 60000) spremiTrag();
      }
    },
    undefined,
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
  );
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && spremiTrag());
}

/** Duljina traga u metrima. */
export function duljinaTraga(trag?: [number, number][]) {
  if (!trag || trag.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < trag.length; i++) m += udaljenostM({ lat: trag[i - 1][0], lng: trag[i - 1][1] }, { lat: trag[i][0], lng: trag[i][1] });
  return m;
}

/* ---------------- Radnje ---------------- */

export function kreniULov(p: { lovisteId?: string; tockaId?: string; nacin: VrstaLova; lat?: number; lng?: number }) {
  const sad = new Date();
  const postoji = aktivniLov(db.dohvati());
  if (postoji) return postoji.id;
  const id = noviId();
  db.dodaj("izlasci", {
    id,
    datum: isoDatum(sad),
    od: isoVrijeme(sad),
    lovisteId: p.lovisteId,
    tockaId: p.tockaId,
    lat: p.tockaId ? undefined : p.lat,
    lng: p.tockaId ? undefined : p.lng,
    nacin: p.nacin,
    opazanja: [],
    uTijeku: true,
    trag: p.lat != null && p.lng != null ? [[p.lat, p.lng]] : [],
  });
  // Vrijeme na početku lova (ako ima interneta).
  const b = db.dohvati();
  const t = b.tocke.find((x) => x.id === p.tockaId);
  const loc = t ?? (p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : b.postavke.lokacija);
  dohvatiPrognozu(loc.lat, loc.lng)
    .then((pr) => db.uredi("izlasci", id, { vrijeme: pr.trenutno }))
    .catch(() => {});
  return id;
}

const sada = () => isoVrijeme(new Date());

export async function dodajOpazanje(id: string, o: { vrsta: string; broj: number; spol?: Spol }, slika?: string) {
  let fotoId: string | undefined;
  if (slika) {
    fotoId = noviId();
    await spremiFoto(fotoId, slika);
  }
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (!i) return;
  db.uredi("izlasci", id, {
    opazanja: [...i.opazanja, { ...o, vrijeme: sada(), lat: pozicija?.lat, lng: pozicija?.lng, fotoId }],
    // Slika opažanja je i među fotografijama izlaska.
    ...(fotoId ? { fotoIds: [...(i.fotoIds ?? []), fotoId] } : {}),
  });
}

export async function dodajTrag(id: string, t: Pick<Trag, "divljac" | "znak" | "svjez" | "spol">, slika?: string) {
  let fotoId: string | undefined;
  if (slika) {
    fotoId = noviId();
    await spremiFoto(fotoId, slika);
  }
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (!i) return;
  db.uredi("izlasci", id, {
    tragovi: [...(i.tragovi ?? []), { ...t, vrijeme: sada(), lat: pozicija?.lat, lng: pozicija?.lng, fotoId }],
    ...(fotoId ? { fotoIds: [...(i.fotoIds ?? []), fotoId] } : {}),
  });
}

export function ukloniTrag(id: string, indeks: number) {
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (i) db.uredi("izlasci", id, { tragovi: (i.tragovi ?? []).filter((_, k) => k !== indeks) });
}

/** Isto opažanje još jednom (ili jedno manje) – izravno iz tijeka lova. */
export function promijeniBrojOpazanja(id: string, indeks: number, za: number) {
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (!i) return;
  db.uredi("izlasci", id, { opazanja: i.opazanja.map((o, k) => (k === indeks ? { ...o, broj: Math.max(1, o.broj + za) } : o)) });
}

export function ukloniOpazanje(id: string, indeks: number) {
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (i) db.uredi("izlasci", id, { opazanja: i.opazanja.filter((_, k) => k !== indeks) });
}

/** Bilješka s vremenom dodaje se u napomenu izlaska („06:42 – tekst”). */
export function dodajBiljesku(id: string, tekst: string) {
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (!i || !tekst.trim()) return;
  const red = `${sada()} – ${tekst.trim()}`;
  db.uredi("izlasci", id, { napomena: i.napomena ? `${i.napomena}\n${red}` : red });
}

export const BILJESKA = /^(\d{2}:\d{2}) – (.*)$/;
export function biljeske(i: Izlazak) {
  return (i.napomena ?? "")
    .split("\n")
    .map((r) => r.match(BILJESKA))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ vrijeme: m[1], tekst: m[2] }));
}

export async function dodajFotografiju(id: string, dataUrl: string) {
  const fid = noviId();
  await spremiFoto(fid, dataUrl);
  const i = db.dohvati().izlasci.find((x) => x.id === id);
  if (i) db.uredi("izlasci", id, { fotoIds: [...(i.fotoIds ?? []), fid] });
}

export function zavrsiLov(id: string) {
  spremiTrag();
  db.uredi("izlasci", id, { uTijeku: undefined, do: sada() });
  // Praćenje se gasi odmah, a ne tek kad ljuska primijeti promjenu.
  if (izlazakId === id) uskladiPracenje(null);
}

export function trenutnaPozicija() {
  return pozicija;
}
