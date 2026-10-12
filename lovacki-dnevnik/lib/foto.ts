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

const spremiLokalno = (id: string, dataUrl: string) => transakcija("readwrite", (s) => s.put(dataUrl, id));
const dohvatiLokalno = (id: string) => transakcija<string | undefined>("readonly", (s) => s.get(id));

/** Sprema fotografiju na uređaj i (kad je korisnik prijavljen) u njegovo privatno spremište u oblaku. */
export async function spremiFoto(id: string, dataUrl: string) {
  await spremiLokalno(id, dataUrl);
  dodajURed(id);
  posaljiRed().catch(() => {});
}

/** Fotografija s uređaja; ako je nema (novi mobitel, obrisana aplikacija), preuzima se iz oblaka. */
export async function dohvatiFoto(id: string) {
  const lok = await dohvatiLokalno(id).catch(() => undefined);
  if (lok) return lok;
  const oblak = await preuzmiIzOblaka(id).catch(() => undefined);
  if (oblak) await spremiLokalno(id, oblak).catch(() => {});
  return oblak;
}

/* ---------------- Fotografije u oblaku (Supabase Storage „lov-fotografije”) ---------------- */

const SPREMNIK = "lov-fotografije";
const KLJUC_REDA = "lovacki-dnevnik:foto-red";

function red(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KLJUC_REDA) ?? "[]");
  } catch {
    return [];
  }
}
function spremiRed(r: string[]) {
  try {
    localStorage.setItem(KLJUC_REDA, JSON.stringify([...new Set(r)]));
  } catch {}
}
function dodajURed(id: string) {
  spremiRed([...red(), id]);
}

async function klijent() {
  const { konfigurirano, sb } = await import("./drustvo");
  if (!konfigurirano) return null;
  const k = sb();
  const { data } = await k.auth.getSession();
  const uid = data.session?.user.id;
  return uid ? { k, uid } : null;
}

function uBlob(dataUrl: string) {
  const [glava, tijelo] = dataUrl.split(",");
  const tip = glava.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const bajtovi = atob(tijelo);
  const niz = new Uint8Array(bajtovi.length);
  for (let i = 0; i < bajtovi.length; i++) niz[i] = bajtovi.charCodeAt(i);
  return new Blob([niz], { type: tip });
}

function uDataUrl(b: Blob) {
  return new Promise<string>((ok, ne) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ne(r.error);
    r.readAsDataURL(b);
  });
}

let saljem = false;
/** Šalje fotografije koje još nisu u oblaku (npr. snimljene bez signala). */
export async function posaljiRed() {
  if (saljem || typeof navigator === "undefined" || !navigator.onLine) return;
  const r = red();
  if (!r.length) return;
  const c = await klijent();
  if (!c) return;
  saljem = true;
  try {
    for (const id of r) {
      const url = await dohvatiLokalno(id).catch(() => undefined);
      if (url) {
        const { error } = await c.k.storage
          .from(SPREMNIK)
          .upload(`${c.uid}/${id}.jpg`, uBlob(url), { contentType: "image/jpeg", upsert: false });
        // „Već postoji” znači da je fotografija već u oblaku.
        if (error && !/exists|duplicate/i.test(error.message)) throw error;
      }
      spremiRed(red().filter((x) => x !== id));
    }
  } finally {
    saljem = false;
  }
}

async function preuzmiIzOblaka(id: string) {
  const c = await klijent();
  if (!c) return undefined;
  const { data, error } = await c.k.storage.from(SPREMNIK).download(`${c.uid}/${id}.jpg`);
  if (error || !data) return undefined;
  return uDataUrl(data);
}

/** Nakon prijave: sve fotografije s uređaja koje još nisu u oblaku stavlja u red za slanje. */
export async function uskladiFotografije() {
  const c = await klijent();
  if (!c) return;
  const { data } = await c.k.storage.from(SPREMNIK).list(c.uid, { limit: 1000 });
  const uOblaku = new Set((data ?? []).map((f) => f.name.replace(/\.jpg$/, "")));
  const lokalno = Object.keys(await sveFotografije().catch(() => ({})));
  spremiRed([...red(), ...lokalno.filter((id) => !uOblaku.has(id))]);
  await posaljiRed();
}
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
