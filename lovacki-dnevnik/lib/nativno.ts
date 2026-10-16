"use client";

// Android aplikacija (Google Play) je ljuska oko iste web aplikacije. Kad radi u njoj, lokacija
// se prati kroz nativnu uslugu u prvom planu: trag se bilježi i kad je zaslon ugašen, a u
// traci obavijesti stoji „Lov u tijeku” dok lov ili dijeljenje lokacije traju. Čim oboje
// završi, usluga se gasi i aplikacija više ne koristi lokaciju.
// U pregledniku (i na iPhoneu) sve ostaje kao prije – navigator.geolocation.

import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin, Location } from "@capacitor-community/background-geolocation";
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";

export const uAplikaciji = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

export interface Polozaj {
  lat: number;
  lng: number;
  tocnost: number;
  /** Kad je lokacija izmjerena (ms) – zadnja poznata lokacija može biti i starija. */
  vrijeme?: number;
}

type Primatelj = { na: (p: Polozaj) => void; greska?: (odbijeno: boolean) => void };

/* ---------------- Lokacija ---------------- */

const BG = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
const primatelji = new Set<Primatelj>();
let nativniId: Promise<string> | null = null;
let zadnjeUklanjanje: Promise<unknown> = Promise.resolve();

// Nativno praćenje živi i kad se stranica ponovno učita (npr. prijelaz bez signala). Njegov id se
// pamti, pa nova stranica najprije ugasi praćenje koje je ostalo od prethodne – inače bi obavijest
// „lov u tijeku” ostala i nakon završenog lova.
const KLJUC_PRACENJA = "lovacki-dnevnik:gps-pracenje";
let ciscenje: Promise<unknown> | null = null;
export function ocistiStaroPracenje() {
  if (!uAplikaciji()) return Promise.resolve();
  ciscenje ??= (async () => {
    try {
      const id = localStorage.getItem(KLJUC_PRACENJA);
      if (!id) return;
      localStorage.removeItem(KLJUC_PRACENJA);
      await BG.removeWatcher({ id });
    } catch {}
  })();
  return ciscenje;
}

/** Čeka da se nativno praćenje stvarno ugasi (najviše 1,5 s). */
export function pracenjeUgaseno() {
  return Promise.race([zadnjeUklanjanje, new Promise((ok) => setTimeout(ok, 1500))]);
}

async function pokreniNativno() {
  await ocistiStaroPracenje();
  await dozvoliObavijesti();
  const id = await BG.addWatcher(
    {
      backgroundTitle: "CroLovac · lov u tijeku",
      backgroundMessage: "Bilježi se vaš trag. Kad završite lov, lokacija se više ne koristi.",
      requestPermissions: true,
      // Odmah javlja zadnju poznatu lokaciju (bez signala satelit se dulje traži), zatim točnije.
      stale: true,
      distanceFilter: 10,
    },
    (l?: Location, e?: { code?: string }) => {
      if (e || !l) {
        const odbijeno = e?.code === "NOT_AUTHORIZED";
        primatelji.forEach((p) => p.greska?.(odbijeno));
        return;
      }
      const p = { lat: l.latitude, lng: l.longitude, tocnost: l.accuracy, vrijeme: l.time ?? Date.now() };
      primatelji.forEach((x) => x.na(p));
    },
  );
  try {
    localStorage.setItem(KLJUC_PRACENJA, id);
  } catch {}
  return id;
}

/**
 * Prati lokaciju dok se ne pozove vraćena funkcija. U Android aplikaciji svi pratitelji
 * (lov, dijeljenje) dijele jednu nativnu uslugu; ona radi dok postoji barem jedan.
 */
