"use client";

// Dnevnik grešaka: rušenja stranica i neuspjela učitavanja zapisuju se u Supabase (lov_greske),
// da ih se vidi i popravi i bez prijave testera. Ne šalju se lokacije ni sadržaj dnevnika – samo
// vrsta greške, poruka, stranica, uređaj i verzija aplikacije.

import { konfigurirano, sb } from "./drustvo";
import { uAplikaciji } from "./nativno";

const MAKS_PO_OTVARANJU = 15;
const KLJUC_ODGODENIH = "lovacki-dnevnik:greske";
let poslano = 0;
const vidjeno = new Set<string>();

type Greska = { vrsta: string; poruka?: string; stog?: string; podaci?: Record<string, unknown> };

const skrati = (s: string | undefined, n: number) => (s ? s.slice(0, n) : undefined);

function zapis(g: Greska) {
  return {
    vrsta: g.vrsta.slice(0, 40),
    poruka: skrati(g.poruka, 1000),
    stog: skrati(g.stog, 3000),
    stranica: skrati(location.pathname, 200),
    uredjaj: skrati(`${uAplikaciji() ? "Android app · " : ""}${navigator.userAgent}`, 300),
    verzija: skrati(process.env.NEXT_PUBLIC_VERZIJA, 40),
    podaci: { ...g.podaci, naMrezi: navigator.onLine },
  };
}

/** Greške bez interneta čekaju na uređaju i šalju se kad se veza vrati. */
function odgodi(z: ReturnType<typeof zapis>) {
  try {
    const stari = JSON.parse(localStorage.getItem(KLJUC_ODGODENIH) ?? "[]") as unknown[];
    localStorage.setItem(KLJUC_ODGODENIH, JSON.stringify([...stari, { ...z, kada: new Date().toISOString() }].slice(-20)));
  } catch {}
}

async function posalji(redovi: object[]) {
  const { error } = await sb().from("lov_greske").insert(redovi);
  if (error) throw error;
}

export function zabiljeziGresku(g: Greska) {
  if (!konfigurirano || typeof window === "undefined") return;
  const otisak = `${g.vrsta}|${g.poruka}`;
  if (vidjeno.has(otisak) || poslano >= MAKS_PO_OTVARANJU) return;
  vidjeno.add(otisak);
  poslano++;
  const z = zapis(g);
  if (!navigator.onLine) return odgodi(z);
  posalji([z]).catch(() => odgodi(z));
}

async function posaljiOdgodjene() {
  try {
    const redovi = JSON.parse(localStorage.getItem(KLJUC_ODGODENIH) ?? "[]") as object[];
    if (!redovi.length) return;
    localStorage.removeItem(KLJUC_ODGODENIH);
    await posalji(redovi.map((r) => ({ ...r, kada: undefined, podaci: { ...(r as { podaci?: object }).podaci, odgodjeno: (r as { kada?: string }).kada } })));
  } catch {}
}

let pokrenuto = false;
/** Hvata greške cijele aplikacije (poziva se jednom, iz ljuske). */
export function pratiGreske() {
  if (pokrenuto || typeof window === "undefined") return;
  pokrenuto = true;
  addEventListener("error", (e) => {
    // Neučitana skripta ili stil (npr. stara verzija u predmemoriji) – i to je korisno znati.
    const cilj = e.target;
    if (cilj instanceof HTMLScriptElement || cilj instanceof HTMLLinkElement) {
      zabiljeziGresku({ vrsta: "ucitavanje", poruka: cilj instanceof HTMLScriptElement ? cilj.src : cilj.href });
      return;
    }
    if (cilj instanceof HTMLImageElement) return; // pločice karte i slike – bez signala normalno
    zabiljeziGresku({ vrsta: "js", poruka: e.message, stog: e.error?.stack });
  }, true);
  addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: string; stack?: string } | string | undefined;
    const poruka = typeof r === "string" ? r : r?.message ?? String(r);
    // Mrežne greške bez signala su očekivane u lovištu – ne bilježe se.
    if (!navigator.onLine || /Failed to fetch|Load failed|NetworkError|Nema internetske veze|aborted/i.test(poruka)) return;
    zabiljeziGresku({ vrsta: "obecanje", poruka, stog: typeof r === "object" ? r?.stack : undefined });
  });
  addEventListener("online", posaljiOdgodjene);
  if (navigator.onLine) setTimeout(posaljiOdgodjene, 5000);
}
