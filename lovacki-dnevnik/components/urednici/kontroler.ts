"use client";

import { flushSync } from "react-dom";
import { useSyncExternalStore } from "react";
import { db } from "@/lib/store";
import type { Izlazak, Odstrel, Tocka } from "@/lib/types";

export type Zahtjev =
  | { tip: "izlazak"; id?: string; pocetno?: Partial<Izlazak> }
  | { tip: "odstrel"; id?: string; pocetno?: Partial<Odstrel> }
  | { tip: "loviste"; id?: string }
  | { tip: "dozvola"; id?: string }
  | { tip: "tocka"; id?: string; pocetno?: Partial<Tocka> }
  | { tip: "detalj-izlazak"; id: string }
  | { tip: "detalj-odstrel"; id: string }
  | { tip: "dolazak"; tockaId?: string }
  | { tip: "stradanje"; id?: string };

let trenutni: (Zahtjev & { kljuc: number; prijelaz?: boolean }) | null = null;
const slusaci = new Set<() => void>();

/** Javlja se kad netko pokuša novi izlazak dok lov traje (Urednici tada vode na lov u tijeku). */
export const LOV_U_TIJEKU = "lovacki-dnevnik:lov-u-tijeku";

export function otvori(z: Zahtjev) {
  // Dok lov traje nema novog izlaska – inače nastane drugi, odmah završen izlazak.
  if (z.tip === "izlazak" && !z.id && db.dohvati().izlasci.some((i) => i.uTijeku)) {
    window.dispatchEvent(new Event(LOV_U_TIJEKU));
    return;
  }
  trenutni = { ...z, kljuc: Date.now() };
  slusaci.forEach((f) => f());
}

/**
 * Otvori detalj tako da se dodirnuta kartica „rastvori” u ploču (View Transitions).
 * Bez podrške preglednika, sa „smanji pokrete”, na slabijim mobitelima ili na računalu – obično otvaranje.
 */
export function otvoriIz(el: HTMLElement | null, z: Zahtjev) {
  const d = document as Document & { startViewTransition?: (f: () => void) => { finished?: Promise<void> } };
  const lagano = !!document.documentElement.dataset.lagano || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!el || !d.startViewTransition || lagano || matchMedia("(min-width: 768px)").matches) return otvori(z);
  el.style.viewTransitionName = "ploca-detalj";
  document.documentElement.dataset.vtPloca = "1";
  const t = d.startViewTransition(() => {
    el.style.viewTransitionName = "";
    flushSync(() => {
      trenutni = { ...z, kljuc: Date.now(), prijelaz: true };
      slusaci.forEach((f) => f());
    });
  });
  t.finished?.finally(() => delete document.documentElement.dataset.vtPloca);
}

/* Obrazac izlaska nakon „Završi lov” – pamti se i preko ponovnog učitavanja stranice (bez signala). */
const KLJUC_NAJAVE = "lovacki-dnevnik:otvori-izlazak";

export function najaviOtvaranjeIzlaska(id: string) {
  try {
    sessionStorage.setItem(KLJUC_NAJAVE, id);
  } catch {}
}

export function otvoriNajavljeniIzlazak() {
  try {
    const id = sessionStorage.getItem(KLJUC_NAJAVE);
    if (!id) return;
    sessionStorage.removeItem(KLJUC_NAJAVE);
    otvori({ tip: "izlazak", id });
  } catch {}
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
