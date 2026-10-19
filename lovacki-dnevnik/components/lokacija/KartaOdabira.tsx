"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import Ikona from "../Ikona";
import { cx, obavijest, opruga } from "../ui";
import { useZoomSnimki } from "@/lib/snimke";
import type { Tocka2D } from "@/lib/types";

/** Udaljenost u metrima (dovoljno točno za par kilometara). */
function udaljenost(a: Tocka2D, b: Tocka2D) {
  const x = (b.lng - a.lng) * 111320 * Math.cos(((a.lat + b.lat) * Math.PI) / 360);
  const y = (b.lat - a.lat) * 110540;
  return Math.hypot(x, y);
}

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
const PODLOGE = {
  hibrid: [
    { url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attr: "Esri, Maxar, Earthstar Geographics", retina: true },
    { url: `${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`, attr: "Esri", retina: false },
    { url: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, attr: "Esri", retina: false },
  ],
  topo: [{ url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)", retina: false }],
} as const;

function Pracenje({ onPomak, onPocetak }: { onPomak: (c: Tocka2D) => void; onPocetak: () => void }) {
  useMapEvents({
    // Dodir na karti dovede pribadaču na to mjesto – ne treba vući kartu.
    click: (e) => e.target.panTo(e.latlng),
    movestart: onPocetak,
    moveend: (e) => {
      const c = e.target.getCenter();
      onPomak({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function Prelet({ cilj }: { cilj: (Tocka2D & { k: number }) | null }) {
  const map = useMap();
  useEffect(() => {
    if (cilj) map.flyTo([cilj.lat, cilj.lng], Math.max(map.getZoom(), 16), { duration: 0.9 });
  }, [cilj, map]);
  return null;
}

/** Karta preko cijelog zaslona s pribadačom u sredini – korisnik pomiče kartu ispod pribadače. */
export default function KartaOdabira({
  pocetak,
  naslov,
  potvrdi,
  odustani,
  mojaLokacija,
}: {
  pocetak: Tocka2D;
  naslov: string;
  potvrdi: (t: Tocka2D) => void;
  odustani: () => void;
  /** Karta se odmah prebaci na moju lokaciju ako je unutar ovoliko metara od početka (Infinity = uvijek). */
  mojaLokacija?: number;
}) {
  const [centar, setCentar] = useState<Tocka2D>(pocetak);
  const [mice, setMice] = useState(false);
  const [podloga, setPodloga] = useState<keyof typeof PODLOGE>("hibrid");
  const [cilj, setCilj] = useState<(Tocka2D & { k: number }) | null>(null);
  const [trazim, setTrazim] = useState(false);

  const gps = () => {
    if (!navigator.geolocation) return obavijest("Lokacija nije podržana", "greska");
    setTrazim(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setTrazim(false);
        setCilj({ lat: p.coords.latitude, lng: p.coords.longitude, k: Date.now() });
      },
      () => {
        setTrazim(false);
        obavijest("Lokacija nije dostupna", "greska");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Nova točka: karta se otvara tamo gdje stojite (ako ste u lovištu), ne treba je tražiti.
  useEffect(() => {
    if (mojaLokacija == null || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const t = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (udaljenost(t, pocetak) <= mojaLokacija) setCilj({ ...t, k: Date.now() });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="fixed inset-0 z-[2700] bg-pozadina"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={opruga}
    >
      <MapContainer center={[pocetak.lat, pocetak.lng]} zoom={15} maxZoom={20} zoomControl={false} className="karta-odabira h-full w-full">
        <Podloga slojevi={PODLOGE[podloga]} topo={podloga === "topo"} />
        <Pracenje onPomak={(c) => (setCentar(c), setMice(false))} onPocetak={() => setMice(true)} />
        <Prelet cilj={cilj} />
      </MapContainer>

      {/* Pribadača u sredini (vrh pribadače je točno u središtu karte) */}
      <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center">
        <div className="relative">
          <motion.div animate={{ y: mice ? -14 : 0 }} transition={opruga} className="absolute -top-[46px] -left-[18px]">
            <svg width="36" height="46" viewBox="0 0 36 46" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.5))" }}>
              <path d="M18 45s15-14.5 15-26A15 15 0 0 0 3 19c0 11.5 15 26 15 26z" fill="#e8a947" stroke="#fff" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="5.5" fill="#17130a" />
            </svg>
          </motion.div>
          <motion.span
            animate={{ scale: mice ? 0.6 : 1, opacity: mice ? 0.4 : 0.8 }}
            className="absolute -top-[4px] -left-[9px] h-2 w-[18px] rounded-full bg-black/60 blur-[2px]"
          />
        </div>
      </div>

      {/* Gornja traka */}
      <div className="absolute inset-x-0 top-0 z-[600] flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          onClick={odustani}
          aria-label="Odustani"
          className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#0d130e]/85 text-white backdrop-blur-xl"
        >
          <Ikona ime="x" />
        </button>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0d130e]/85 px-4 py-2.5 text-white backdrop-blur-xl">
          <div className="truncate text-[15px] font-semibold">{naslov}</div>
          <div className="text-[12px] text-white/60">Dodirnite mjesto na karti ili je pomaknite</div>
        </div>
      </div>

      {/* Desni gumbi */}
      <div className="absolute top-[calc(max(0.75rem,env(safe-area-inset-top))+4.25rem)] right-3 z-[600] flex flex-col gap-2">
        <button
          onClick={() => setPodloga((p) => (p === "hibrid" ? "topo" : "hibrid"))}
          aria-label="Promijeni podlogu"
          className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-[#0d130e]/85 text-white backdrop-blur-xl"
        >
          <Ikona ime="slojevi" />
        </button>
        <button
          onClick={gps}
          aria-label="Moja lokacija"
          className={cx(
            "grid size-12 place-items-center rounded-2xl border border-white/10 backdrop-blur-xl",
            trazim ? "bg-[#e8a947] text-[#17130a]" : "bg-[#0d130e]/85 text-white",
          )}
        >
          <Ikona ime="gps" />
        </button>
      </div>

      {/* Donja ploča */}
      <div className="absolute inset-x-0 bottom-0 z-[600] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#0d130e]/90 p-3 text-white shadow-jaka backdrop-blur-xl">
          <div className="mb-2.5 flex items-center gap-2 px-1">
            <Ikona ime="lokacija" velicina={16} className="text-[#e8a947]" />
            <span className="brojke text-[14px]">
              {centar.lat.toFixed(5)}°, {centar.lng.toFixed(5)}°
            </span>
            <span className="ml-auto text-[12px] text-white/50">{podloga === "hibrid" ? "Satelit" : "Topo"}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => potvrdi(centar)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8a947] text-[15px] font-semibold text-[#17130a]"
          >
            <Ikona ime="kvacica" velicina={18} debljina={2.4} /> Odaberi ovu lokaciju
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function Podloga({ slojevi, topo }: { slojevi: readonly { url: string; attr: string; retina: boolean }[]; topo: boolean }) {
  const zoomSnimki = useZoomSnimki(!topo);
  return (
    <>
      {slojevi.map((s) => {
        const snimke = s.url.includes("World_Imagery");
        return (
          <TileLayer
            key={snimke ? `${s.url}-${zoomSnimki}` : s.url}
            url={s.url}
            attribution={s.attr}
            detectRetina={s.retina}
            // Retina: Leaflet traži zoom više od maxNativeZoom, pa jedan manje.
            maxNativeZoom={(topo ? 17 : snimke ? zoomSnimki : 19) - (s.retina && L.Browser.retina ? 1 : 0)}
            maxZoom={20 + (s.retina && L.Browser.retina ? 1 : 0)}
          />
        );
      })}
    </>
  );
}
