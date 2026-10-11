"use client";

import { useSyncExternalStore } from "react";
import type { Izlazak, Odstrel, Tocka } from "@/lib/types";

export type Zahtjev =
  | { tip: "izlazak"; id?: string; pocetno?: Partial<Izlazak> }
  | { tip: "odstrel"; id?: string; pocetno?: Partial<Odstrel> }
  | { tip: "loviste"; id?: string }
  | { tip: "dozvola"; id?: string }
  | { tip: "tocka"; id?: string; pocetno?: Partial<Tocka> }
  | { tip: "detalj-izlazak"; id: string }
  | { tip: "detalj-odstrel"; id: string };

let trenutni: (Zahtjev & { kljuc: number }) | null = null;
const slusaci = new Set<() => void>();

export function otvori(z: Zahtjev) {
  trenutni = { ...z, kljuc: Date.now() };
  slusaci.forEach((f) => f());
}

export function zatvori() {
  trenutni = null;
  slusaci.forEach((f) => f());
}

export function useZahtjev() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => trenutni,
    () => null,
  );
}
