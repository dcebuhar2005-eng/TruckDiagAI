import type { Spol, TipDozvole, TipTocke, VrstaLova, VrstaRada } from "./types";

export type Skupina = "krupna" | "sitna-dlakava" | "pernata" | "grabezljivci";

export interface Vrsta {
  naziv: string;
  skupina: Skupina;
  /** Kako se zove mužjak / ženka / mladunče (za prikaz spola). */
  spol?: { m: string; z: string; n?: string };
}

export const VRSTE: Vrsta[] = [
  { naziv: "Jelen obični", skupina: "krupna", spol: { m: "jelen", z: "košuta", n: "tele" } },
  { naziv: "Jelen lopatar", skupina: "krupna", spol: { m: "jelen", z: "košuta", n: "tele" } },
  { naziv: "Srna obična", skupina: "krupna", spol: { m: "srnjak", z: "srna", n: "lane" } },
  { naziv: "Divlja svinja", skupina: "krupna", spol: { m: "vepar", z: "krmača", n: "prase" } },
  { naziv: "Muflon", skupina: "krupna", spol: { m: "muflon", z: "muflonka", n: "janje" } },
  { naziv: "Divokoza", skupina: "krupna", spol: { m: "jarac", z: "koza", n: "jare" } },
  { naziv: "Smeđi medvjed", skupina: "krupna" },
  { naziv: "Zec obični", skupina: "sitna-dlakava" },
  { naziv: "Kunić divlji", skupina: "sitna-dlakava" },
  { naziv: "Jazavac", skupina: "sitna-dlakava" },
  { naziv: "Fazan", skupina: "pernata", spol: { m: "pijetao", z: "kokoš" } },
  { naziv: "Trčka skvržulja", skupina: "pernata" },
  { naziv: "Jarebica kamenjarka", skupina: "pernata" },
  { naziv: "Prepelica", skupina: "pernata" },
  { naziv: "Šljuka bena", skupina: "pernata" },
  { naziv: "Divlja patka", skupina: "pernata" },
  { naziv: "Divlja guska", skupina: "pernata" },
  { naziv: "Golub grivnjaš", skupina: "pernata" },
  { naziv: "Liska crna", skupina: "pernata" },
  { naziv: "Lisica", skupina: "grabezljivci" },
  { naziv: "Čagalj", skupina: "grabezljivci" },
  { naziv: "Kuna bjelica", skupina: "grabezljivci" },
  { naziv: "Siva vrana", skupina: "grabezljivci" },
  { naziv: "Svraka", skupina: "grabezljivci" },
  { naziv: "Šojka", skupina: "grabezljivci" },
];

export const SKUPINE: Record<Skupina, { naziv: string; boja: string }> = {
  krupna: { naziv: "Krupna divljač", boja: "#c98500" },
  "sitna-dlakava": { naziv: "Sitna dlakava", boja: "#199e70" },
  pernata: { naziv: "Pernata divljač", boja: "#3987e5" },
  grabezljivci: { naziv: "Predatori", boja: "#d55181" },
};

export function vrsta(naziv: string): Vrsta | undefined {
  return VRSTE.find((v) => v.naziv === naziv);
}

export function bojaVrste(naziv: string) {
  const v = vrsta(naziv);
  return v ? SKUPINE[v.skupina].boja : "#a3a3a3";
}

export function nazivSpola(vrstaNaziv: string, s: Spol) {
  const v = vrsta(vrstaNaziv);
  if (v?.spol) {
    if (s === "m") return v.spol.m;
    if (s === "z") return v.spol.z;
    return v.spol.n ?? "mlado";
  }
  return s === "m" ? "mužjak" : s === "z" ? "ženka" : "mlado";
}

export const DOBNI_RAZREDI = [
  "Mlado (0 god.)",
  "Mlado (1 god.)",
  "Srednjodobno",
  "Zrelo",
  "Staro",
];

export const TIPOVI_TOCAKA: Record<TipTocke, { naziv: string; boja: string; slovo: string }> = {
  ceka: { naziv: "Čeka", boja: "#e0a63a", slovo: "Č" },
  hraniliste: { naziv: "Hranilište", boja: "#8fb573", slovo: "H" },
  soliste: { naziv: "Solište", boja: "#cfd8dc", slovo: "S" },
  kamera: { naziv: "Kamera", boja: "#7aa7d6", slovo: "K" },
  kaljuziste: { naziv: "Kaljužište", boja: "#a1887f", slovo: "Ka" },
  pojiliste: { naziv: "Pojilište", boja: "#4fb3bf", slovo: "P" },
  zaklon: { naziv: "Zaklon", boja: "#9c8ade", slovo: "Z" },
  remiza: { naziv: "Remiza / usjev", boja: "#6fa86a", slovo: "R" },
  zasjeda: { naziv: "Zasjeda", boja: "#e07a4f", slovo: "T" },
  prijelaz: { naziv: "Prijelaz divljači", boja: "#d6b25e", slovo: "Pr" },
  parking: { naziv: "Parking", boja: "#90a4ae", slovo: "P" },
  ostalo: { naziv: "Ostalo", boja: "#bdbdbd", slovo: "•" },
};

