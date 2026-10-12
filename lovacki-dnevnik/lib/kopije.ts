"use client";

// Automatska mjesečna sigurnosna kopija dnevnika u privatni Supabase Storage korisnika.
// Kopije starije od 30 dana brišu se nakon svake uspješne nove kopije.

import { useSyncExternalStore } from "react";
import { sb } from "./drustvo";
import { spremiFoto, sveFotografije } from "./foto";
import { spoji } from "./sinkronizacija";
import { db } from "./store";
import type { Baza } from "./types";

const SPREMNIK = "lov-kopije";
const DAN = 86400000;
/** Nova automatska kopija svaki dan (fotografije su zasebno u oblaku). */
export const RAZMAK_DANA = 1;
/** Kopije starije od ovoga brišu se (najnovije tri ostaju uvijek). */
export const CUVANJE_DANA = 30;

export interface Kopija {
  naziv: string;
  datum: number;
  velicina: number;
}

interface Stanje {
  kopije: Kopija[];
  ucitano: boolean;
  radim: boolean;
  greska: string | null;
}

let stanje: Stanje = { kopije: [], ucitano: false, radim: false, greska: null };
const slusaci = new Set<() => void>();
const postavi = (i: Partial<Stanje>) => {
  stanje = { ...stanje, ...i };
  slusaci.forEach((f) => f());
};

const POCETNO = stanje;
export function useKopije() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => stanje,
    () => POCETNO,
  );
}

async function korisnik() {
  const { data } = await sb().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function ucitajPopis(): Promise<Kopija[]> {
  const id = await korisnik();
  if (!id) return [];
  const { data, error } = await sb().storage.from(SPREMNIK).list(id, { sortBy: { column: "created_at", order: "desc" }, limit: 100 });
  if (error) throw error;
  const kopije = (data ?? [])
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({
      naziv: `${id}/${f.name}`,
      datum: Date.parse(f.created_at ?? "") || 0,
      velicina: (f.metadata as { size?: number } | null)?.size ?? 0,
    }))
    .sort((a, b) => b.datum - a.datum);
  postavi({ kopije, ucitano: true });
  return kopije;
}

export async function napraviKopiju(sFotografijama = true) {
  const id = await korisnik();
  if (!id) throw new Error("Prijavite se za sigurnosnu kopiju");
  postavi({ radim: true, greska: null });
  try {
    let fotografije: Record<string, string> = {};
    try {
      if (sFotografijama) fotografije = await sveFotografije();
    } catch {
      // Bez fotografija ako IndexedDB nije dostupan.
    }
    const sadrzaj = JSON.stringify({ ...db.dohvati(), fotografije, napravljeno: new Date().toISOString() });
    const naziv = `${id}/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const { error } = await sb()
      .storage.from(SPREMNIK)
      .upload(naziv, new Blob([sadrzaj], { type: "application/json" }), { contentType: "application/json", upsert: false });
    if (error) throw new Error(error.message.includes("exceeded") ? "Kopija je prevelika (više od 50 MB)" : error.message);

    // Brisanje kopija starijih od mjesec dana (nova kopija uvijek ostaje).
    const sve = await ucitajPopis();
    const stare = sve
      .slice(3)
      .filter((k) => k.naziv !== naziv && Date.now() - k.datum > CUVANJE_DANA * DAN)
      .map((k) => k.naziv);
    if (stare.length) {
      await sb().storage.from(SPREMNIK).remove(stare);
      await ucitajPopis();
    }
  } catch (e) {
    postavi({ greska: (e as Error).message });
    throw e;
  } finally {
    postavi({ radim: false });
  }
}

/** Pokreće se pri otvaranju aplikacije: ako nema kopije mlađe od 30 dana, napravi novu. */
let provjereno = false;
export async function automatskaKopija() {
  if (provjereno) return;
  provjereno = true;
  try {
    const kopije = await ucitajPopis();
    const zadnja = kopije[0]?.datum ?? 0;
    const b = db.dohvati();
    const imaPodataka = b.izlasci.length + b.odstrel.length + b.lovista.length + b.dozvole.length + b.tocke.length > 0;
    if (imaPodataka && !b.postavke.primjer && Date.now() - zadnja >= RAZMAK_DANA * DAN) await napraviKopiju(false);
  } catch {
    provjereno = false; // pokušaj ponovno pri sljedećem otvaranju
  }
}

export async function vratiKopiju(naziv: string) {
  const { data, error } = await sb().storage.from(SPREMNIK).download(naziv);
  if (error || !data) throw new Error("Kopija se ne može preuzeti");
  const j = JSON.parse(await data.text()) as Baza & { fotografije?: Record<string, string> };
  if (!Array.isArray(j.izlasci) || !Array.isArray(j.odstrel)) throw new Error("Kopija nije valjana");
  const { fotografije, ...podaci } = j;
  for (const [fid, url] of Object.entries(fotografije ?? {})) await spremiFoto(fid, url);
  // Spajanje, ne zamjena: unosi dodani nakon kopije ostaju sačuvani.
  const kopija = { ...podaci, postavke: { ...podaci.postavke, dovrsenUvod: true } } as Baza;
  db.zamijeni(spoji(db.dohvati(), kopija));
  return { izlasci: j.izlasci.length, odstrel: j.odstrel.length };
}
