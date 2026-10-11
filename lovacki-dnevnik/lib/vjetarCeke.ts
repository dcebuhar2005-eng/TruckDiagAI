import type { TipTocke, Tocka } from "./types";
import { razlikaSmjera, type SatnaPrognoza } from "./vrijeme";

/** Osam strana svijeta odakle vjetar puše (meteorološki smjer). */
export const STRANE = [
  { s: 0, kratko: "S", naziv: "sa sjevera" },
  { s: 45, kratko: "SI", naziv: "sa sjeveroistoka" },
  { s: 90, kratko: "I", naziv: "s istoka" },
  { s: 135, kratko: "JI", naziv: "s jugoistoka" },
  { s: 180, kratko: "J", naziv: "s juga" },
  { s: 225, kratko: "JZ", naziv: "s jugozapada" },
  { s: 270, kratko: "Z", naziv: "sa zapada" },
  { s: 315, kratko: "SZ", naziv: "sa sjeverozapada" },
] as const;

export type OcjenaVjetra = "dobar" | "rubno" | "los" | "nestalan" | "nepoznato";

export const OCJENE: Record<OcjenaVjetra, { naziv: string; boja: string }> = {
  dobar: { naziv: "Dobar vjetar", boja: "#6fbf73" },
  rubno: { naziv: "Rubno", boja: "#e8a947" },
  los: { naziv: "Loš vjetar", boja: "#e0574f" },
  nestalan: { naziv: "Nestalan vjetar", boja: "#b8a46a" },
  nepoznato: { naziv: "Nije određeno", boja: "#e8a947" },
};

/** Točke na kojima se čeka divljač – za njih se računa vjetar (čeka, zaklon, zasjeda s tronošcem). */
export const zaVjetar = (tip: TipTocke) => tip === "ceka" || tip === "zaklon" || tip === "zasjeda";

/** Ima li točka zadane dobre vjetrove. */
export const imaVjetrove = (t: Tocka) => Boolean(t.vjetrovi?.length);

/** Ocjena vjetra za čeku: koliko je trenutni smjer blizu jednog od dobrih smjerova. */
export function ocjenaVjetra(t: Tocka, smjer?: number, brzina?: number): OcjenaVjetra {
  if (!t.vjetrovi?.length || smjer == null) return "nepoznato";
  if (brzina != null && brzina < 3) return "nestalan";
  const d = Math.min(...t.vjetrovi.map((v) => razlikaSmjera(v, smjer)));
  if (d <= 30) return "dobar";
  if (d <= 55) return "rubno";
  return "los";
}

/** Sljedeće razdoblje (u idućih `sati` sati) kad je vjetar dobar za čeku. */
export function sljedeciDobar(t: Tocka, satno: SatnaPrognoza[], sada: number, sati = 18) {
  const buduci = satno.filter((s) => s.vrijeme.getTime() >= sada - 3600000).slice(0, sati);
  const i = buduci.findIndex((s) => ocjenaVjetra(t, s.vjetarSmjer, s.vjetarBrzina) === "dobar");
  if (i < 0) return null;
  let j = i;
  while (j + 1 < buduci.length && ocjenaVjetra(t, buduci[j + 1].vjetarSmjer, buduci[j + 1].vjetarBrzina) === "dobar") j++;
  return { od: buduci[i].vrijeme, do: new Date(buduci[j].vrijeme.getTime() + 3600000), sada: i === 0 };
}

export function opisVjetrova(v?: number[]) {
  if (!v?.length) return "nije određeno";
  return STRANE.filter((s) => v.includes(s.s))
    .map((s) => s.kratko)
    .join(", ");
}
