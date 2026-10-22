"use client";

// Uvoz staza iz datoteka (GPX iz planinarskih aplikacija i satova, KML iz Google Earth / My Maps).
// Linije se pojednostavljuju (Douglas–Peucker) da dnevnik ostane malen i karta brza.

import { udaljenostM } from "./format";
import { db } from "./store";
import type { Staza } from "./types";

const BOJE = ["#ff5a5f", "#4ea1ff", "#b388ff", "#ffd54f", "#4dd0e1", "#ff8a65"];
const MAKS_TOCAKA = 3000;
const MAKS_STAZA = 30;

type Linija = [number, number][];

function pojednostavi(t: Linija, tol: number): Linija {
  if (t.length < 3) return t;
  const zadrzi = new Uint8Array(t.length);
  zadrzi[0] = zadrzi[t.length - 1] = 1;
  const stog: [number, number][] = [[0, t.length - 1]];
  while (stog.length) {
    const [a, b] = stog.pop()!;
    const [y1, x1] = t[a],
      [y2, x2] = t[b];
    const dx = x2 - x1,
      dy = y2 - y1,
      L = Math.hypot(dx, dy) || 1e-12;
    let maks = 0,
      i0 = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * t[i][1] - dx * t[i][0] + x2 * y1 - y2 * x1) / L;
      if (d > maks) {
        maks = d;
        i0 = i;
      }
    }
    if (maks > tol && i0 > 0) {
      zadrzi[i0] = 1;
      stog.push([a, i0], [i0, b]);
    }
  }
  return t.filter((_, i) => zadrzi[i]);
}

const zaokruzi = (l: Linija): Linija => l.map(([a, b]) => [Math.round(a * 1e5) / 1e5, Math.round(b * 1e5) / 1e5]);

function duljina(linije: Linija[]) {
  let m = 0;
  for (const l of linije) for (let i = 1; i < l.length; i++) m += udaljenostM({ lat: l[i - 1][0], lng: l[i - 1][1] }, { lat: l[i][0], lng: l[i][1] });
  return Math.round(m);
}

const tekstOznake = (el: Element | null | undefined, ime: string) => el?.getElementsByTagName(ime)[0]?.textContent?.trim() || "";

