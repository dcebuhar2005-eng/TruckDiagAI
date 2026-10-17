"use client";

import { useSyncExternalStore } from "react";
import type { Baza, Kolekcija, Postavke } from "./types";

/** Stari (zajednički) ključ – podaci se pri prvoj prijavi prenose vlasniku uređaja. */
const STARI_KLJUC = "lovacki-dnevnik:v1";
/** Zadnji prijavljeni korisnik (za temu prije učitavanja); sam dnevnik je pod ključem korisnika. */
export const KLJUC_TEME = "lovacki-dnevnik:tema";

/**
 * Dnevnik pripada prijavljenom korisniku: svaki korisnik ima vlastiti ključ, a bez prijave
 * (kad je poslužitelj postavljen) nema dnevnika. Bez Supabasea sve radi lokalno kao prije.
 */
let vlasnik: string | null = null;
let kljuc: string | null = null;

export function kljucZa(id: string) {
  return `${STARI_KLJUC}:${id}`;
}

/** Postavlja prijavljenog korisnika; `null` = nitko nije prijavljen. */
export function postaviVlasnika(id: string | null) {
  if (id === vlasnik && kljuc) return;
  vlasnik = id;
  kljuc = id == null ? null : id === "lokalno" ? STARI_KLJUC : kljucZa(id);
  if (id && id !== "lokalno") {
    try {
      // Postojeći podaci s uređaja (prije uvođenja računa) pripadaju prvom korisniku koji se prijavi.
      const staro = localStorage.getItem(STARI_KLJUC);
      if (staro && !localStorage.getItem(kljuc!)) localStorage.setItem(kljuc!, staro);
      if (staro) localStorage.removeItem(STARI_KLJUC);
    } catch {}
  }
  stanje = null;
  slusaci.forEach((f) => f());
}

export const trenutniVlasnik = () => vlasnik;

/** Javlja svaku lokalnu izmjenu dnevnika (za sinkronizaciju s oblakom). */
const promjene = new Set<(b: Baza) => void>();
export function naPromjenu(f: (b: Baza) => void) {
  promjene.add(f);
  return () => promjene.delete(f);
}

export const ZADANE_POSTAVKE: Postavke = {
  ime: "",
  lokacija: { lat: 45.815, lng: 15.982 },
  lokacijaNaziv: "Zagreb",
  tema: "tamna",
  dovrsenUvod: false,
};

export function praznaBaza(): Baza {
  return {
    verzija: 1,
    lovista: [],
    tocke: [],
    izlasci: [],
    odstrel: [],
    dozvole: [],
    oruzje: [],
    postavke: { ...ZADANE_POSTAVKE },
  };
}

let stanje: Baza | null = null;
const slusaci = new Set<() => void>();

function ucitaj(): Baza {
  if (stanje) return stanje;
  if (!kljuc) return (stanje = praznaBaza());
  try {
    const sirovo = localStorage.getItem(kljuc);
    if (sirovo) {
      const p = JSON.parse(sirovo) as Partial<Baza>;
      stanje = {
        ...praznaBaza(),
        ...p,
        postavke: { ...ZADANE_POSTAVKE, ...(p.postavke ?? {}) },
      } as Baza;
      return stanje;
    }
  } catch {
    // Oštećeni podaci – počinjemo ispočetka.
  }
  stanje = praznaBaza();
  return stanje;
}

function spremi(nova: Baza, izOblaka = false) {
  if (!kljuc) return;
  stanje = nova;
  try {
    localStorage.setItem(kljuc, JSON.stringify(nova));
    localStorage.setItem(KLJUC_TEME, nova.postavke.tema);
  } catch (e) {
    console.error("Spremanje nije uspjelo", e);
  }
  slusaci.forEach((f) => f());
  if (!izOblaka) promjene.forEach((f) => f(nova));
}

function pretplati(f: () => void) {
  slusaci.add(f);
  const naStorage = (e: StorageEvent) => {
    if (kljuc && e.key === kljuc) {
      stanje = null;
      f();
    }
  };
  window.addEventListener("storage", naStorage);
  return () => {
    slusaci.delete(f);
    window.removeEventListener("storage", naStorage);
  };
}

/** Vraća `null` na poslužitelju, tijekom prve hidracije i dok nitko nije prijavljen. */
export function useBaza(): Baza | null {
  return useSyncExternalStore(pretplati, () => (kljuc ? ucitaj() : null), () => null);
}

export function noviId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

type Element<K extends Kolekcija> = Baza[K][number];

export const db = {
  dohvati: () => ucitaj(),

  dodaj<K extends Kolekcija>(
    kol: K,
    podaci: Omit<Element<K>, "id" | "createdAt"> & { id?: string },
  ): Element<K> {
    const b = ucitaj();
    const el = {
      ...podaci,
      id: podaci.id ?? noviId(),
      createdAt: Date.now(),
    } as Element<K>;
    spremi({ ...b, [kol]: [el, ...(b[kol] as Element<K>[])] });
    return el;
  },

  uredi<K extends Kolekcija>(kol: K, id: string, izmjene: Partial<Element<K>>) {
    const b = ucitaj();
    spremi({
      ...b,
      [kol]: (b[kol] as Element<K>[]).map((x) =>
        x.id === id ? { ...x, ...izmjene } : x,
      ),
    });
  },

  obrisi<K extends Kolekcija>(kol: K, id: string) {
    const b = ucitaj();
    spremi({
      ...b,
      [kol]: (b[kol] as Element<K>[]).filter((x) => x.id !== id),
    });
  },

  vrati<K extends Kolekcija>(kol: K, el: Element<K>) {
    const b = ucitaj();
    spremi({ ...b, [kol]: [el, ...(b[kol] as Element<K>[])] });
  },

  postavke(izmjene: Partial<Postavke>) {
    const b = ucitaj();
    spremi({ ...b, postavke: { ...b.postavke, ...izmjene } });
  },

  zamijeni(nova: Baza, izOblaka = false) {
    spremi(
      {
        ...praznaBaza(),
        ...nova,
        postavke: { ...ZADANE_POSTAVKE, ...nova.postavke },
      },
      izOblaka,
    );
  },

  /** Postoji li već dnevnik ovog korisnika na uređaju. */
  imaLokalno: () => {
    try {
      return Boolean(kljuc && localStorage.getItem(kljuc));
    } catch {
      return false;
    }
  },
};

/** Uvod (dobrodošlica, ime, lokacija) prikazuje se samo prvi put na uređaju. */
const KLJUC_UVODA = "lovacki-dnevnik:uvod-gotov";
export function uvodGotov() {
  try {
    return localStorage.getItem(KLJUC_UVODA) === "1";
  } catch {
    return false;
  }
}
export function oznaciUvodGotov() {
  try {
    localStorage.setItem(KLJUC_UVODA, "1");
  } catch {}
}
