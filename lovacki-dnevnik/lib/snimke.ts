"use client";

// Esri satelitske snimke izvan gradova često postoje samo do zooma 17 ili 18. Kad karta zatraži
// veći zoom, poslužitelj vrati sivu pločicu „Map data not yet available” (a ne grešku), pa se
// karta ne može sama snaći. Zato se za središte karte pita Esrijeva karta dostupnosti (tilemap)
// i snimke se iznad zadnjeg dostupnog zooma samo uvećavaju.

import { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";

const SNIMKE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
/** Dok se ne zna za ovo mjesto: 18 je dostupno gotovo svugdje u Hrvatskoj. */
export const ZADANI_ZOOM_SNIMKI = 18;
const NAJVECI = 19;
const NAJMANJI = 13;

const poznato = new Map<string, boolean>();

function plocica(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return { x, y };
}

async function ima(lat: number, lng: number, z: number) {
  const { x, y } = plocica(lat, lng, z);
  const k = `${z}/${y}/${x}`;
  const p = poznato.get(k);
  if (p != null) return p;
  const r = await fetch(`${SNIMKE}/tilemap/${k}/1/1`);
  if (!r.ok) throw new Error("tilemap");
  const j = (await r.json()) as { data?: number[] };
  const da = j.data?.[0] === 1;
  poznato.set(k, da);
  return da;
}

/** Najveći zoom do kojeg za to mjesto postoje Esri snimke. */
export async function najveciZoomSnimki(lat: number, lng: number) {
  for (let z = NAJVECI; z >= NAJMANJI; z--) if (await ima(lat, lng, z)) return z;
  return NAJMANJI;
}

/** Prati središte karte i vraća najveći zoom snimki za to mjesto (unutar <MapContainer>). */
export function useZoomSnimki(ukljuceno: boolean) {
  const [zoom, setZoom] = useState(ZADANI_ZOOM_SNIMKI);
  const karta = useMapEvents({
    moveend: () => setSredina(polozaj()),
  });
  const polozaj = () => {
    const c = karta.getCenter();
    return { lat: c.lat, lng: c.lng, z: karta.getZoom() };
  };
  const [sredina, setSredina] = useState(polozaj);
  useEffect(() => {
    // Na manjem zoomu snimke postoje svugdje – nema potrebe pitati.
    if (!ukljuceno || !sredina || sredina.z < 15) return;
    let ziv = true;
    najveciZoomSnimki(sredina.lat, sredina.lng)
      .then((z) => ziv && setZoom(z))
      .catch(() => {});
    return () => {
      ziv = false;
    };
  }, [ukljuceno, sredina]);
  return zoom;
}
