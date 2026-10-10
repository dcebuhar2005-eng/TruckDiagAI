"use client";

import { useSyncExternalStore } from "react";
import type { Baza, Kolekcija, Postavke } from "./types";

const KLJUC = "lovacki-dnevnik:v1";

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
    postavke: { ...ZADANE_POSTAVKE },
  };
}

let stanje: Baza | null = null;
const slusaci = new Set<() => void>();

function ucitaj(): Baza {
  if (stanje) return stanje;
  try {
    const sirovo = localStorage.getItem(KLJUC);
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

function spremi(nova: Baza) {
  stanje = nova;
  try {
    localStorage.setItem(KLJUC, JSON.stringify(nova));
  } catch (e) {
    console.error("Spremanje nije uspjelo", e);
  }
  slusaci.forEach((f) => f());
}

function pretplati(f: () => void) {
  slusaci.add(f);
  const naStorage = (e: StorageEvent) => {
    if (e.key === KLJUC) {
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

/** Vraća `null` tijekom renderiranja na poslužitelju i prve hidracije. */
export function useBaza(): Baza | null {
  return useSyncExternalStore(pretplati, ucitaj, () => null);
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

  zamijeni(nova: Baza) {
    spremi({
      ...praznaBaza(),
      ...nova,
      postavke: { ...ZADANE_POSTAVKE, ...nova.postavke },
    });
  },
};
