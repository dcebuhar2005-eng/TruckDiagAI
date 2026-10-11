"use client";

// Fotografije se čuvaju u IndexedDB-u jer localStorage ima premalo prostora.

const BAZA = "lovacki-dnevnik-foto";
const SPREMISTE = "foto";

function otvori(): Promise<IDBDatabase> {
  return new Promise((ok, ne) => {
    const req = indexedDB.open(BAZA, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(SPREMISTE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ne(req.error);
  });
}

async function transakcija<T>(nacin: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await otvori();
  return new Promise<T>((ok, ne) => {
    const req = f(db.transaction(SPREMISTE, nacin).objectStore(SPREMISTE));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ne(req.error);
  });
}

export const spremiFoto = (id: string, dataUrl: string) =>
  transakcija("readwrite", (s) => s.put(dataUrl, id));
export const dohvatiFoto = (id: string) =>
  transakcija<string | undefined>("readonly", (s) => s.get(id));
export const obrisiFoto = (id: string) => transakcija("readwrite", (s) => s.delete(id));

export async function sveFotografije(): Promise<Record<string, string>> {
  const db = await otvori();
  return new Promise((ok, ne) => {
    const rez: Record<string, string> = {};
    const req = db.transaction(SPREMISTE).objectStore(SPREMISTE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        rez[String(c.key)] = c.value as string;
        c.continue();
      } else ok(rez);
    };
    req.onerror = () => ne(req.error);
  });
}

/** Smanjuje sliku na najviše `maks` piksela po dužoj strani i vraća JPEG data URL. */
export function smanjiSliku(datoteka: File, maks = 1400): Promise<string> {
  return new Promise((ok, ne) => {
    const url = URL.createObjectURL(datoteka);
    const img = new Image();
    img.onload = () => {
      const omjer = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * omjer);
      c.height = Math.round(img.height * omjer);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = () => ne(new Error("Slika se ne može učitati"));
    img.src = url;
  });
}

/** Sve fotografije odstrela (podržava i stare zapise s jednom fotografijom). */
export function fotografijeOdstrela(o: { fotoId?: string; fotoIds?: string[] }) {
  return o.fotoIds ?? (o.fotoId ? [o.fotoId] : []);
}
