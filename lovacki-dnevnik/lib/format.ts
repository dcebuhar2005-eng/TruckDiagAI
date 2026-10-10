const MJESECI = [
  "siječnja", "veljače", "ožujka", "travnja", "svibnja", "lipnja",
  "srpnja", "kolovoza", "rujna", "listopada", "studenoga", "prosinca",
];
export const MJESECI_KRATKO = [
  "sij", "velj", "ožu", "tra", "svi", "lip", "srp", "kol", "ruj", "lis", "stu", "pro",
];
const DANI = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "četvrtak", "petak", "subota"];

export const dvije = (n: number) => String(n).padStart(2, "0");

export function isoDatum(d: Date = new Date()) {
  return `${d.getFullYear()}-${dvije(d.getMonth() + 1)}-${dvije(d.getDate())}`;
}

export function isoVrijeme(d: Date = new Date()) {
  return `${dvije(d.getHours())}:${dvije(d.getMinutes())}`;
}

export function izIso(datum: string, vrijeme = "12:00") {
  const [g, m, d] = datum.split("-").map(Number);
  const [h, min] = vrijeme.split(":").map(Number);
  return new Date(g, m - 1, d, h || 0, min || 0);
}

export function datumDugi(datum: string | Date) {
  const d = typeof datum === "string" ? izIso(datum) : datum;
  return `${d.getDate()}. ${MJESECI[d.getMonth()]} ${d.getFullYear()}.`;
}

export function datumKratki(datum: string | Date) {
  const d = typeof datum === "string" ? izIso(datum) : datum;
  return `${d.getDate()}. ${MJESECI_KRATKO[d.getMonth()]}`;
}

export function danUTjednu(d: Date) {
  return DANI[d.getDay()];
}

export function sat(d?: Date | null) {
  if (!d) return "–";
  return `${dvije(d.getHours())}:${dvije(d.getMinutes())}`;
}

export function trajanje(ms: number) {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  return h ? `${h} h ${dvije(min % 60)} min` : `${min} min`;
}

export function trajanjeIzlaska(od: string, doV?: string) {
  if (!doV) return null;
  const [h1, m1] = od.split(":").map(Number);
  const [h2, m2] = doV.split(":").map(Number);
  let min = h2 * 60 + m2 - (h1 * 60 + m1);
  if (min < 0) min += 24 * 60;
  return min;
}

export function danaDo(datum: string) {
  const danas = izIso(isoDatum(), "00:00").getTime();
  return Math.round((izIso(datum, "00:00").getTime() - danas) / 86400000);
}

export function broj(n: number, dec = 0) {
  return n.toLocaleString("hr-HR", { maximumFractionDigits: dec, minimumFractionDigits: dec });
}

/** Hrvatska množina: 1 izlazak, 2 izlaska, 5 izlazaka. */
export function mnozina(n: number, jedan: string, dva: string, pet: string) {
  const z = n % 10;
  const zz = n % 100;
  if (z === 1 && zz !== 11) return jedan;
  if (z >= 2 && z <= 4 && (zz < 12 || zz > 14)) return dva;
  return pet;
}

export function udaljenostM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function povrsinaHa(tocke: [number, number][]) {
  if (tocke.length < 3) return 0;
  const R = 6371000;
  const r = Math.PI / 180;
  let s = 0;
  for (let i = 0; i < tocke.length; i++) {
    const [lat1, lng1] = tocke[i];
    const [lat2, lng2] = tocke[(i + 1) % tocke.length];
    s += (lng2 - lng1) * r * (2 + Math.sin(lat1 * r) + Math.sin(lat2 * r));
  }
  return Math.abs((s * R * R) / 2) / 10000;
}

export function metri(m: number) {
  return m >= 1000 ? `${broj(m / 1000, 2)} km` : `${broj(m)} m`;
}
