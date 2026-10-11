// Astronomski izračuni (Sunce, Mjesec, solunarna razdoblja).
// Formule prema J. Meeus / "Astronomy Answers", u niskoj preciznosti
// dovoljnoj za planiranje lova (± 1–2 minute).

const PI = Math.PI;
const rad = PI / 180;
const DAN_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const e = rad * 23.4397;

const toJulian = (d: Date) => d.valueOf() / DAN_MS - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAN_MS);
const toDays = (d: Date) => toJulian(d) - J2000;

const rightAscension = (l: number, b: number) =>
  Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
const declination = (l: number, b: number) =>
  Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
const altitude = (H: number, phi: number, dec: number) =>
  Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const siderealTime = (d: number, lw: number) => rad * (280.16 + 360.9856235 * d) - lw;

function astroRefraction(h: number) {
  if (h < 0) h = 0;
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d);

function eclipticLongitude(M: number) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + rad * 102.9372 + PI;
}

function sunCoords(d: number) {
  const L = eclipticLongitude(solarMeanAnomaly(d));
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

const J0 = 0.0009;
const julianCycle = (d: number, lw: number) => Math.round(d - J0 - lw / (2 * PI));
const approxTransit = (Ht: number, lw: number, n: number) => J0 + (Ht + lw) / (2 * PI) + n;
const solarTransitJ = (ds: number, M: number, L: number) =>
  J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const hourAngle = (h: number, phi: number, d: number) =>
  Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

export interface SuncevaVremena {
  izlazak: Date | null;
  zalazak: Date | null;
  podne: Date;
  zora: Date | null;
  sumrak: Date | null;
  duljinaDana: number;
}

/** Vremena Sunca za kalendarski dan `datum` (lokalno). */
export function suncevaVremena(datum: Date, lat: number, lng: number): SuncevaVremena {
  const podneLok = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12);
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(podneLok);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const par = (kut: number): [Date | null, Date | null] => {
    const w = hourAngle(kut * rad, phi, dec);
    if (Number.isNaN(w)) return [null, null];
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    return [fromJulian(Jrise), fromJulian(Jset)];
  };

  const [izlazak, zalazak] = par(-0.833);
  const [zora, sumrak] = par(-6);
  return {
    izlazak,
    zalazak,
    podne: fromJulian(Jnoon),
    zora,
    sumrak,
    duljinaDana: izlazak && zalazak ? zalazak.getTime() - izlazak.getTime() : 0,
  };
}

function moonCoords(d: number) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * Math.sin(M);
  const b = rad * 5.128 * Math.sin(F);
  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: 385001 - 20905 * Math.cos(M),
  };
}

function visinaMjeseca(t: Date, lat: number, lng: number) {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(t);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  let h = altitude(H, phi, c.dec);
  h += astroRefraction(h);
  return h;
}

export interface Mjesec {
  osvjetljenje: number;
  faza: number;
  naziv: string;
}

export function mjesec(t: Date): Mjesec {
  const d = toDays(t);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra),
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra),
  );
  const faza = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / PI;
  return {
    osvjetljenje: (1 + Math.cos(inc)) / 2,
    faza,
    naziv: nazivFaze(faza),
  };
}

function nazivFaze(f: number) {
  if (f < 0.03 || f > 0.97) return "Mladi mjesec";
  if (f < 0.22) return "Rastući srp";
  if (f < 0.28) return "Prva četvrt";
  if (f < 0.47) return "Rastući mjesec";
  if (f < 0.53) return "Pun mjesec";
  if (f < 0.72) return "Opadajući mjesec";
  if (f < 0.78) return "Zadnja četvrt";
  return "Opadajući srp";
}

export interface MjesecevaVremena {
  izlazak: Date | null;
  zalazak: Date | null;
  gornjaKulminacija: Date | null;
  donjaKulminacija: Date | null;
}

