"use client";

import { uAplikaciji } from "./nativno";

/** Oznaka verzije ugrađena pri izradi (vidi next.config.ts) i provjera objavljene verzije. */
export const MOJA_VERZIJA = process.env.NEXT_PUBLIC_VERZIJA ?? "";

export async function objavljenaVerzija(): Promise<string | null> {
  const r = await fetch(`/?provjera=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
  if (!r.ok) return null;
  const m = (await r.text()).match(/name="crolovac-verzija"\s+content="([^"]*)"/);
  return m?.[1] || null;
}

/** true ako je objavljena novija verzija od one koja trenutno radi. Bez interneta ili greške: false. */
export async function imaNovuVerziju(): Promise<boolean> {
  if (!MOJA_VERZIJA || !navigator.onLine) return false;
  try {
    const v = await objavljenaVerzija();
    return Boolean(v && v !== MOJA_VERZIJA);
  } catch {
    return false;
  }
}

/** Učitava najnoviju verziju aplikacije (podaci ostaju na uređaju i u oblaku). */
export function osvjeziAplikaciju() {
  navigator.serviceWorker
    ?.getRegistration()
    .then((reg) => reg?.update())
    .catch(() => {})
    .finally(() => window.location.reload());
}

function opisUredaja() {
  const ua = navigator.userAgent;
  const sustav = /iPhone|iPod/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : "Računalo";
  const ikona =
    window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
  if (uAplikaciji()) return `${sustav} · Play aplikacija`;
  return `${sustav} · ${ikona ? "ikona" : "preglednik"}`;
}

/** Bilježi koju verziju i s koje adrese korisnik koristi (vidi samo administrator). Nikad ne baca grešku. */
export async function zabiljeziVerziju(korisnik: string) {
  if (!MOJA_VERZIJA || !navigator.onLine) return;
  try {
    const { sb } = await import("./drustvo");
    await sb()
      .from("lov_verzije")
      .upsert({ korisnik, verzija: MOJA_VERZIJA.slice(0, 40), adresa: location.host.slice(0, 120), uredaj: opisUredaja(), azurirano: new Date().toISOString() });
  } catch {}
}
