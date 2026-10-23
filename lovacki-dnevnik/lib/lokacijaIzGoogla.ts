"use client";

import { KRATKI_LINK, koordinateIzTeksta, prviLink, type Koordinate } from "./lokacijaIzTeksta";

/** Lokacija iz zalijepljenog teksta: koordinate odmah, a kratki Google link preko poslužitelja. */
export async function lokacijaIzUnosa(tekst: string): Promise<Koordinate> {
  const izravno = koordinateIzTeksta(tekst);
  if (izravno) return izravno;
  const link = prviLink(tekst);
  if (link && KRATKI_LINK.test(new URL(link).hostname)) {
    if (!navigator.onLine) throw new Error("Za kratki Google link treba internet – ili zalijepite koordinate");
    const r = await fetch(`/api/lokacija?u=${encodeURIComponent(link)}`);
    const j = (await r.json().catch(() => ({}))) as Partial<Koordinate> & { greska?: string };
    if (r.ok && j.lat != null && j.lng != null) return { lat: j.lat, lng: j.lng };
    throw new Error(j.greska ?? "Lokacija nije pronađena");
  }
  throw new Error(link ? "U linku nema koordinata" : "Zalijepite link iz Google karata ili koordinate");
}

/** Pokuša pročitati međuspremnik (na iPhoneu traži potvrdu „Zalijepi”); null ako nije dopušteno. */
export async function procitajMedjuspremnik(): Promise<string | null> {
  try {
    return (await navigator.clipboard?.readText?.()) || null;
  } catch {
    return null;
  }
}
