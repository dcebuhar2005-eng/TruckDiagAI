// Koordinate iz onoga što lovac zalijepi: link iz Google karata (i Apple/OSM), „geo:” poveznica,
// decimalne koordinate („45.31234, 14.72345”) ili stupnjevi-minute-sekunde (45°18'44.4"N 14°43'24.4"E).
// Bez ovisnosti o pregledniku – koristi se i na poslužitelju (razrješavanje kratkih Google linkova).

export type Koordinate = { lat: number; lng: number };

const BROJ = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

const valjane = (lat: number, lng: number): Koordinate | null =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0) ? { lat, lng } : null;

/** Kratki Google linkovi koji se moraju razriješiti na poslužitelju (preusmjeravanje). */
export const KRATKI_LINK = /^(maps\.app\.goo\.gl|goo\.gl|g\.co)$/i;
/** Domene s kojih smijemo pratiti preusmjeravanja i čitati koordinate. */
export const GOOGLE_DOMENA = /^((www|maps|consent)\.)?google\.[a-z.]{2,6}$|^(maps\.app\.goo\.gl|goo\.gl|g\.co)$/i;

export function prviLink(tekst: string): string | null {
  return tekst.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? null;
}

function izStupnjeva(s: string): Koordinate | null {
  // 45°18'44.4"N 14°43'24.4"E (i varijante s ′ ″ i razmacima)
  const r = /(\d{1,3})\s*°\s*(\d{1,2})?\s*['′]?\s*(\d{1,2}(?:[.,]\d+)?)?\s*["″]?\s*([NSJ])\W+(\d{1,3})\s*°\s*(\d{1,2})?\s*['′]?\s*(\d{1,2}(?:[.,]\d+)?)?\s*["″]?\s*([EIWZ])/i;
  const m = s.match(r);
  if (!m) return null;
  const st = (d: string, mi?: string, se?: string) => Number(d) + Number(mi ?? 0) / 60 + Number((se ?? "0").replace(",", ".")) / 3600;
  // Hrvatske oznake: S = sjever, J = jug, I = istok, Z = zapad; engleske: N, S (jug), E, W.
  const hrvatski = /[IZ]/i.test(m[8]);
  const jug = /J/i.test(m[4]) || (/S/i.test(m[4]) && !hrvatski);
  const lat = st(m[1], m[2], m[3]) * (jug ? -1 : 1);
  const lng = st(m[5], m[6], m[7]) * (/[WZ]/i.test(m[8]) ? -1 : 1);
  return valjane(lat, lng);
}

/** Koordinate iz teksta ili (već razriješenog) linka; null ako ih nema. */
export function koordinateIzTeksta(ulaz: string): Koordinate | null {
  let s = ulaz.trim();
  try {
    s = decodeURIComponent(s);
  } catch {}
  // Točan položaj odabranog mjesta (pribadača) – precizniji od središta pogleda (@lat,lng).
  let m = s.match(new RegExp(String.raw`!3d${BROJ}!4d${BROJ}`));
  if (m) return valjane(+m[1], +m[2]);
  m = s.match(new RegExp(String.raw`[?&](?:q|query|ll|destination|daddr|center|sll|mlat)=(?:loc:)?${BROJ}\s*,\s*${BROJ}`, "i"));
  if (m) return valjane(+m[1], +m[2]);
  m = s.match(new RegExp(String.raw`[?&]mlat=${BROJ}&mlon=${BROJ}`, "i"));
  if (m) return valjane(+m[1], +m[2]);
  m = s.match(new RegExp(String.raw`/@${BROJ},${BROJ}`));
  if (m) return valjane(+m[1], +m[2]);
  m = s.match(new RegExp(String.raw`geo:${BROJ},${BROJ}`, "i"));
  if (m) return valjane(+m[1], +m[2]);
  const dms = izStupnjeva(s);
  if (dms) return dms;
  // Samo brojevi: „45.31234, 14.72345” ili „45.31234 14.72345” (ne iz sredine duljeg linka).
  if (!/https?:\/\//i.test(s)) {
    m = s.match(new RegExp(String.raw`^\s*${BROJ}\s*[,;\s]\s*${BROJ}\s*$`));
    if (m && m[1].includes(".") && m[2].includes(".")) return valjane(+m[1], +m[2]);
  }
  return null;
}
