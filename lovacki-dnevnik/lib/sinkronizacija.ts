"use client";

// Dnevnik prijavljenog korisnika čuva se i u njegovom privatnom retku u Supabaseu
// (tablica lov_dnevnici, RLS: samo vlasnik). Tako ga vidi na svakom uređaju na kojem se prijavi,
// a nitko drugi ga ne može pročitati. Fotografije ostaju na uređaju i u mjesečnoj kopiji.

import { useSyncExternalStore } from "react";
import { odjava, sb } from "./drustvo";
import { db, naPromjenu, trenutniVlasnik } from "./store";
import type { Baza } from "./types";

interface Meta {
  /** Vrijeme zadnje lokalne izmjene. */
  lokalno: number;
  /** Vrijeme verzije koja je zadnja potvrđeno u oblaku. */
  poslano: number;
}

interface Stanje {
  /** Prva provjera oblaka nakon prijave je gotova (ili nije moguća bez interneta). */
  spremno: boolean;
  salje: boolean;
  neposlano: boolean;
  zadnje: number | null;
  greska: string | null;
}

let stanje: Stanje = { spremno: false, salje: false, neposlano: false, zadnje: null, greska: null };
const slusaci = new Set<() => void>();
const postavi = (i: Partial<Stanje>) => {
  stanje = { ...stanje, ...i };
  slusaci.forEach((f) => f());
};
const POCETNO = stanje;

export function useSinkronizacija() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => stanje,
    () => POCETNO,
  );
}

const kljucMete = (id: string) => `lovacki-dnevnik:sync:${id}`;
function meta(id: string): Meta {
  try {
    return { lokalno: 0, poslano: 0, ...JSON.parse(localStorage.getItem(kljucMete(id)) ?? "{}") };
  } catch {
    return { lokalno: 0, poslano: 0 };
  }
}
function spremiMetu(id: string, m: Partial<Meta>) {
  const nova = { ...meta(id), ...m };
  try {
    localStorage.setItem(kljucMete(id), JSON.stringify(nova));
  } catch {}
  postavi({ neposlano: nova.lokalno > nova.poslano });
  return nova;
}

let korisnik: string | null = null;
let odgoda: ReturnType<typeof setTimeout> | null = null;
let slanje: Promise<void> | null = null;

async function posalji() {
  const id = korisnik;
  if (!id || id !== trenutniVlasnik()) return;
  const m = meta(id);
  if (m.lokalno <= m.poslano) return;
  if (!navigator.onLine) return;
  postavi({ salje: true });
  try {
    const { error } = await sb()
      .from("lov_dnevnici")
      .upsert({ korisnik: id, podaci: db.dohvati(), azurirano: new Date(m.lokalno).toISOString() });
    if (error) throw error;
    spremiMetu(id, { poslano: m.lokalno });
    postavi({ zadnje: Date.now(), greska: null });
  } catch (e) {
    postavi({ greska: (e as Error).message });
  } finally {
    postavi({ salje: false });
  }
}

/** Šalje odmah sve neposlane izmjene (npr. prije odjave). */
export async function isprazni() {
  if (odgoda) clearTimeout(odgoda);
  odgoda = null;
  await slanje;
  slanje = posalji().finally(() => (slanje = null));
  await slanje;
}

function zakaziSlanje() {
  if (odgoda) clearTimeout(odgoda);
  odgoda = setTimeout(() => {
    odgoda = null;
    slanje = (slanje ?? Promise.resolve()).then(posalji).finally(() => (slanje = null));
  }, 2500);
}

let prijavljeno = false;
function prijaviSlusace() {
  if (prijavljeno) return;
  prijavljeno = true;
  naPromjenu(() => {
    if (!korisnik) return;
    spremiMetu(korisnik, { lokalno: Date.now() });
    zakaziSlanje();
  });
  window.addEventListener("online", () => zakaziSlanje());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") isprazni().catch(() => {});
  });
}

/** Poziva se nakon prijave (i pri svakom pokretanju dok je korisnik prijavljen). */
export async function pokreniSinkronizaciju(id: string | null) {
  korisnik = id;
  if (!id) {
    postavi({ spremno: false, neposlano: false });
    return;
  }
  prijaviSlusace();
  postavi({ spremno: false, greska: null });
  try {
    const odgovor = await Promise.race([
      sb().from("lov_dnevnici").select("podaci,azurirano").eq("korisnik", id).maybeSingle(),
      new Promise<never>((_, ne) => setTimeout(() => ne(new Error("Bez veze")), 7000)),
    ]);
    if (korisnik !== id) return;
    if (odgovor.error) throw odgovor.error;
    const red = odgovor.data as { podaci: Baza; azurirano: string } | null;
    const m = meta(id);
    if (red) {
      const oblak = Date.parse(red.azurirano);
      // Zadnja izmjena pobjeđuje: novija verzija iz oblaka (npr. s drugog mobitela) zamjenjuje lokalnu.
      if (!db.imaLokalno() || oblak > m.lokalno) {
        db.zamijeni(red.podaci, true);
        spremiMetu(id, { lokalno: oblak, poslano: oblak });
      } else if (m.lokalno > m.poslano || oblak < m.lokalno) {
        if (m.lokalno === 0) spremiMetu(id, { lokalno: Date.now() });
        await isprazni();
      }
    } else if (db.imaLokalno()) {
      if (m.lokalno <= m.poslano) spremiMetu(id, { lokalno: Date.now() });
      await isprazni();
    }
    postavi({ zadnje: Date.now() });
  } catch (e) {
    postavi({ greska: (e as Error).message });
  } finally {
    if (korisnik === id) postavi({ spremno: true });
  }
}

/** Odjava: najprije pošalji neposlane izmjene, zatim odjavi. Dnevnik se skriva dok se netko ne prijavi. */
export async function odjaviSe() {
  await isprazni().catch(() => {});
  await odjava();
}
