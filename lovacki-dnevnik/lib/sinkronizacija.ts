"use client";

// Dnevnik prijavljenog korisnika čuva se i u njegovom privatnom retku u Supabaseu
// (tablica lov_dnevnici, RLS: samo vlasnik). Tako ga vidi na svakom uređaju na kojem se prijavi,
// a nitko drugi ga ne može pročitati. Fotografije ostaju na uređaju i u mjesečnoj kopiji.

import { useSyncExternalStore } from "react";
import { odjava, sb } from "./drustvo";
import { uskladiFotografije, posaljiRed } from "./foto";
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
  /** Korisnik već ima dnevnik u oblaku (nije novi korisnik – uvod se ne prikazuje). */
  imaOblak: boolean;
}

let stanje: Stanje = { spremno: false, salje: false, neposlano: false, zadnje: null, greska: null, imaOblak: false };
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
/** Oblak sadrži prave podatke (ne prazan dnevnik ni primjere). */
let oblakStvaran = false;
/** Korisnik je izričito obrisao sve podatke – smije se poslati prazan dnevnik. */
let dopustenoBrisanje = false;

/** Poziva se samo iz „Obriši sve podatke”: dopušta da se prazan dnevnik pošalje u oblak. */
export function dopustiBrisanjeUOblaku() {
  dopustenoBrisanje = true;
}

let odgoda: ReturnType<typeof setTimeout> | null = null;
let slanje: Promise<void> | null = null;

async function posalji() {
  const id = korisnik;
  if (!id || id !== trenutniVlasnik()) return;
  const m = meta(id);
  if (m.lokalno <= m.poslano) return;
  if (!navigator.onLine) return;
  const lokalno = db.dohvati();
  // Zaštita: prazan dnevnik ili primjeri nikad ne prepisuju prave podatke u oblaku.
  if (oblakStvaran && prazanIliPrimjer(lokalno) && !dopustenoBrisanje) {
    postavi({ greska: "Prazan dnevnik nije poslan u oblak – vaši podaci u oblaku su sačuvani." });
    return;
  }
  postavi({ salje: true });
  try {
    const { error } = await sb()
      .from("lov_dnevnici")
      .upsert({ korisnik: id, podaci: lokalno, azurirano: new Date(m.lokalno).toISOString() });
    if (error) throw error;
    oblakStvaran = !prazanIliPrimjer(lokalno);
    postavi({ imaOblak: true });
    dopustenoBrisanje = false;
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
  window.addEventListener("online", () => {
    zakaziSlanje();
    posaljiRed().catch(() => {});
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") isprazni().catch(() => {});
  });
}

/** Poziva se nakon prijave (i pri svakom pokretanju dok je korisnik prijavljen). */
export async function pokreniSinkronizaciju(id: string | null) {
  korisnik = id;
  oblakStvaran = false;
  dopustenoBrisanje = false;
  postavi({ imaOblak: false });
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
      oblakStvaran = !prazanIliPrimjer(red.podaci);
      postavi({ imaOblak: true });
      if (db.imaLokalno() && m.poslano === 0) {
        // Prvo usklađivanje ovog uređaja (npr. Safari i aplikacija na početnom zaslonu imaju odvojene
        // podatke): nikad ne prepisuj – spoji lokalne i podatke iz oblaka pa pošalji rezultat.
        const spojeno = spoji(db.dohvati(), red.podaci);
        db.zamijeni(spojeno, true);
        spremiMetu(id, { lokalno: Date.now(), poslano: oblak });
        await isprazni();
      } else if (!db.imaLokalno() || oblak > m.lokalno || (prazanIliPrimjer(db.dohvati()) && oblakStvaran)) {
        // Zadnja izmjena pobjeđuje: novija verzija iz oblaka (npr. s drugog mobitela) zamjenjuje lokalnu.
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
  // Fotografije koje još nisu u oblaku šalju se u pozadini.
  uskladiFotografije().catch(() => {});
}

const KOLEKCIJE = ["lovista", "tocke", "izlasci", "odstrel", "dozvole", "oruzje"] as const;
const brojZapisa = (b: Baza) => KOLEKCIJE.reduce((n, k) => n + (b[k]?.length ?? 0), 0);
const prazanIliPrimjer = (b: Baza) => brojZapisa(b) === 0 || Boolean(b.postavke?.primjer);

/** Spaja dva dnevnika bez gubitka zapisa (unija po id-u); primjeri i prazni dnevnici se ne miješaju. */
export function spoji(lokalno: Baza, oblak: Baza): Baza {
  if (prazanIliPrimjer(lokalno) && !prazanIliPrimjer(oblak)) return oblak;
  if (prazanIliPrimjer(oblak) && !prazanIliPrimjer(lokalno)) return lokalno;
  const rez = { ...oblak, postavke: oblak.postavke?.dovrsenUvod ? oblak.postavke : lokalno.postavke } as Baza;
  for (const k of KOLEKCIJE) {
    const ids = new Set((oblak[k] ?? []).map((x) => x.id));
    (rez as unknown as Record<string, unknown[]>)[k] = [...(oblak[k] ?? []), ...(lokalno[k] ?? []).filter((x) => !ids.has(x.id))];
  }
  return rez;
}

/** Odjava: najprije pošalji neposlane izmjene, zatim odjavi. Dnevnik se skriva dok se netko ne prijavi. */
export async function odjaviSe() {
  await isprazni().catch(() => {});
  await odjava();
}