export function mjesecevaVremena(datum: Date, lat: number, lng: number): MjesecevaVremena {
  const pocetak = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate()).getTime();
  const korak = 5 * 60 * 1000;
  const h0 = 0.133 * rad;
  let izlazak: Date | null = null;
  let zalazak: Date | null = null;
  let maks = -Infinity;
  let min = Infinity;
  let tMaks = 0;
  let tMin = 0;
  let prije = visinaMjeseca(new Date(pocetak), lat, lng) - h0;
  for (let t = pocetak + korak; t <= pocetak + DAN_MS; t += korak) {
    const h = visinaMjeseca(new Date(t), lat, lng) - h0;
    if (prije < 0 && h >= 0 && !izlazak) izlazak = new Date(t - korak * (h / (h - prije)));
    if (prije >= 0 && h < 0 && !zalazak) zalazak = new Date(t - korak * (h / (h - prije)));
    if (h > maks) {
      maks = h;
      tMaks = t;
    }
    if (h < min) {
      min = h;
      tMin = t;
    }
    prije = h;
  }
  const rub = (t: number) => t - pocetak > korak && pocetak + DAN_MS - t > korak;
  return {
    izlazak,
    zalazak,
    gornjaKulminacija: rub(tMaks) ? new Date(tMaks) : null,
    donjaKulminacija: rub(tMin) ? new Date(tMin) : null,
  };
}

export interface Razdoblje {
  vrsta: "glavno" | "sporedno";
  od: Date;
  do: Date;
  povod: string;
}

export interface Solunar {
  razdoblja: Razdoblje[];
  ocjena: number;
  opis: string;
}

/** Solunarna razdoblja (teorija J. A. Knighta) i procjena aktivnosti divljači 1–5. */
export function solunar(datum: Date, lat: number, lng: number): Solunar {
  const mv = mjesecevaVremena(datum, lat, lng);
  const sv = suncevaVremena(datum, lat, lng);
  const m = mjesec(new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12));
  const r: Razdoblje[] = [];
  const oko = (t: Date, min: number) => [
    new Date(t.getTime() - min * 60000),
    new Date(t.getTime() + min * 60000),
  ];
  if (mv.gornjaKulminacija) {
    const [od, d] = oko(mv.gornjaKulminacija, 60);
    r.push({ vrsta: "glavno", od, do: d, povod: "Mjesec u kulminaciji" });
  }
  if (mv.donjaKulminacija) {
    const [od, d] = oko(mv.donjaKulminacija, 60);
    r.push({ vrsta: "glavno", od, do: d, povod: "Mjesec ispod obzora" });
  }
  if (mv.izlazak) {
    const [od, d] = oko(mv.izlazak, 30);
    r.push({ vrsta: "sporedno", od, do: d, povod: "Izlazak Mjeseca" });
  }
  if (mv.zalazak) {
    const [od, d] = oko(mv.zalazak, 30);
    r.push({ vrsta: "sporedno", od, do: d, povod: "Zalazak Mjeseca" });
  }
  r.sort((a, b) => a.od.getTime() - b.od.getTime());

  // Bodovanje: blizina mladog/punog mjeseca + preklapanje sa sumrakom/zorom.
  const udaljenostOdFaze = Math.min(
    Math.abs(m.faza - 0),
    Math.abs(m.faza - 0.5),
    Math.abs(m.faza - 1),
  );
  let bodovi = 1 + (1 - udaljenostOdFaze / 0.25) * 2.2;
  const kriticna = [sv.izlazak, sv.zalazak].filter(Boolean) as Date[];
  for (const raz of r) {
    for (const k of kriticna) {
      const dist = Math.min(
        Math.abs(raz.od.getTime() - k.getTime()),
        Math.abs(raz.do.getTime() - k.getTime()),
      );
      const unutra = k >= raz.od && k <= raz.do;
      if (unutra || dist < 45 * 60000) bodovi += raz.vrsta === "glavno" ? 0.9 : 0.5;
    }
  }
  const ocjena = Math.max(1, Math.min(5, Math.round(bodovi)));
  const opisi = ["", "Slaba aktivnost", "Ispodprosječna", "Prosječna", "Dobra aktivnost", "Izvrsna aktivnost"];
  return { razdoblja: r, ocjena, opis: opisi[ocjena] };
}

/** Lovna godina u RH traje od 1. travnja do 31. ožujka. */
export function lovnaGodina(d: Date = new Date()) {
  const g = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return {
    oznaka: `${g}./${String(g + 1).slice(2)}.`,
    od: new Date(g, 3, 1),
    do: new Date(g + 1, 2, 31, 23, 59, 59),
    pocetna: g,
  };
}