/** Divljač koja koristi prijelaz (odabire se naknadno, može ih biti više). */
export const DIVLJAC_PRIJELAZA: { k: string; naziv: string; slovo: string; boja: string }[] = [
  { k: "jelenska", naziv: "Jelenska", slovo: "J", boja: "#c08a52" },
  { k: "svinje", naziv: "Svinje / prasci", slovo: "S", boja: "#8d6e63" },
  { k: "srneca", naziv: "Srneća", slovo: "Sr", boja: "#d4a373" },
  { k: "lopatar", naziv: "Lopatar", slovo: "L", boja: "#b08968" },
  { k: "muflon", naziv: "Muflon", slovo: "M", boja: "#9c8a6e" },
  { k: "divokoza", naziv: "Divokoza", slovo: "D", boja: "#a1887f" },
  { k: "medvjed", naziv: "Medvjed", slovo: "Me", boja: "#6d4c41" },
  { k: "sitna", naziv: "Sitna divljač", slovo: "Si", boja: "#c5b358" },
  { k: "grabezljivci", naziv: "Lisica / čagalj", slovo: "Li", boja: "#e0864a" },
];

/** Što se sije u lovištu za divljač (remize, krmne njive). */
export const USJEVI: { k: string; naziv: string }[] = [
  { k: "kukuruz", naziv: "Kukuruz" },
  { k: "suncokret", naziv: "Suncokret" },
  { k: "djetelina", naziv: "Djetelina" },
  { k: "lucerna", naziv: "Lucerna" },
  { k: "zob", naziv: "Zob" },
  { k: "psenica", naziv: "Pšenica" },
  { k: "jecam", naziv: "Ječam" },
  { k: "proso", naziv: "Proso" },
  { k: "heljda", naziv: "Heljda" },
  { k: "repa", naziv: "Stočna repa" },
  { k: "krumpir", naziv: "Krumpir" },
  { k: "kupus", naziv: "Kupusnjače" },
];

export function opisUsjeva(usjevi?: string[]) {
  return USJEVI.filter((u) => usjevi?.includes(u.k)).map((u) => u.naziv.toLowerCase()).join(", ");
}

/** Divljač po tragu – kao kod prijelaza, uz vuka i risa. */
export const DIVLJAC_TRAGA = [
  ...DIVLJAC_PRIJELAZA,
  { k: "vuk", naziv: "Vuk", slovo: "V", boja: "#9e9e9e" },
  { k: "ris", naziv: "Ris", slovo: "R", boja: "#c9a26b" },
];

export const ZNAKOVI_TRAGA: { k: string; naziv: string }[] = [
  { k: "otisak", naziv: "Otisak" },
  { k: "izmet", naziv: "Izmet" },
  { k: "lezaj", naziv: "Ležaj" },
  { k: "rovanje", naziv: "Rovanje" },
  { k: "guljenje", naziv: "Guljenje / struganje" },
  { k: "kaljuzanje", naziv: "Kaljužanje" },
  { k: "staza", naziv: "Staza" },
  { k: "plijen", naziv: "Ostaci plijena" },
];

export const divljacTraga = (k: string) => DIVLJAC_TRAGA.find((d) => d.k === k) ?? { k, naziv: k, slovo: "?", boja: "#bdbdbd" };
export const znakTraga = (k: string) => ZNAKOVI_TRAGA.find((z) => z.k === k)?.naziv ?? k;
export const opisTraga = (t: { divljac: string; znak: string; svjez?: boolean }) =>
  `${znakTraga(t.znak)} · ${divljacTraga(t.divljac).naziv.toLowerCase()}${t.svjez == null ? "" : t.svjez ? " · svjež" : " · star"}`;

export function opisPrijelaza(divljac?: string[]) {
  const n = DIVLJAC_PRIJELAZA.filter((d) => divljac?.includes(d.k)).map((d) => d.naziv.toLowerCase());
  return n.length ? n.join(", ") : "divljač nije odabrana";
}

export const NACINI_LOVA: Record<VrstaLova, string> = {
  cekanje: "Čekanje",
  "dočekivanje": "Dočekivanje",
  "šuljanje": "Šuljanje",
  skupni: "Skupni lov",
  pogon: "Pogon",
  "s psom": "Lov s psom",
  obilazak: "Obilazak / prihrana",
  ostalo: "Ostalo",
};

/** Radovi u lovištu: što se dopunjuje, jedinica i koja vrsta točke se dopunjuje. */
export const RADOVI: Record<VrstaRada, { naziv: string; jedinica: string; tocka: TipTocke }> = {
  prihrana: { naziv: "Prihrana", jedinica: "kg", tocka: "hraniliste" },
  sol: { naziv: "Sol", jedinica: "kg", tocka: "soliste" },
  voda: { naziv: "Voda", jedinica: "l", tocka: "pojiliste" },
};

export const TIPOVI_DOZVOLA: Record<TipDozvole, string> = {
  "lovacka-iskaznica": "Lovačka iskaznica",
  "dozvola-za-lov": "Dozvola za lov",
  "oruzni-list": "Oružni list",
  osiguranje: "Osiguranje",
  clanarina: "Članarina",
  ispit: "Ispit / certifikat",
  ostalo: "Ostalo",
};

export const BOJE_LOVISTA = [
  "#d4a24c",
  "#8fb573",
  "#6fa3c7",
  "#c7756f",
  "#9c8ade",
  "#4fb3bf",
  "#e08a5b",
];
