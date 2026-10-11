"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";

// Šumske ceste, vlake i staze iz OpenStreetMapa (Overpass API), crtane preko bilo koje podloge.

interface Put {
  id: number;
  vrsta: "track" | "path" | "bridleway" | "footway" | "unclassified" | "service";
  stupanj?: string;
  naziv?: string;
  tocke: [number, number][];
}

const POSLUZITELJI = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const MIN_ZOOM = 12;
const predmemorija = new Map<string, Put[]>();

/** Područje zaokruženo na mrežu od 0,05° da se isti dijelovi ne dohvaćaju ponovno. */
function celije(j: number, z: number, i: number, s: number) {
  const k = 0.05;
  const r: string[] = [];
  for (let la = Math.floor(j / k) * k; la < s; la += k)
    for (let lo = Math.floor(z / k) * k; lo < i; lo += k) r.push(`${la.toFixed(2)},${lo.toFixed(2)}`);
  return r;
}

async function dohvatiCeliju(kljuc: string, signal: AbortSignal): Promise<Put[]> {
  const pr = predmemorija.get(kljuc);
  if (pr) return pr;
  const [la, lo] = kljuc.split(",").map(Number);
  const bbox = `${la},${lo},${(la + 0.05).toFixed(2)},${(lo + 0.05).toFixed(2)}`;
  // Šumske i poljske ceste, vlake, staze te makadamske/servisne ceste (bez prilaza i parkirališta).
  const upit = `[out:json][timeout:25];(way["highway"~"^(track|path|bridleway|footway|unclassified)$"](${bbox});way["highway"="service"][!"service"](${bbox}););out geom;`;
  let zadnjaGreska: unknown;
  for (const url of POSLUZITELJI) {
    try {
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(upit), signal });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as {
        elements: { id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] }[];
      };
      const puti: Put[] = j.elements
        .filter((e) => e.geometry && e.geometry.length > 1)
        .map((e) => ({
          id: e.id,
          vrsta: (e.tags?.highway ?? "path") as Put["vrsta"],
          stupanj: e.tags?.tracktype,
          naziv: e.tags?.name,
          tocke: e.geometry!.map((g) => [g.lat, g.lon] as [number, number]),
        }));
      predmemorija.set(kljuc, puti);
      return puti;
    } catch (e) {
      if (signal.aborted) throw e;
      zadnjaGreska = e;
    }
  }
  throw zadnjaGreska;
}

/** Stil kao u navigacijskim kartama: tamni obrub + svijetla linija; isprekidano za lošije vlake. */
function stil(p: Put, z: number) {
  const k = z >= 16 ? 1.5 : z >= 14 ? 1.15 : 1;
  if (p.vrsta === "unclassified" || p.vrsta === "service") {
    return { linija: { color: "#fff4d6", weight: 3.2 * k }, obrub: { color: "#2a2116", weight: 5.6 * k, opacity: 0.75 } };
  }
  if (p.vrsta === "track") {
    // grade1 = tvrda šumska cesta … grade5 = jedva vidljiva vlaka
    const g = Number(p.stupanj?.replace("grade", "")) || 3;
    const crtice = g <= 2 ? undefined : g === 3 ? `${8 * k} ${5 * k}` : `${5 * k} ${5 * k}`;
    return {
      linija: { color: g <= 2 ? "#ffd27a" : "#f5b84a", weight: (g <= 2 ? 3 : 2.4) * k, dashArray: crtice },
      obrub: { color: "#2a1c0c", weight: (g <= 2 ? 5.4 : 4.6) * k, opacity: 0.7 },
    };
  }
  return { linija: { color: "#ffffff", weight: 1.8 * k, dashArray: `${2 * k} ${4 * k}` }, obrub: { color: "#1c1c1c", weight: 3.6 * k, opacity: 0.45 } };
}

export default function SumskiPutevi({ onStanje }: { onStanje?: (s: "malo" | "ucitava" | "ok" | "greska") => void }) {
  const map = useMap();
  const [puti, setPuti] = useState<Put[]>([]);
  const [zoom, setZoom] = useState(() => map.getZoom());
  // Canvas je mnogo brži od SVG-a za tisuće linija.
  const platno = useMemo(() => L.canvas({ padding: 0.5, tolerance: 6 }), []);
  const kontrola = useRef<AbortController | null>(null);
  const odgoda = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ucitaj = () => {
    if (odgoda.current) clearTimeout(odgoda.current);
    odgoda.current = setTimeout(async () => {
      if (map.getZoom() < MIN_ZOOM) {
        onStanje?.("malo");
        return;
      }
      const b = map.getBounds();
      const kljucevi = celije(b.getSouth(), b.getWest(), b.getEast(), b.getNorth()).slice(0, 12);
      kontrola.current?.abort();
      const k = new AbortController();
      kontrola.current = k;
      onStanje?.("ucitava");
      try {
        const rez: Put[] = [];
        const vidjeno = new Set<number>();
        for (const kl of kljucevi) {
          for (const p of await dohvatiCeliju(kl, k.signal)) {
            if (!vidjeno.has(p.id)) {
              vidjeno.add(p.id);
              rez.push(p);
            }
          }
          if (!k.signal.aborted) setPuti([...rez]);
        }
        onStanje?.("ok");
      } catch {
        if (!k.signal.aborted) onStanje?.("greska");
      }
    }, 500);
  };

  useMapEvents({ moveend: ucitaj, zoomend: () => setZoom(map.getZoom()) });

  useEffect(() => {
    ucitaj();
    return () => {
      kontrola.current?.abort();
      if (odgoda.current) clearTimeout(odgoda.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Najprije svi obrubi, zatim sve linije – tako se raskrižja ne prekrivaju obrubima.
  const redoslijed = [...puti].sort((a, b) => rang(a) - rang(b));
  return (
    <>
      {redoslijed.map((p) => (
        <Polyline
          key={`o${p.id}`}
          positions={p.tocke}
          pathOptions={{ ...stil(p, zoom).obrub, renderer: platno, lineCap: "round", lineJoin: "round" }}
          interactive={false}
        />
      ))}
      {redoslijed.map((p) => (
        <Polyline
          key={`l${p.id}`}
          positions={p.tocke}
          pathOptions={{ ...stil(p, zoom).linija, renderer: platno, lineCap: "round", lineJoin: "round", opacity: 1 }}
          interactive={!!p.naziv}
        >
          {p.naziv && <Tooltip sticky>{p.naziv}</Tooltip>}
        </Polyline>
      ))}
    </>
  );
}

function rang(p: Put) {
  return p.vrsta === "path" || p.vrsta === "footway" || p.vrsta === "bridleway" ? 0 : p.vrsta === "track" ? 1 : 2;
}
