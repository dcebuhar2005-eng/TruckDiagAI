import type { UzrokStradanja } from "./types";

/** Uzroci stradanja divljači – redoslijed je redoslijed u obrascu. */
export const UZROCI: { k: UzrokStradanja; naziv: string; ikona: string }[] = [
  { k: "promet", naziv: "Promet (cesta)", ikona: "🚗" },
  { k: "vlak", naziv: "Vlak", ikona: "🚆" },
  { k: "stroj", naziv: "Poljoprivredni stroj", ikona: "🚜" },
  { k: "predator", naziv: "Pas / predator", ikona: "🐕" },
  { k: "nepoznato", naziv: "Nepoznato", ikona: "❓" },
];

export const uzrok = (k: UzrokStradanja) => UZROCI.find((u) => u.k === k) ?? UZROCI[UZROCI.length - 1];
