import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lovački dnevnik",
    short_name: "Lov",
    description: "Evidencija izlazaka, odstrela, lovišta i dozvola",
    start_url: "/",
    display: "standalone",
    background_color: "#0b100c",
    theme_color: "#0b100c",
    lang: "hr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