/** Parsira GPX ili KML; baca grešku s porukom za korisnika. */
export function procitajStazu(sadrzaj: string, imeDatoteke: string): Omit<Staza, "id" | "createdAt" | "boja"> {
  const dok = new DOMParser().parseFromString(sadrzaj, "application/xml");
  if (dok.getElementsByTagName("parsererror").length) throw new Error("Datoteka nije ispravan GPX ili KML");
  const korijen = dok.documentElement.localName.toLowerCase();
  const linije: Linija[] = [];
  const tocke: Staza["tocke"] = [];
  const broj = (v: string | null) => Number(v);

  if (korijen === "gpx") {
    for (const seg of Array.from(dok.getElementsByTagName("trkseg"))) {
      const l = Array.from(seg.getElementsByTagName("trkpt")).map((p) => [broj(p.getAttribute("lat")), broj(p.getAttribute("lon"))] as [number, number]);
      if (l.length > 1) linije.push(l);
    }
    for (const rte of Array.from(dok.getElementsByTagName("rte"))) {
      const l = Array.from(rte.getElementsByTagName("rtept")).map((p) => [broj(p.getAttribute("lat")), broj(p.getAttribute("lon"))] as [number, number]);
      if (l.length > 1) linije.push(l);
    }
    for (const w of Array.from(dok.getElementsByTagName("wpt")))
      tocke.push({ naziv: tekstOznake(w, "name") || "Točka", lat: broj(w.getAttribute("lat")), lng: broj(w.getAttribute("lon")) });
  } else if (korijen === "kml") {
    const koordinate = (s: string): Linija =>
      s
        .trim()
        .split(/\s+/)
        .map((t) => t.split(",").map(Number))
        .filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map((p) => [p[1], p[0]]);
    for (const pm of Array.from(dok.getElementsByTagName("Placemark"))) {
      for (const ls of Array.from(pm.getElementsByTagName("LineString"))) {
        const l = koordinate(tekstOznake(ls, "coordinates"));
        if (l.length > 1) linije.push(l);
      }
      // Rub poligona (npr. granica ucrtana u Google My Maps) prikazuje se kao zatvorena linija.
      for (const ob of Array.from(pm.getElementsByTagName("outerBoundaryIs"))) {
        const l = koordinate(tekstOznake(ob, "coordinates"));
        if (l.length > 2) linije.push(l);
      }
      for (const tr of Array.from(pm.getElementsByTagNameNS("*", "Track"))) {
        const l = Array.from(tr.getElementsByTagNameNS("*", "coord"))
          .map((c) => (c.textContent ?? "").trim().split(/\s+/).map(Number))
          .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
          .map((p) => [p[1], p[0]] as [number, number]);
        if (l.length > 1) linije.push(l);
      }
      const pt = pm.getElementsByTagName("Point")[0];
      if (pt) {
        const [k] = koordinate(tekstOznake(pt, "coordinates"));
        if (k) tocke.push({ naziv: tekstOznake(pm, "name") || "Točka", lat: k[0], lng: k[1] });
      }
    }
  } else {
    throw new Error("Podržane su datoteke GPX i KML");
  }

  const ispravne = linije
    .map((l) => l.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180))
    .filter((l) => l.length > 1);
  if (!ispravne.length && !tocke.length) throw new Error("U datoteci nema staza ni točaka");

  // Tolerancija raste dok sve linije zajedno ne stanu u MAKS_TOCAKA (~2 m pa naviše).
  let tol = 0.00002;
  let rez = ispravne.map((l) => pojednostavi(l, tol));
  while (rez.reduce((n, l) => n + l.length, 0) > MAKS_TOCAKA && tol < 0.01) {
    tol *= 2;
    rez = ispravne.map((l) => pojednostavi(l, tol));
  }
  const naziv =
    tekstOznake(dok.getElementsByTagName("metadata")[0], "name") ||
    tekstOznake(dok.getElementsByTagName("trk")[0], "name") ||
    tekstOznake(dok.getElementsByTagName("Document")[0], "name") ||
    imeDatoteke.replace(/\.(gpx|kml)$/i, "");
  return {
    naziv: naziv.slice(0, 80),
    linije: rez.map(zaokruzi),
    tocke: tocke.slice(0, 200).map((t) => ({ ...t, naziv: t.naziv.slice(0, 60) })),
    duljina: duljina(ispravne),
  };
}

export async function uveziStazu(datoteka: File): Promise<Staza> {
  if (/\.kmz$/i.test(datoteka.name)) throw new Error("KMZ nije podržan – u Google Earthu spremite kao KML");
  if (datoteka.size > 15 * 1024 * 1024) throw new Error("Datoteka je prevelika (najviše 15 MB)");
  const b = db.dohvati();
  if ((b.staze ?? []).length >= MAKS_STAZA) throw new Error(`Najviše ${MAKS_STAZA} staza – obrišite neku staru`);
  const s = procitajStazu(await datoteka.text(), datoteka.name);
  return db.dodaj("staze", { ...s, boja: BOJE[(b.staze ?? []).length % BOJE.length] });
}

/** Okvir svih linija i točaka staze (za približavanje karte). */
export function okvirStaze(s: Staza): [[number, number], [number, number]] | null {
  const sve = [...s.linije.flat(), ...(s.tocke ?? []).map((t) => [t.lat, t.lng] as [number, number])];
  if (!sve.length) return null;
  const lat = sve.map((p) => p[0]),
    lng = sve.map((p) => p[1]);
  return [
    [Math.min(...lat), Math.min(...lng)],
    [Math.max(...lat), Math.max(...lng)],
  ];
}
