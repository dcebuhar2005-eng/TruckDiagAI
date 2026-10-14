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
}

type Primatelj = { na: (p: Polozaj) => void; greska?: (odbijeno: boolean) => void };

/* ---------------- Lokacija ---------------- */

const BG = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
const primatelji = new Set<Primatelj>();
let nativniId: Promise<string> | null = null;

async function pokreniNativno() {
  await dozvoliObavijesti();
  return BG.addWatcher(
    {
      backgroundTitle: "CroLovac · lov u tijeku",
      backgroundMessage: "Bilježi se vaš trag. Kad završite lov, lokacija se više ne koristi.",
      requestPermissions: true,
      stale: false,
      distanceFilter: 10,
    },
    (l?: Location, e?: { code?: string }) => {
      if (e || !l) {
        const odbijeno = e?.code === "NOT_AUTHORIZED";
        primatelji.forEach((p) => p.greska?.(odbijeno));
        return;
      }
      const p = { lat: l.latitude, lng: l.longitude, tocnost: l.accuracy };
      primatelji.forEach((x) => x.na(p));
    },
  );
}

/**
 * Prati lokaciju dok se ne pozove vraćena funkcija. U Android aplikaciji svi pratitelji
 * (lov, dijeljenje) dijele jednu nativnu uslugu; ona radi dok postoji barem jedan.
 */
export function pratiLokaciju(na: Primatelj["na"], greska?: Primatelj["greska"], opcije?: PositionOptions): () => void {
  if (!uAplikaciji()) {
    if (!navigator.geolocation) return () => {};
    const id = navigator.geolocation.watchPosition(
      (p) => na({ lat: p.coords.latitude, lng: p.coords.longitude, tocnost: p.coords.accuracy }),
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
    id?.then((x) => BG.removeWatcher({ id: x })).catch(() => {});
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
export const fetchZaSupabase: typeof fetch = async (ulaz, init) => {
  if (!uAplikaciji() || document.visibilityState === "visible" || ulaz instanceof Request) return fetch(ulaz, init);
  const url = String(ulaz);
  const tijelo = init?.body;
  if (url.includes("/storage/v1/") || (tijelo != null && typeof tijelo !== "string")) return fetch(ulaz, init);
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
