// Kratki link iz Google karata (maps.app.goo.gl/…) ne sadrži koordinate – one su tek u adresi na koju
// preusmjerava. Preglednik to ne može pročitati (CORS), pa preusmjeravanja pratimo ovdje, i to samo
// unutar Googleovih domena.

import { GOOGLE_DOMENA, koordinateIzTeksta } from "@/lib/lokacijaIzTeksta";

const MAKS_SKOKOVA = 6;

export async function GET(request: Request) {
  const ulaz = new URL(request.url).searchParams.get("u") ?? "";
  let adresa: URL;
  try {
    adresa = new URL(ulaz);
  } catch {
    return Response.json({ greska: "Neispravan link" }, { status: 400 });
  }
  for (let i = 0; i <= MAKS_SKOKOVA; i++) {
    if (adresa.protocol !== "https:" || !GOOGLE_DOMENA.test(adresa.hostname)) {
      return Response.json({ greska: "Podržani su samo linkovi iz Google karata" }, { status: 400 });
    }
    const k = koordinateIzTeksta(adresa.href);
    if (k) return Response.json(k, { headers: { "Cache-Control": "public, max-age=86400" } });
    // Stranica pristanka na kolačiće nosi pravu adresu u parametru „continue”.
    const nastavak = adresa.hostname.startsWith("consent.") ? adresa.searchParams.get("continue") : null;
    if (nastavak) {
      adresa = new URL(nastavak);
      continue;
    }
    let r: Response;
    try {
      r = await fetch(adresa, { redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0 CroLovac" } });
    } catch {
      return Response.json({ greska: "Google karte ne odgovaraju" }, { status: 504 });
    }
    const dalje = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && dalje) {
      adresa = new URL(dalje, adresa);
      continue;
    }
    // Nema više preusmjeravanja: koordinate ponekad stoje samo u sadržaju stranice.
    if (r.ok) {
      const html = (await r.text()).slice(0, 400_000);
      const izSadrzaja = koordinateIzTeksta(html.match(/https:\/\/www\.google\.[a-z.]+\/maps\/[^"'\s<>]*(?:!3d|@)[^"'\s<>]*/)?.[0] ?? "");
      if (izSadrzaja) return Response.json(izSadrzaja, { headers: { "Cache-Control": "public, max-age=86400" } });
      // Pregledna slika stranice (og:image) nosi središte: staticmap?center=45.3%2C14.7 ili markers=…
      const m = html.match(/(?:center|markers)=(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{1,3}\.\d+)/);
      const izSlike = m ? koordinateIzTeksta(`${m[1]},${m[2]}`) : null;
      if (izSlike) return Response.json(izSlike, { headers: { "Cache-Control": "public, max-age=86400" } });
    }
    break;
  }
  return Response.json({ greska: "U linku nema koordinata" }, { status: 404 });
}
