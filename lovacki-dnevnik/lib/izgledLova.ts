// „Kad u lov?” – ocjena jutra i večeri za sljedeće dane iz satne prognoze za lovište.
// Gleda vjetar (miris i buka), udare, kišu i oluju, tlak, razvedravanje nakon kiše i Mjesec.
// Ocjena je savjet, ne pravilo: lovac zna svoje lovište, a ovo mu kaže gdje su izgledi najbolji.

import { mjesec, suncevaVremena } from "./astro";
import type { SatnaPrognoza } from "./vrijeme";

export interface Termin {
  ocjena: number;
  oznaka: "Odlično" | "Dobro" | "Osrednje" | "Loše";
  razlozi: string[];
  vjetarSmjer: number;
  vjetarBrzina: number;
  udari: number;
  temperatura: number;
  oborine: number;
  od: Date;
  do: Date;
}

export interface DanLova {
  datum: Date;
  jutro: Termin | null;
  vecer: Termin | null;
}

const KISA = (kod: number) => (kod >= 51 && kod <= 67) || (kod >= 80 && kod <= 82);
const OLUJA = (kod: number) => kod >= 95;

const oznaka = (o: number): Termin["oznaka"] => (o >= 75 ? "Odlično" : o >= 60 ? "Dobro" : o >= 45 ? "Osrednje" : "Loše");

function ocijeni(satno: SatnaPrognoza[], od: Date, doo: Date, jutro: boolean, osvjetljenje: number): Termin | null {
  const u = satno.filter((s) => s.vrijeme >= od && s.vrijeme <= doo);
  if (!u.length) return null;
  const prije = satno.filter((s) => s.vrijeme < od && s.vrijeme.getTime() >= od.getTime() - 12 * 3600e3);
  const pros = (f: (s: SatnaPrognoza) => number) => u.reduce((a, s) => a + f(s), 0) / u.length;
  const brzina = pros((s) => s.vjetarBrzina);
  const udari = Math.max(...u.map((s) => s.udari));
  const oborine = Math.max(...u.map((s) => s.oborinePosto));
  // Prevladavajući smjer kao prosjek vektora (da 350° i 10° ne daju 180°).
  const x = pros((s) => Math.sin((s.vjetarSmjer * Math.PI) / 180));
  const y = pros((s) => Math.cos((s.vjetarSmjer * Math.PI) / 180));
  const smjer = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;

  let o = 62;
  const r: string[] = [];
  const dodaj = (bodovi: number, razlog: string) => {
    o += bodovi;
    r.push(razlog);
  };
  if (brzina < 4) dodaj(-8, "Gotovo bez vjetra – miris se kovitla");
  else if (brzina <= 15) dodaj(10, "Stalan slab vjetar – dobro nosi miris");
  else if (brzina <= 25) dodaj(-12, "Jači vjetar – divljač je opreznija");
  else dodaj(-32, "Jak vjetar – divljač se zavlači u zaklon");
  if (udari >= 60) dodaj(-20, `Olujni udari do ${Math.round(udari)} km/h`);
  else if (udari >= 45) dodaj(-10, `Jaki udari do ${Math.round(udari)} km/h`);

  if (u.some((s) => OLUJA(s.kod))) dodaj(-35, "Grmljavina");
  else if (oborine >= 70) dodaj(-25, "Kiša gotovo sigurna");
  else if (oborine >= 40) dodaj(-12, "Moguća kiša");

  const kisaPrije = prije.some((s) => KISA(s.kod) || s.oborinePosto >= 60);
  if (kisaPrije && oborine < 30) dodaj(12, "Razvedravanje nakon kiše – divljač izlazi hraniti se");

  if (prije.length) {
    const dTlak = u[u.length - 1].tlak - prije[0].tlak;
    if (dTlak > 2) dodaj(6, "Tlak raste – vrijeme se smiruje");
    else if (dTlak < -3) dodaj(-4, "Tlak naglo pada – dolazi promjena");
  }

  if (osvjetljenje > 0.85) {
    if (jutro) dodaj(-8, "Pun mjesec – divljač se hranila noću, jutro slabije");
    else dodaj(4, "Pun mjesec – divljač ranije izlazi u sumrak");
  } else if (osvjetljenje < 0.15 && jutro) dodaj(5, "Tamna noć – divljač kasnije odlazi s hranilišta");

  const ocjena = Math.max(0, Math.min(100, Math.round(o)));
  return {
    ocjena,
    oznaka: oznaka(ocjena),
    razlozi: r,
    vjetarSmjer: smjer,
    vjetarBrzina: brzina,
    udari,
    temperatura: pros((s) => s.temperatura),
    oborine,
    od,
    do: doo,
  };
}

/** Jutro: sat prije izlaska do dva sata nakon. Večer: dva sata prije zalaska do sat nakon. */
export function izgledLova(satno: SatnaPrognoza[], lat: number, lng: number, dana = 8): DanLova[] {
  const danas = new Date();
  danas.setHours(12, 0, 0, 0);
  const sad = Date.now();
  const rez: DanLova[] = [];
  for (let k = 0; k < dana; k++) {
    const d = new Date(danas.getTime() + k * 86400e3);
    const sv = suncevaVremena(d, lat, lng);
    if (!sv.izlazak || !sv.zalazak) continue;
    const osvj = mjesec(new Date(d.getTime() + 12 * 3600e3)).osvjetljenje;
    const jOd = new Date(sv.izlazak.getTime() - 3600e3),
      jDo = new Date(sv.izlazak.getTime() + 2 * 3600e3);
    const vOd = new Date(sv.zalazak.getTime() - 2 * 3600e3),
      vDo = new Date(sv.zalazak.getTime() + 3600e3);
    rez.push({
      datum: d,
      jutro: jDo.getTime() > sad ? ocijeni(satno, jOd, jDo, true, osvj) : null,
      vecer: vDo.getTime() > sad ? ocijeni(satno, vOd, vDo, false, osvj) : null,
    });
  }
  return rez.filter((x) => x.jutro || x.vecer);
}

/** Najbolji termin u razdoblju (za istaknuti savjet). */
export function najboljiTermin(dani: DanLova[]) {
  let naj: { dan: DanLova; dio: "jutro" | "vecer"; t: Termin } | null = null;
  for (const dan of dani)
    for (const dio of ["jutro", "vecer"] as const) {
      const t = dan[dio];
      if (t && (!naj || t.ocjena > naj.t.ocjena)) naj = { dan, dio, t };
    }
  return naj;
}
