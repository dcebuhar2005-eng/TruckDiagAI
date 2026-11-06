"use client";

// „Pozovi kolegu”: osobni link je link profila (/lovci?dodaj=korisnicko_ime) s oznakom utm_source=pozivnica.
// Tko ga otvori prije registracije, pozivnica se pamti na uređaju: nakon prijave nudi se dodavanje
// lovca koji je pozvao, a kod registracije se zapisuje u podatke računa (user_metadata.pozvao).

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { dogadaj } from "./pracenje";

const KLJUC = "lovacki-dnevnik:pozvao";

export const linkPozivnice = (korisnickoIme: string) =>
  `https://hunt-jade.vercel.app/lovci?dodaj=${encodeURIComponent(korisnickoIme)}&utm_source=pozivnica&utm_medium=link`;

/** Pri pokretanju: ako je stranica otvorena s pozivnice, zapamti tko je pozvao. */
export function zapamtiPozivnicu() {
  try {
    const u = new URLSearchParams(window.location.search);
    const ki = u.get("dodaj")?.trim().toLowerCase().replace(/^@/, "");
    if (ki && !localStorage.getItem(KLJUC)) {
      localStorage.setItem(KLJUC, ki);
      if (u.get("utm_source") === "pozivnica") dogadaj("pozivnica_otvorena");
    }
  } catch {}
}

export function procitajPozivnicu(): string | null {
  try {
    return localStorage.getItem(KLJUC);
  } catch {
    return null;
  }
}

export function obrisiPozivnicu() {
  try {
    localStorage.removeItem(KLJUC);
  } catch {}
}

/** Podijeli tekst: Android aplikacija (nativno), preglednik (Web Share) ili kopiranje. Vraća „kopirano” ako je kopirano. */
export async function podijeliTekst(tekst: string): Promise<"podijeljeno" | "kopirano" | "odustao"> {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Share")) {
      await Share.share({ text: tekst, dialogTitle: "Pozovi kolegu" });
      return "podijeljeno";
    }
    if (navigator.share) {
      await navigator.share({ text: tekst });
      return "podijeljeno";
    }
  } catch {
    return "odustao";
  }
  await navigator.clipboard?.writeText(tekst);
  return "kopirano";
}

/** Google Play s oznakom pozivnice (Play je prenosi u statistiku instalacija). */
export const playPozivnice = (korisnickoIme: string) =>
  `https://play.google.com/store/apps/details?id=com.crolovac.app&referrer=${encodeURIComponent(`utm_source=pozivnica&utm_medium=link&utm_content=${korisnickoIme}`)}`;

export const tekstPozivnice = (korisnickoIme: string) =>
  [
    "Lovim s CroLovcem – besplatnom aplikacijom za lovce 🦌 Dnevnik, karta s čekama, vjetar i lovni kalendar.",
    "",
    `▶️ Android (Google Play): ${playPozivnice(korisnickoIme)}`,
    `📱 iPhone i računalo: ${linkPozivnice(korisnickoIme)}`,
    "",
    `Dodaj me za prijatelja – u aplikaciji Lovci → traži @${korisnickoIme}`,
  ].join("\n");
