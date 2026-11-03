import type { TipTocke } from "./types";

/** Sličice vrsta točaka (24×24, potez) – na karti, u popisima i legendi umjesto slova. */
export const IKONE_TOCAKA: Record<TipTocke, string> = {
  ceka: '<path d="M4.5 9 12 3.5 19.5 9"/><rect x="7" y="9" width="10" height="5" rx=".5"/><path d="M8 14l-2.5 7M16 14l2.5 7"/><path d="M10.5 14v7M13.5 14v7M10.5 17h3M10.5 20h3"/>',
  hraniliste: '<ellipse cx="12" cy="4.5" rx="4.8" ry="1.6"/><path d="M7.2 4.5v7.3c0 1 2.1 1.8 4.8 1.8s4.8-.8 4.8-1.8V4.5"/><path d="M7.2 8.2c0 1 2.1 1.7 4.8 1.7s4.8-.7 4.8-1.7"/><path d="M8.8 13.3 6.5 21M15.2 13.3l2.3 7.7"/><path d="M12 13.6v3.4"/>',
  soliste: '<path d="M12 21V10"/><path d="M6 10h12L12 5z"/><rect x="9.5" y="12" width="5" height="4" rx=".6"/>',
  kamera: '<rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M7 8h1.5"/>',
  kaljuziste: '<ellipse cx="12" cy="15.5" rx="9" ry="4.5"/><path d="M7 15.5c1.7-1.2 3.3 1.2 5 0s3.3 1.2 5 0"/><circle cx="9" cy="7" r="1.5"/><circle cx="14" cy="5.5" r="1.1"/>',
  pojiliste: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  zaklon: '<path d="M3 20 12 5l9 15z"/><path d="M12 20v-6"/><path d="M9 20l3-6 3 6"/>',
  remiza:
    '<path d="M6 21V9M12 21V5M18 21V9"/><path d="M6 11c-2-1-2-3-2-3s2 0 2 2M6 11c2-1 2-3 2-3s-2 0-2 2M12 8c-2-1-2-3-2-3s2 0 2 2M12 8c2-1 2-3 2-3s-2 0-2 2M18 11c-2-1-2-3-2-3s2 0 2 2M18 11c2-1 2-3 2-3s-2 0-2 2"/>',
  zasjeda: '<path d="M12 6 6 21M12 6l6 15M12 6v15"/><path d="M9 3.5 12 6l3-2.5"/>',
  prijelaz: '<path d="M7.5 4C6 4 5 6.5 5 9s1 4.5 2.5 4.5S10 12 10 9.5 9 4 7.5 4zM16.5 10.5c-1.5 0-2.5 2.5-2.5 5s1 4.5 2.5 4.5S19 18.5 19 16s-1-5.5-2.5-5.5z"/>',
  parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 17V8h3.5a2.75 2.75 0 0 1 0 5.5H10"/>',
  ostalo: '<circle cx="12" cy="12" r="3"/>',
};

/** HTML sličice za Leaflet oznake (divIcon). */
export function svgTocke(tip: TipTocke, px: number, boja = "rgba(0,0,0,.8)") {
  return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${boja}" color="${boja}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKONE_TOCAKA[tip]}</svg>`;
}
