"use client";

import L from "leaflet";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { otvori } from "@/components/urednici/kontroler";
import { Gumb, cx, obavijest, opruga } from "@/components/ui";
import { TIPOVI_TOCAKA, bojaVrste, nazivSpola } from "@/lib/katalog";
import { datumKratki, metri, povrsinaHa, sat, udaljenostM } from "@/lib/format";
import { db, useBaza } from "@/lib/store";
import type { Baza, Tocka } from "@/lib/types";
import { smjerVjetra, usePrognoza } from "@/lib/vrijeme";

const PODLOGE = {
  satelit: {
    naziv: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  topo: {
    naziv: "Topografska",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: "© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
  },
  karta: {
    naziv: "Karta",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "© OpenStreetMap",
    maxZoom: 19,
  },
} as const;
type Podloga = keyof typeof PODLOGE;

type Nacin = "pregled" | "tocka" | "granica" | "mjerenje";
type Odabir = { tip: "tocka"; id: string } | { tip: "odstrel"; id: string } | { tip: "loviste"; id: string } | null;

function ikonaTocke(t: Tocka, odabrana: boolean) {
  const info = TIPOVI_TOCAKA[t.tip];
  return L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    html: `<div class="oznaka-karte" style="position:relative;width:34px;height:42px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))${odabrana ? ";transform:scale(1.18) translateY(-4px)" : ""}">
      <svg width="34" height="42" viewBox="0 0 34 42"><path d="M17 41s14-13.5 14-24A14 14 0 0 0 3 17c0 10.5 14 24 14 24z" fill="${info.boja}" stroke="${odabrana ? "#fff" : "rgba(0,0,0,.35)"}" stroke-width="${odabrana ? 2.5 : 1}"/></svg>
      <span style="position:absolute;top:7px;left:0;right:0;text-align:center;font:700 12px/20px system-ui;color:rgba(0,0,0,.78)">${info.slovo}</span>
    </div>`,
  });
}

function ikonaOdstrela(boja: string) {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div class="oznaka-karte" style="width:22px;height:22px;display:grid;place-items:center;border-radius:999px;background:${boja};border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.45)">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg></div>`,
  });
}

const ikonaVrha = L.divIcon({
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<div style="width:14px;height:14px;border-radius:99px;background:#fff;border:3px solid #e8a947;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>`,
});

/** Stožac mirisa: od točke niz vjetar, duljine `duljina` m i širine ±`kut`°. */
function stozac(lat: number, lng: number, smjerIz: number, duljina = 350, kut = 22): [number, number][] {
  const prema = (smjerIz + 180) % 360;
  const tocke: [number, number][] = [[lat, lng]];
  for (let a = -kut; a <= kut; a += 4) {
    const t = ((prema + a) * Math.PI) / 180;
    tocke.push([
      lat + (duljina * Math.cos(t)) / 111320,
      lng + (duljina * Math.sin(t)) / (111320 * Math.cos((lat * Math.PI) / 180)),
    ]);
  }
  return tocke;
}

function Dogadaji({ onKlik, onPomak }: { onKlik: (ll: L.LatLng) => void; onPomak: (c: L.LatLng) => void }) {
  useMapEvents({
    click: (e) => onKlik(e.latlng),
    moveend: (e) => onPomak(e.target.getCenter()),
  });
  return null;
}

function Upravljac({ cilj }: { cilj: { lat: number; lng: number; zoom?: number; k: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (cilj) map.flyTo([cilj.lat, cilj.lng], cilj.zoom ?? Math.max(map.getZoom(), 15), { duration: 1.1 });
  }, [cilj, map]);
  return null;
}

