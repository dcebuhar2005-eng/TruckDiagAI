"use client";

import { useEffect, useRef, useState } from "react";
import { Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";

// Šumske ceste, vlake i staze iz OpenStreetMapa (Overpass API), crtane preko bilo koje podloge.

interface Put {
  id: number;
  vrsta: "track" | "path" | "bridleway" | "footway";
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
  const upit = `[out:json][timeout:25];way["highway"~"^(track|path|bridleway|footway)$"](${bbox});out geom;`;
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

function stil(p: Put) {
  if (p.vrsta === "track") {
    // grade1 = tvrda/asfaltirana šumska cesta … grade5 = jedva vidljiva vlaka
    const g = Number(p.stupanj?.replace("grade", "")) || 3;
    return { color: "#ffcf5a", weight: g <= 2 ? 4 : 3, dashArray: g <= 2 ? undefined : g === 3 ? "10 6" : "6 6", opacity: 0.95 };
  }
  return { color: "#ffffff", weight: 2, dashArray: "2 6", opacity: 0.9 };
}

export default function SumskiPutevi({ onStanje }: { onStanje?: (s: "malo" | "ucitava" | "ok" | "greska") => void }) {
  const map = useMap();
  const [puti, setPuti] = useState<Put[]>([]);
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

  useMapEvents({ moveend: ucitaj });

  useEffect(() => {
    ucitaj();
    return () => {
      kontrola.current?.abort();
      if (odgoda.current) clearTimeout(odgoda.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {puti.map((p) => (
        <Polyline key={p.id} positions={p.tocke} pathOptions={stil(p)} interactive={!!p.naziv}>
          {p.naziv && <Tooltip sticky>{p.naziv}</Tooltip>}
        </Polyline>
      ))}
    </>
  );
}
