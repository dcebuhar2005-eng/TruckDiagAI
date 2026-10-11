"use client";

// Trajna predmemorija (IndexedDB) s rokom trajanja – smanjuje broj zahtjeva prema
// besplatnim javnim servisima (npr. Overpass API) i ubrzava ponovno otvaranje karte.

const BAZA = "lovacki-dnevnik-predmemorija";
const SPREMISTE = "zapisi";

let otvaranje: Promise<IDBDatabase> | null = null;
function otvori() {
  if (!otvaranje) {
    otvaranje = new Promise((ok, ne) => {
      const req = indexedDB.open(BAZA, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(SPREMISTE);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ne(req.error);
    });
  }
  return otvaranje;
}

export async function procitaj<T>(kljuc: string, maksStarostMs: number): Promise<T | undefined> {
  try {
    const db = await otvori();
    const zapis = await new Promise<{ t: number; v: T } | undefined>((ok, ne) => {
      const req = db.transaction(SPREMISTE).objectStore(SPREMISTE).get(kljuc);
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ne(req.error);
    });
    if (!zapis || Date.now() - zapis.t > maksStarostMs) return undefined;
    return zapis.v;
  } catch {
    return undefined;
  }
}

export async function zapisi<T>(kljuc: string, vrijednost: T) {
  try {
    const db = await otvori();
    await new Promise<void>((ok, ne) => {
      const req = db.transaction(SPREMISTE, "readwrite").objectStore(SPREMISTE).put({ t: Date.now(), v: vrijednost }, kljuc);
      req.onsuccess = () => ok();
      req.onerror = () => ne(req.error);
    });
  } catch {
    // Bez predmemorije aplikacija i dalje radi.
  }
}
