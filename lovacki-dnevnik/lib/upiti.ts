import { lovnaGodina } from "./astro";
import { danaDo, izIso } from "./format";
import type { Baza, Dozvola, Kvota, Odstrel } from "./types";

export function centarLovista(b: Baza, lovisteId?: string) {
  const l = b.lovista.find((x) => x.id === lovisteId);
  if (l?.granica?.length) {
    const lat = l.granica.reduce((s, p) => s + p[0], 0) / l.granica.length;
    const lng = l.granica.reduce((s, p) => s + p[1], 0) / l.granica.length;
    return { lat, lng };
  }
  const t = b.tocke.find((x) => x.lovisteId === lovisteId);
  if (t) return { lat: t.lat, lng: t.lng };
  return b.postavke.lokacija;
}

export function nazivLovista(b: Baza, id?: string) {
  return b.lovista.find((l) => l.id === id)?.naziv;
}

export function odstrelULovnojGodini(b: Baza, d = new Date()) {
  const lg = lovnaGodina(d);
  return b.odstrel.filter((o) => {
    const t = izIso(o.datum, o.vrijeme);
    return t >= lg.od && t <= lg.do;
  });
}

export type StatusDozvole = "valjana" | "istice" | "istekla" | "buduca" | "bez-roka";

export function statusDozvole(d: Dozvola): { status: StatusDozvole; dana: number | null } {
  if (d.od && danaDo(d.od) > 0) return { status: "buduca", dana: danaDo(d.od) };
  if (!d.do) return { status: "bez-roka", dana: null };
  const dana = danaDo(d.do);
  if (dana < 0) return { status: "istekla", dana };
  if (dana <= 30) return { status: "istice", dana };
  return { status: "valjana", dana };
}

/** Koliko je odstrela iskorišteno iz kvote dozvole (u razdoblju valjanosti i lovištu dozvole). */
export function iskoristenostKvote(b: Baza, d: Dozvola, k: Kvota) {
  return b.odstrel.filter((o: Odstrel) => {
    if (o.vrsta !== k.vrsta) return false;
    if (k.spol && o.spol !== k.spol) return false;
    if (d.lovisteId && o.lovisteId !== d.lovisteId) return false;
    if (d.od && o.datum < d.od) return false;
    if (d.do && o.datum > d.do) return false;
    return true;
  }).length;
}

export function sortirajPoDatumu<T extends { datum: string; createdAt: number }>(
  lista: T[],
  vrijeme?: (x: T) => string | undefined,
) {
  return [...lista].sort((a, b) => {
    const k = b.datum.localeCompare(a.datum);
    if (k) return k;
    if (vrijeme) {
      const v = (vrijeme(b) ?? "").localeCompare(vrijeme(a) ?? "");
      if (v) return v;
    }
    return b.createdAt - a.createdAt;
  });
}