function GraniceNaPocetku({ baza }: { baza: Baza }) {
  const map = useMap();
  const gotovo = useRef(false);
  useEffect(() => {
    if (gotovo.current) return;
    gotovo.current = true;
    const sve: [number, number][] = [
      ...baza.lovista.flatMap((l) => l.granica ?? []),
      ...baza.tocke.map((t) => [t.lat, t.lng] as [number, number]),
    ];
    if (sve.length > 1) map.fitBounds(L.latLngBounds(sve), { padding: [40, 40], maxZoom: 15, animate: false });
  }, [baza, map]);
  return null;
}

export default function KartaPrikaz() {
  const baza = useBaza();
  const router = useRouter();
  const params = useSearchParams();
  const [podloga, setPodloga] = useState<Podloga>("satelit");
  const [slojevi, setSlojevi] = useState({ lovista: true, tocke: true, odstrel: true, miris: true });
  const [izbornik, setIzbornik] = useState(false);
  const [nacin, setNacin] = useState<Nacin>("pregled");
  const [odabir, setOdabir] = useState<Odabir>(null);
  const [crtez, setCrtez] = useState<[number, number][]>([]);
  const [lovisteZaGranicu, setLovisteZaGranicu] = useState<string | undefined>();
  const [cilj, setCilj] = useState<{ lat: number; lng: number; zoom?: number; k: number } | null>(null);
  const [moja, setMoja] = useState<{ lat: number; lng: number; tocnost: number } | null>(null);
  const [centar, setCentar] = useState<{ lat: number; lng: number } | null>(null);
  const [satIndeks, setSatIndeks] = useState(0);

  const pocetni = useMemo(() => baza?.postavke.lokacija ?? { lat: 45.1, lng: 15.2 }, [baza?.postavke.lokacija]);
  const izvorVjetra = centar ?? pocetni;
  // Prognoza za šire područje (zaokruženo na ~10 km da se ne dohvaća pri svakom pomaku).
  const prognoza = usePrognoza(Math.round(izvorVjetra.lat * 10) / 10, Math.round(izvorVjetra.lng * 10) / 10);

  const satno = useMemo(() => {
    const p = prognoza.podaci;
    if (!p) return [];
    const sad = p.dohvaceno - 3600000;
    return p.satno.filter((s) => s.vrijeme.getTime() > sad).slice(0, 24);
  }, [prognoza.podaci]);
  const odabraniSat = satno[Math.min(satIndeks, Math.max(0, satno.length - 1))];
  const vjetarSmjer = odabraniSat?.vjetarSmjer ?? prognoza.podaci?.trenutno.vjetarSmjer;
  const vjetarBrzina = odabraniSat?.vjetarBrzina ?? prognoza.podaci?.trenutno.vjetarBrzina;

  // Parametri iz adrese: ?fokus=lat,lng ili ?granica=<lovisteId>
  const fokus = params.get("fokus");
  const granicaParam = params.get("granica");
  const obradeno = useRef<string | null>(null);
  useEffect(() => {
    const kljuc = `${fokus}|${granicaParam}`;
    if (!baza || obradeno.current === kljuc) return;
    obradeno.current = kljuc;
    if (fokus) {
      const [lat, lng] = fokus.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng)) setTimeout(() => setCilj({ lat, lng, zoom: 16, k: Date.now() }), 350);
    }
    if (granicaParam && baza.lovista.some((l) => l.id === granicaParam)) {
      const l = baza.lovista.find((x) => x.id === granicaParam)!;
      setTimeout(() => {
        setNacin("granica");
        setLovisteZaGranicu(l.id);
        setCrtez(l.granica ?? []);
        obavijest("Dodirujte kartu za vrhove granice", "info");
      }, 0);
    }
  }, [baza, fokus, granicaParam]);

  if (!baza) return <div className="svjetlucanje h-full w-full" />;

  const klik = (ll: L.LatLng) => {
    if (nacin === "tocka") {
      otvori({ tip: "tocka", pocetno: { lat: ll.lat, lng: ll.lng } });
      setNacin("pregled");
    } else if (nacin === "granica" || nacin === "mjerenje") {
      setCrtez((c) => [...c, [ll.lat, ll.lng]]);
    } else {
      setOdabir(null);
    }
  };

  const pokreniNacin = (n: Nacin) => {
    setOdabir(null);
    setCrtez([]);
    if (n === "granica") {
      if (!baza.lovista.length) {
        obavijest("Najprije dodajte lovište", "info");
        otvori({ tip: "loviste" });
        return;
      }
      const l = baza.lovista.find((x) => x.id === lovisteZaGranicu) ?? baza.lovista[0];
      setLovisteZaGranicu(l.id);
      setCrtez(l.granica ?? []);
    }
    setNacin((s) => (s === n ? "pregled" : n));
  };

  const spremiGranicu = () => {
    if (!lovisteZaGranicu || crtez.length < 3) return;
    db.uredi("lovista", lovisteZaGranicu, { granica: crtez, povrsinaHa: Math.round(povrsinaHa(crtez)) });
    obavijest("Granica lovišta je spremljena");
    setNacin("pregled");
    setCrtez([]);
    if (granicaParam) router.replace("/karta");
  };

  const gps = () => {
    if (!navigator.geolocation) return obavijest("Lokacija nije podržana", "greska");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const m = { lat: p.coords.latitude, lng: p.coords.longitude, tocnost: p.coords.accuracy };
        setMoja(m);
        setCilj({ ...m, zoom: 16, k: Date.now() });
      },
      () => obavijest("Lokacija nije dostupna", "greska"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const duljinaMjerenja = crtez.reduce((s, p, i) => (i ? s + udaljenostM({ lat: crtez[i - 1][0], lng: crtez[i - 1][1] }, { lat: p[0], lng: p[1] }) : 0), 0);
  const odabranaTocka = odabir?.tip === "tocka" ? baza.tocke.find((t) => t.id === odabir.id) : undefined;
  const odabraniOdstrel = odabir?.tip === "odstrel" ? baza.odstrel.find((o) => o.id === odabir.id) : undefined;
  const odabranoLoviste = odabir?.tip === "loviste" ? baza.lovista.find((l) => l.id === odabir.id) : undefined;
  const ceke = baza.tocke.filter((t) => t.tip === "ceka" || t.tip === "zaklon");
  const zaMiris = odabranaTocka ? [odabranaTocka] : ceke;

  return (
    <div className={cx("relative h-full w-full", nacin !== "pregled" && "[&_.leaflet-container]:cursor-crosshair")}>
      <MapContainer
        center={[pocetni.lat, pocetni.lng]}
        zoom={13}
        zoomControl={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer key={podloga} url={PODLOGE[podloga].url} attribution={PODLOGE[podloga].attr} maxZoom={PODLOGE[podloga].maxZoom} />
        <Dogadaji onKlik={klik} onPomak={(c) => setCentar({ lat: c.lat, lng: c.lng })} />
        <Upravljac cilj={cilj} />
        <GraniceNaPocetku baza={baza} />

        {slojevi.lovista &&
          baza.lovista.map((l) =>
            l.granica && l.granica.length > 2 && !(nacin === "granica" && l.id === lovisteZaGranicu) ? (
              <Polygon
                key={l.id}
                positions={l.granica}
                pathOptions={{
                  color: l.boja,
                  weight: odabir?.id === l.id ? 4 : 2.5,
                  fillOpacity: odabir?.id === l.id ? 0.18 : 0.08,
                  dashArray: "8 6",
                }}
                bubblingMouseEvents={false}
                eventHandlers={{
                  click: () => nacin === "pregled" && setOdabir({ tip: "loviste", id: l.id }),
                }}
              >
                <Tooltip direction="center" className="etiketa-lovista" permanent>
                  <span style={{ color: "#fff", textShadow: "0 1px 4px #000", fontWeight: 700, fontSize: 13 }}>{l.naziv}</span>
                </Tooltip>
              </Polygon>
            ) : null,
          )}

        {slojevi.miris &&
          vjetarSmjer != null &&
          zaMiris.map((t) => (
            <Polygon
              key={`m-${t.id}`}
              positions={stozac(t.lat, t.lng, vjetarSmjer, 200 + (vjetarBrzina ?? 5) * 18)}
              interactive={false}
              pathOptions={{ color: "#e8a947", weight: 1, fillColor: "#e8a947", fillOpacity: 0.22, opacity: 0.6 }}
            />
          ))}

        {slojevi.tocke &&
          baza.tocke.map((t) => (
            <Marker
              key={t.id}
              position={[t.lat, t.lng]}
              icon={ikonaTocke(t, odabir?.id === t.id)}
              eventHandlers={{
                click: () => {
                  if (nacin !== "pregled") return;
                  setOdabir({ tip: "tocka", id: t.id });
                  setCilj({ lat: t.lat, lng: t.lng, k: Date.now() });
                },
              }}
            />
          ))}

        {slojevi.odstrel &&
          baza.odstrel
            .filter((o) => o.lat != null && o.lng != null)
            .map((o) => (
              <Marker
                key={o.id}
                position={[o.lat!, o.lng!]}
                icon={ikonaOdstrela(bojaVrste(o.vrsta))}
                eventHandlers={{ click: () => nacin === "pregled" && setOdabir({ tip: "odstrel", id: o.id }) }}
              />
            ))}

        {moja && (
          <>
            <Circle center={[moja.lat, moja.lng]} radius={moja.tocnost} pathOptions={{ color: "#4ea1ff", weight: 1, fillOpacity: 0.1 }} />
            <CircleMarker center={[moja.lat, moja.lng]} radius={7} pathOptions={{ color: "#fff", weight: 3, fillColor: "#4ea1ff", fillOpacity: 1 }} />
          </>
        )}

        {(nacin === "granica" || nacin === "mjerenje") && crtez.length > 0 && (
          <>
            {nacin === "granica" && crtez.length > 2 ? (
              <Polygon positions={crtez} pathOptions={{ color: "#e8a947", weight: 3, fillOpacity: 0.15 }} />
            ) : (
              <Polyline positions={crtez} pathOptions={{ color: "#e8a947", weight: 3, dashArray: nacin === "mjerenje" ? "6 6" : undefined }} />
            )}
            {crtez.map((p, i) => (
              <Marker key={i} position={p} icon={ikonaVrha} />
            ))}
          </>
        )}
      </MapContainer>

      {/* Gornja traka: vjetar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ...opruga }}
          className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-[#0d130e]/80 p-2.5 pr-3 text-white shadow-jaka backdrop-blur-xl md:max-w-md md:flex-none"
        >
          <div className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
            {vjetarSmjer != null ? (
              <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                animate={{ rotate: (vjetarSmjer + 180) % 360 }}
                transition={{ type: "spring", stiffness: 80, damping: 14 }}
                className="text-[#e8a947]"
              >
                <path d="M12 2l6 18-6-4-6 4z" fill="currentColor" />
              </motion.svg>
            ) : (
              <Ikona ime="vjetar" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium tracking-wider text-white/55 uppercase">
              Zona mirisa · {odabraniSat ? (satIndeks === 0 ? "sada" : sat(odabraniSat.vrijeme)) : "…"}
            </div>
            <div className="brojke truncate text-[15px] font-semibold">
              {vjetarSmjer != null ? `Vjetar iz ${smjerVjetra(vjetarSmjer)} · ${Math.round(vjetarBrzina ?? 0)} km/h` : prognoza.greska ? "Vjetar nedostupan" : "Učitavam vjetar…"}
            </div>
            {satno.length > 1 && (
              <input
                type="range"
                min={0}
                max={satno.length - 1}
                value={satIndeks}
                onChange={(e) => setSatIndeks(Number(e.target.value))}
                className="mt-1 h-1.5 w-full cursor-pointer accent-[#e8a947]"
                aria-label="Sat prognoze vjetra"
              />
            )}
          </div>
        </motion.div>

        <div className="pointer-events-auto ml-auto flex flex-col gap-2">
          <KartaGumb ikona="slojevi" oznaka="Slojevi" aktivan={izbornik} onClick={() => setIzbornik((s) => !s)} />
          <KartaGumb ikona="gps" oznaka="Moja lokacija" onClick={gps} />
        </div>
      </div>

      {/* Izbornik slojeva */}
      <AnimatePresence>
        {izbornik && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={opruga}
            style={{ transformOrigin: "top right" }}
            className="absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] right-3 z-[600] w-64 rounded-2xl border border-white/10 bg-[#0d130e]/90 p-3 text-white shadow-jaka backdrop-blur-xl md:top-20 md:right-5"
          >
            <div className="mb-2 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Podloga</div>
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {(Object.keys(PODLOGE) as Podloga[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPodloga(p)}
                  className={cx("rounded-xl border px-2 py-2 text-[12.5px] transition-colors", podloga === p ? "border-[#e8a947] bg-[#e8a947]/15" : "border-white/10 hover:bg-white/5")}
                >
                  {PODLOGE[p].naziv}
                </button>
              ))}
            </div>
            <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Slojevi</div>
            {(
              [
                ["lovista", "Granice lovišta"],
                ["tocke", "Čeke i točke"],
                ["odstrel", "Mjesta odstrela"],
                ["miris", "Zona mirisa (vjetar)"],
              ] as [keyof typeof slojevi, string][]
            ).map(([k, n]) => (
              <button key={k} onClick={() => setSlojevi((s) => ({ ...s, [k]: !s[k] }))} className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-[14px] hover:bg-white/5">
                {n}
                <span className={cx("relative h-5 w-9 rounded-full transition-colors", slojevi[k] ? "bg-[#e8a947]" : "bg-white/15")}>
                  <motion.span layout transition={opruga} className={cx("absolute top-0.5 size-4 rounded-full bg-white", slojevi[k] ? "right-0.5" : "left-0.5")} />
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Donja ploča: alati / odabir / crtanje */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] flex flex-col items-center gap-2 p-3 pb-[calc(env(safe-area-inset-bottom)+6.2rem)] md:p-5 lg:pb-5">
        <AnimatePresence mode="popLayout">
          {nacin === "pregled" && odabranaTocka && (
            <Panel key={`t-${odabranaTocka.id}`}>
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl text-[14px] font-bold text-black/75" style={{ background: TIPOVI_TOCAKA[odabranaTocka.tip].boja }}>
                  {TIPOVI_TOCAKA[odabranaTocka.tip].slovo}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{odabranaTocka.naziv}</div>
                  <div className="text-[13px] text-white/60">
                    {TIPOVI_TOCAKA[odabranaTocka.tip].naziv}
                    {odabranaTocka.lovisteId ? ` · ${baza.lovista.find((l) => l.id === odabranaTocka.lovisteId)?.naziv ?? ""}` : ""}
                  </div>
                  {odabranaTocka.napomena && <p className="mt-1 line-clamp-2 text-[13px] text-white/75">{odabranaTocka.napomena}</p>}
                  <div className="mt-1 text-[12px] text-white/50">
                    {baza.izlasci.filter((i) => i.tockaId === odabranaTocka.id).length} izlazaka s ove točke
                  </div>
                </div>
                <button onClick={() => setOdabir(null)} className="p-1 text-white/50 hover:text-white" aria-label="Zatvori">
                  <Ikona ime="x" velicina={18} />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <Gumb velicina="sm" className="flex-1 border-white/10 bg-white/10 text-white" ikona="uredi" onClick={() => otvori({ tip: "tocka", id: odabranaTocka.id })}>
                  Uredi
                </Gumb>
                <Gumb velicina="sm" vrsta="primarni" className="flex-[1.5]" ikona="dnevnik" onClick={() => otvori({ tip: "izlazak", pocetno: { tockaId: odabranaTocka.id, lovisteId: odabranaTocka.lovisteId } })}>
                  Izlazak ovdje
                </Gumb>
              </div>
            </Panel>
          )}
          {nacin === "pregled" && odabraniOdstrel && (
            <Panel key={`o-${odabraniOdstrel.id}`}>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl" style={{ background: `${bojaVrste(odabraniOdstrel.vrsta)}33`, color: bojaVrste(odabraniOdstrel.vrsta) }}>
                  <Ikona ime="meta" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">{odabraniOdstrel.vrsta}</div>
                  <div className="text-[13px] text-white/60">
                    {nazivSpola(odabraniOdstrel.vrsta, odabraniOdstrel.spol)} · {datumKratki(odabraniOdstrel.datum)} u {odabraniOdstrel.vrijeme}
                  </div>
                </div>
                <Gumb velicina="sm" vrsta="primarni" onClick={() => otvori({ tip: "detalj-odstrel", id: odabraniOdstrel.id })}>
                  Detalji
                </Gumb>
              </div>
            </Panel>
          )}
          {nacin === "pregled" && odabranoLoviste && (
            <Panel key={`l-${odabranoLoviste.id}`}>
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full" style={{ background: odabranoLoviste.boja }} />
                <div className="flex-1">
                  <div className="font-semibold">
                    {odabranoLoviste.naziv} {odabranoLoviste.broj && <span className="font-normal text-white/50">{odabranoLoviste.broj}</span>}
                  </div>
                  <div className="brojke text-[13px] text-white/60">
                    {Math.round(povrsinaHa(odabranoLoviste.granica ?? [])).toLocaleString("hr-HR")} ha · {baza.tocke.filter((t) => t.lovisteId === odabranoLoviste.id).length} točaka
                  </div>
                </div>
                <Link href="/lovista" transitionTypes={["naprijed"]}>
                  <Gumb velicina="sm" vrsta="primarni">
                    Otvori
                  </Gumb>
                </Link>
              </div>
            </Panel>
          )}

          {nacin === "granica" && (
            <Panel key="granica">
              <div className="mb-2.5 flex items-center gap-2">
                <Ikona ime="poligon" velicina={18} className="text-[#e8a947]" />
                <span className="font-semibold">Crtanje granice</span>
                <select
                  value={lovisteZaGranicu}
                  onChange={(e) => {
                    setLovisteZaGranicu(e.target.value);
                    setCrtez(baza.lovista.find((l) => l.id === e.target.value)?.granica ?? []);
                  }}
                  className="ml-auto max-w-[45%] rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[13px] text-white"
                >
                  {baza.lovista.map((l) => (
                    <option key={l.id} value={l.id} className="text-black">
                      {l.naziv}
                    </option>
                  ))}
                </select>
              </div>
              <p className="brojke mb-3 text-[13px] text-white/60">
                {crtez.length < 3 ? `Dodirnite kartu za vrhove (${crtez.length}/3+)` : `${crtez.length} vrhova · ${Math.round(povrsinaHa(crtez)).toLocaleString("hr-HR")} ha`}
              </p>
              <div className="flex gap-2">
                <Gumb velicina="sm" className="border-white/10 bg-white/10 text-white" onClick={() => setCrtez((c) => c.slice(0, -1))} disabled={!crtez.length}>
                  Poništi
                </Gumb>
                <Gumb velicina="sm" className="border-white/10 bg-white/10 text-white" onClick={() => setCrtez([])} disabled={!crtez.length}>
                  Očisti
                </Gumb>
                <Gumb velicina="sm" vrsta="primarni" ikona="kvacica" className="flex-1" onClick={spremiGranicu} disabled={crtez.length < 3}>
                  Spremi
                </Gumb>
              </div>
            </Panel>
          )}

          {nacin === "mjerenje" && (
            <Panel key="mjerenje">
              <div className="flex items-center gap-3">
                <Ikona ime="ravnalo" velicina={20} className="text-[#e8a947]" />
                <div className="flex-1">
                  <div className="brojke text-[20px] font-semibold">{metri(duljinaMjerenja)}</div>
                  <div className="text-[12.5px] text-white/55">{crtez.length < 2 ? "Dodirnite kartu za mjerenje" : `${crtez.length} točaka`}</div>
                </div>
                <Gumb velicina="sm" className="border-white/10 bg-white/10 text-white" onClick={() => setCrtez((c) => c.slice(0, -1))} disabled={!crtez.length}>
                  Poništi
                </Gumb>
              </div>
            </Panel>
          )}

          {nacin === "tocka" && (
            <Panel key="tocka">
              <div className="flex items-center gap-3">
                <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  <Ikona ime="lokacija" className="text-[#e8a947]" />
                </motion.span>
                <span className="flex-1 font-medium">Dodirnite kartu gdje želite postaviti točku</span>
              </div>
            </Panel>
          )}
        </AnimatePresence>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...opruga }}
          className="pointer-events-auto flex gap-1 rounded-2xl border border-white/10 bg-[#0d130e]/85 p-1.5 text-white shadow-jaka backdrop-blur-xl"
        >
          <Alat ikona="lokacija" oznaka="Točka" aktivan={nacin === "tocka"} onClick={() => pokreniNacin("tocka")} />
          <Alat ikona="poligon" oznaka="Granica" aktivan={nacin === "granica"} onClick={() => pokreniNacin("granica")} />
          <Alat ikona="ravnalo" oznaka="Mjeri" aktivan={nacin === "mjerenje"} onClick={() => pokreniNacin("mjerenje")} />
          <Alat
            ikona="dnevnik"
            oznaka="Izlazak"
            onClick={() => {
              const najbliza = moja
                ? [...ceke].sort((a, b) => udaljenostM(a, moja) - udaljenostM(b, moja))[0]
                : undefined;
              otvori({ tip: "izlazak", pocetno: najbliza ? { tockaId: najbliza.id, lovisteId: najbliza.lovisteId } : undefined });
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
      transition={opruga}
      className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0d130e]/90 p-3.5 text-white shadow-jaka backdrop-blur-xl"
    >
      {children}
    </motion.div>
  );
}

function KartaGumb({ ikona, oznaka, onClick, aktivan }: { ikona: ImeIkone; oznaka: string; onClick: () => void; aktivan?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={oznaka}
      title={oznaka}
      className={cx(
        "grid size-12 place-items-center rounded-2xl border border-white/10 text-white shadow-jaka backdrop-blur-xl transition-colors",
        aktivan ? "bg-[#e8a947] text-[#17130a]" : "bg-[#0d130e]/80 hover:bg-[#0d130e]",
      )}
    >
      <Ikona ime={ikona} />
    </motion.button>
  );
}

function Alat({ ikona, oznaka, onClick, aktivan }: { ikona: ImeIkone; oznaka: string; onClick: () => void; aktivan?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick} className="relative flex w-[72px] flex-col items-center gap-0.5 rounded-xl py-2 text-[11.5px] font-medium">
      {aktivan && <motion.span layoutId="alat-aktivan" transition={opruga} className="absolute inset-0 rounded-xl bg-[#e8a947]" />}
      <Ikona ime={ikona} velicina={20} className={cx("relative", aktivan ? "text-[#17130a]" : "text-white/85")} />
      <span className={cx("relative", aktivan ? "text-[#17130a]" : "text-white/70")}>{oznaka}</span>
    </motion.button>
  );
}
