"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { t } from "@/app/translations";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapContainer: any = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer: any = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker: any = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

const Popup: any = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const CEBUHAR_POSITION: [number, number] = [
  45.31633153243207,
  14.729109968089547,
];

export default function ServiceMap() {
  const [services, setServices] = useState<any[]>([]);

useEffect(() => {
  async function loadServices() {
    const { data } = await supabase
      .from("services")
      .select("*");

    setServices(data || []);
  }

  loadServices();
}, []);
  return (
    <div className="service-map-wrapper">
      <MapContainer center={CEBUHAR_POSITION} zoom={14} scrollWheelZoom={true} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={CEBUHAR_POSITION}>
          <Popup>
            <div style={{ minWidth: "220px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#111827" }}>
                🏢 ČEBUHAR GRUPA d.o.o.
              </h3>

              <p style={{ margin: "4px 0", color: "#111827" }}>
                📍 Vrata 52
                <br />
                51322 Fužine
              </p>

              <p style={{ margin: "4px 0", color: "#111827" }}>
                📞 +385 95 820 5391
              </p>

              <p style={{ margin: "6px 0", color: "#111827" }}>
  🕒 <b>Radno vrijeme:</b>
  <br />
  Pon–Pet: 08:00–17:00
  <br />
  Sub: 08:00–13:00
</p>
              <p
  style={{
    margin: "8px 0",
    padding: "6px",
    background: "#f3f4f6",
    borderRadius: "6px",
    color: "#111827",
    fontWeight: "bold",
  }}
>
  {t("car")}
  <br />
  {t("truck")}
</p>

              <a href="tel:+385958205391" style={{ display: "inline-block", marginTop: "8px", marginRight: "8px", padding: "8px 12px", background: "#16a34a", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                {t("call")}
              </a>

              <a href="https://www.google.com/maps/search/?api=1&query=45.31633153243207,14.729109968089547" target="_blank" style={{ display: "inline-block", marginTop: "8px", padding: "8px 12px", background: "#2563eb", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                {t("navigation")}
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}