export function pratiLokaciju(na: Primatelj["na"], greska?: Primatelj["greska"], opcije?: PositionOptions): () => void {
  if (!uAplikaciji()) {
    if (!navigator.geolocation) return () => {};
    const u = (p: GeolocationPosition) => na({ lat: p.coords.latitude, lng: p.coords.longitude, tocnost: p.coords.accuracy, vrijeme: p.timestamp });
    // Brzo: zadnja poznata ili približna lokacija dok satelit ne odgovori.
    navigator.geolocation.getCurrentPosition(u, () => {}, { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 5000 });
    const id = navigator.geolocation.watchPosition(
      u,
      (e) => greska?.(e.code === e.PERMISSION_DENIED),
      opcije,
    );
    return () => navigator.geolocation.clearWatch(id);
  }
  const p: Primatelj = { na, greska };
  primatelji.add(p);
  nativniId ??= pokreniNativno();
  return () => {
    if (!primatelji.delete(p) || primatelji.size) return;
    const id = nativniId;
    nativniId = null;
    zadnjeUklanjanje = (id ?? Promise.reject())
      .then(async (x) => {
        await BG.removeWatcher({ id: x });
        if (localStorage.getItem(KLJUC_PRACENJA) === x) localStorage.removeItem(KLJUC_PRACENJA);
      })
      .catch(() => {});
  };
}

export function otvoriPostavkeLokacije() {
  if (uAplikaciji()) BG.openSettings().catch(() => {});
}

/* ---------------- Obavijesti i vibracija ---------------- */

const KANAL = "lovac-blizu";
let kanal: Promise<unknown> | null = null;

async function dozvoliObavijesti() {
  try {
    const s = await LocalNotifications.checkPermissions();
    if (s.display !== "granted") await LocalNotifications.requestPermissions();
  } catch {}
}

export async function nativnaObavijest(naslov: string, tijelo: string) {
  try {
    kanal ??= LocalNotifications.createChannel({
      id: KANAL,
      name: "Lovac u blizini",
      description: "Upozorenje kad je prijatelj u lovu blizu",
      importance: 5,
      vibration: true,
      visibility: 1,
    });
    await kanal;
    await LocalNotifications.schedule({
      notifications: [{ id: Date.now() % 2147483647, title: naslov, body: tijelo, channelId: KANAL, smallIcon: "ic_stat_crolovac" }],
    });
  } catch {}
}

/** Vibracija; u aplikaciji preko nativnog sučelja ako WebView odbije uzorak. */
export function vibriraj(uzorak: number[]) {
  const ok = typeof navigator.vibrate === "function" && navigator.vibrate(uzorak);
  if (!ok && uAplikaciji()) Haptics.vibrate({ duration: Math.min(1500, uzorak.reduce((a, b) => a + b, 0)) }).catch(() => {});
}

/* ---------------- Mreža u pozadini ---------------- */

/**
 * Android usporava mrežne zahtjeve WebViewa nakon nekoliko minuta u pozadini. Dok je aplikacija
 * skrivena, zahtjevi prema Supabaseu (lokacija, prijatelji, obnova prijave) idu nativno.
 * Kad je aplikacija otvorena, koristi se obični fetch.
 */
/** Najdulje čekanje odgovora poslužitelja – sa slabim signalom zahtjev inače visi i minutu. */
const ROK_MS = 15_000;

function fetchSRokom(ulaz: RequestInfo | URL, init?: RequestInit) {
  // Bez signala nema smisla čekati: odmah greška, aplikacija radi s podacima na mobitelu.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.reject(new TypeError("Nema internetske veze"));
  const url = ulaz instanceof Request ? ulaz.url : String(ulaz);
  if (url.includes("/storage/v1/") || init?.signal) return fetch(ulaz, init);
  const prekid = new AbortController();
  const t = setTimeout(() => prekid.abort(), ROK_MS);
  return fetch(ulaz, { ...init, signal: prekid.signal }).finally(() => clearTimeout(t));
}

export const fetchZaSupabase: typeof fetch = async (ulaz, init) => {
  if (!uAplikaciji() || document.visibilityState === "visible" || ulaz instanceof Request) return fetchSRokom(ulaz, init);
  const url = String(ulaz);
  const tijelo = init?.body;
  if (url.includes("/storage/v1/") || (tijelo != null && typeof tijelo !== "string")) return fetchSRokom(ulaz, init);
  const zaglavlja: Record<string, string> = {};
  new Headers(init?.headers).forEach((v, k) => (zaglavlja[k] = v));
  const r = await CapacitorHttp.request({
    url,
    method: init?.method ?? "GET",
    headers: zaglavlja,
    data: tijelo ?? undefined,
    responseType: "text",
  });
  const tekst = typeof r.data === "string" ? r.data : JSON.stringify(r.data ?? null);
  return new Response(r.status === 204 ? null : tekst, { status: r.status, headers: r.headers });
};
