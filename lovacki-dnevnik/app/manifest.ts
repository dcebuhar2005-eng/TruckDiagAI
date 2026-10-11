import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lovački dnevnik",
    short_name: "Lovni dnevnik",
    description: "Evidencija izlazaka, odstrela, lovišta i dozvola",
    start_url: "/",
    display: "standalone",
    background_color: "#023519",
    theme_color: "#0b100c",
    lang: "hr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
