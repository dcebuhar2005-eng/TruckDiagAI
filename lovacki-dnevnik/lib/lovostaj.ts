// Lovni kalendar: lovostaj po vrstama divljači i državama.
// Hrvatska: Pravilnik o lovostaju (NN 94/2019) – provjereno 4. 11. 2026., novijih izmjena nema.
// Podatke unosimo ručno iz službenog propisa (ne s web-stranica) i jednom godišnje provjerimo.

export type Datum = [dan: number, mjesec: number];

/** Pravilo za jedan dio vrste (npr. jelen / košuta / tele). */
export type Pravilo =
  | { tip: "lovostaj"; od: Datum; do: Datum }
  | { tip: "nema"; uvjet?: string }
  | { tip: "uvjet"; tekst: string }
  | { tip: "zabrana" }
  | { tip: "plan" };

export type Kategorija = "krupna" | "sitna" | "ptice";

export interface Vrsta {
  k: string;
  naziv: string;
  latinski: string;
  kat: Kategorija;
  ikona: string;
  dijelovi: { naziv: string; pravilo: Pravilo }[];
}

export interface Drzava {
  k: string;
  naziv: string;
  zastava: string;
  izvor?: string;
  vrste: Vrsta[];
}

const L = (od: Datum, doD: Datum): Pravilo => ({ tip: "lovostaj", od, do: doD });
const jedan = (pravilo: Pravilo, naziv = "Sve") => [{ naziv, pravilo }];
const ZENKA = "osim ženke kad je visoko bređa ili vodi mladunčad";
const ZENKA_SITNA = "osim ženke kad je visoko bređa ili vodi sitnu mladunčad";

const HRVATSKA: Vrsta[] = [
  // A. Krupna divljač
  { k: "jelen", naziv: "Jelen obični", latinski: "Cervus elaphus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: L([16, 2], [15, 8]) },
    { naziv: "Košuta", pravilo: L([16, 1], [31, 8]) },
    { naziv: "Tele", pravilo: L([1, 3], [31, 8]) },
  ] },
  { k: "lopatar", naziv: "Jelen lopatar", latinski: "Dama dama", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: L([16, 2], [15, 9]) },
    { naziv: "Košuta", pravilo: L([1, 2], [30, 9]) },
    { naziv: "Tele", pravilo: L([1, 3], [30, 9]) },
  ] },
  { k: "aksis", naziv: "Jelen aksis", latinski: "Axis axis", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: { tip: "uvjet", tekst: "lovostaj kad nema očišćene i zrele rogove" } },
    { naziv: "Košuta", pravilo: { tip: "uvjet", tekst: "lovostaj kad je visoko bređa" } },
    { naziv: "Tele", pravilo: { tip: "zabrana" } },
  ] },
  { k: "srna", naziv: "Srna obična", latinski: "Capreolus capreolus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Srnjak", pravilo: L([1, 10], [15, 4]) },
    { naziv: "Srna i lane", pravilo: L([1, 2], [31, 8]) },
  ] },
  { k: "divokoza", naziv: "Divokoza", latinski: "Rupicapra rupicapra", kat: "krupna", ikona: "🐐", dijelovi: jedan(L([1, 2], [30, 9])) },
  { k: "muflon", naziv: "Europski muflon", latinski: "Ovis gmelini musimon", kat: "krupna", ikona: "🐏", dijelovi: [
    { naziv: "Muflon", pravilo: { tip: "nema" } },
    { naziv: "Muflonka i janje", pravilo: L([1, 1], [31, 7]) },
  ] },
  { k: "svinja", naziv: "Divlja svinja", latinski: "Sus scrofa", kat: "krupna", ikona: "🐗", dijelovi: jedan({ tip: "nema", uvjet: ZENKA }) },
  { k: "medvjed", naziv: "Smeđi medvjed", latinski: "Ursus arctos", kat: "krupna", ikona: "🐻", dijelovi: jedan({ tip: "plan" }) },
  // B. Sitna divljač – dlakava
  { k: "zec", naziv: "Zec obični", latinski: "Lepus europaeus", kat: "sitna", ikona: "🐇", dijelovi: jedan(L([16, 1], [30, 9])) },
  { k: "kunic", naziv: "Kunić divlji", latinski: "Oryctolagus cuniculus", kat: "sitna", ikona: "🐇", dijelovi: jedan({ tip: "nema" }) },
  { k: "lisica", naziv: "Lisica", latinski: "Vulpes vulpes", kat: "sitna", ikona: "🦊", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_SITNA }) },
  { k: "cagalj", naziv: "Čagalj", latinski: "Canis aureus", kat: "sitna", ikona: "🐺", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_SITNA }) },
  { k: "jazavac", naziv: "Jazavac", latinski: "Meles meles", kat: "sitna", ikona: "🦡", dijelovi: jedan(L([1, 1], [31, 7])) },
  { k: "kuna-bjelica", naziv: "Kuna bjelica", latinski: "Martes foina", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA }) },
  { k: "kuna-zlatica", naziv: "Kuna zlatica", latinski: "Martes martes", kat: "sitna", ikona: "🦦", dijelovi: jedan(L([1, 3], [31, 10])) },
  { k: "tvor", naziv: "Tvor", latinski: "Mustela putorius", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_SITNA }) },
  { k: "puh", naziv: "Puh veliki", latinski: "Glis glis", kat: "sitna", ikona: "🐭", dijelovi: jedan(L([1, 12], [30, 9])) },
  { k: "macka", naziv: "Mačka divlja", latinski: "Felis silvestris", kat: "sitna", ikona: "🐈", dijelovi: jedan({ tip: "plan" }) },
  { k: "dabar", naziv: "Dabar", latinski: "Castor fiber", kat: "sitna", ikona: "🦫", dijelovi: jedan({ tip: "plan" }) },
  { k: "lasica", naziv: "Lasica mala", latinski: "Mustela nivalis", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "zabrana" }) },
  // B. Sitna divljač – pernata
  { k: "fazan", naziv: "Fazan – gnjetlovi", latinski: "Phasianus sp.", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 2], [15, 9])) },
  { k: "trcka", naziv: "Trčka skvržulja", latinski: "Perdix perdix", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 1], [31, 8])) },
  { k: "grivna", naziv: "Jarebica grivna", latinski: "Alectoris graeca", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([16, 1], [30, 9])) },
  { k: "cukara", naziv: "Jarebica čukara", latinski: "Alectoris chukar", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([16, 1], [30, 9])) },
  { k: "pucpura", naziv: "Prepelica pućpura", latinski: "Coturnix coturnix", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 12], [20, 8])) },
  { k: "virdzinijska", naziv: "Prepelica virdžinijska", latinski: "Coturnix virginiana", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 2], [31, 7])) },
  { k: "bena", naziv: "Šljuka bena", latinski: "Scolopax rusticola", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 3], [30, 9])) },
  { k: "kokosica", naziv: "Šljuka kokošica", latinski: "Gallinago gallinago", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 2], [15, 10])) },
  { k: "grivnjas", naziv: "Golub grivnjaš", latinski: "Columba palumbus", kat: "ptice", ikona: "🕊️", dijelovi: jedan(L([1, 2], [31, 7])) },
  { k: "pecinar", naziv: "Golub pećinar", latinski: "Columba livia", kat: "ptice", ikona: "🕊️", dijelovi: jedan(L([1, 2], [31, 7])) },
  { k: "glogovnjaca", naziv: "Guska glogovnjača", latinski: "Anser fabalis", kat: "ptice", ikona: "🪿", dijelovi: jedan(L([1, 2], [31, 10])) },
  { k: "lisasta", naziv: "Guska lisasta", latinski: "Anser albifrons", kat: "ptice", ikona: "🪿", dijelovi: jedan({ tip: "zabrana" }) },
  { k: "gluhara", naziv: "Patka gluhara", latinski: "Anas platyrhynchos", kat: "ptice", ikona: "🦆", dijelovi: jedan(L([1, 2], [31, 8])) },
  { k: "krunasta", naziv: "Patka krunasta", latinski: "Aythya fuligula", kat: "ptice", ikona: "🦆", dijelovi: jedan(L([1, 2], [31, 8])) },
  { k: "pupcanica", naziv: "Patka pupčanica", latinski: "Anas querquedula", kat: "ptice", ikona: "🦆", dijelovi: jedan(L([1, 2], [31, 8])) },
  { k: "krzulja", naziv: "Patka kržulja", latinski: "Anas crecca", kat: "ptice", ikona: "🦆", dijelovi: jedan(L([1, 2], [31, 8])) },
  { k: "glavata", naziv: "Patka glavata", latinski: "Aythya ferina", kat: "ptice", ikona: "🦆", dijelovi: jedan({ tip: "zabrana" }) },
  { k: "liska", naziv: "Liska crna", latinski: "Fulica atra", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 2], [31, 8])) },
  { k: "vrana", naziv: "Vrana siva", latinski: "Corvus corone cornix", kat: "ptice", ikona: "🐦‍⬛", dijelovi: jedan(L([1, 3], [31, 7])) },
  { k: "gacac", naziv: "Vrana gačac", latinski: "Corvus frugilegus", kat: "ptice", ikona: "🐦‍⬛", dijelovi: jedan(L([1, 3], [31, 7])) },
  { k: "cavka", naziv: "Čavka zlogodnjača", latinski: "Coloeus monedula", kat: "ptice", ikona: "🐦‍⬛", dijelovi: jedan(L([1, 3], [31, 7])) },
  { k: "svraka", naziv: "Svraka", latinski: "Pica pica", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 3], [31, 7])) },
  { k: "sojka", naziv: "Šojka kreštalica", latinski: "Garrulus glandarius", kat: "ptice", ikona: "🐦", dijelovi: jedan(L([1, 3], [31, 7])) },
];

export const DRZAVE: Drzava[] = [
  { k: "hr", naziv: "Hrvatska", zastava: "🇭🇷", izvor: "Pravilnik o lovostaju (NN 94/2019)", vrste: HRVATSKA },
  { k: "ba", naziv: "BiH", zastava: "🇧🇦", vrste: [] },
  { k: "rs", naziv: "Srbija", zastava: "🇷🇸", vrste: [] },
];

export const KATEGORIJE: { k: Kategorija; naziv: string }[] = [
  { k: "krupna", naziv: "Krupna" },
  { k: "sitna", naziv: "Sitna" },
  { k: "ptice", naziv: "Ptice" },
];

const vrijednost = ([d, m]: Datum) => m * 100 + d;

/** Je li lov dopušten (bez obzira na uvjete) za dano pravilo na dani dan. */
export function dopusteno(p: Pravilo, dan: Date): boolean {
  if (p.tip === "nema" || p.tip === "uvjet") return true;
  if (p.tip === "zabrana" || p.tip === "plan") return false;
  const x = (dan.getMonth() + 1) * 100 + dan.getDate();
  const a = vrijednost(p.od);
  const b = vrijednost(p.do);
  const uLovostaju = a <= b ? x >= a && x <= b : x >= a || x <= b;
  return !uLovostaju;
}

/** Ima li pravilo uopće promjenu tijekom godine (lovostaj s datumima). */
export const imaDatume = (p: Pravilo): p is Extract<Pravilo, { tip: "lovostaj" }> => p.tip === "lovostaj";

const sutra = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
export const pocetakDana = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Za koliko dana se mijenja stanje (zatvara ili otvara) – null ako se ne mijenja. */
export function danaDoPromjene(p: Pravilo, danas: Date): number | null {
  if (!imaDatume(p)) return null;
  const sada = dopusteno(p, danas);
  let d = pocetakDana(danas);
  for (let i = 1; i <= 366; i++) {
    d = sutra(d);
    if (dopusteno(p, d) !== sada) return i;
  }
  return null;
}

/** Zadnji dan lova (ako je sada otvoreno) ili prvi dan lova (ako je zatvoreno). */
export function danPromjene(p: Pravilo, danas: Date): Date | null {
  const n = danaDoPromjene(p, danas);
  if (n == null) return null;
  const d = pocetakDana(danas);
  return dopusteno(p, danas) ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + n - 1) : new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export const kratkiDatum = (d: Date | Datum) => (Array.isArray(d) ? `${d[0]}. ${d[1]}.` : `${d.getDate()}. ${d.getMonth() + 1}.`);

/** Razdoblje lova kao tekst (suprotno od lovostaja). */
export function opisLova(p: Pravilo): string {
  switch (p.tip) {
    case "nema":
      return p.uvjet ? `cijele godine (${p.uvjet})` : "cijele godine";
    case "uvjet":
      return p.tekst;
    case "zabrana":
      return "lov nije dopušten";
    case "plan":
      return "samo prema planu gospodarenja";
    default: {
      const od = new Date(2001, p.do[1] - 1, p.do[0] + 1);
      const doD = new Date(2001, p.od[1] - 1, p.od[0] - 1);
      return `lov ${kratkiDatum(od)} – ${kratkiDatum(doD)}`;
    }
  }
}

export function opisLovostaja(p: Pravilo): string | null {
  return imaDatume(p) ? `lovostaj ${kratkiDatum(p.od)} – ${kratkiDatum(p.do)}` : null;
}

/** Lovna godina počinje 1. 4. – vraća godinu početka (npr. 2026 za 2026./27.). */
export const lovnaGodina = (d: Date) => (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1);

/** Otvoreni dijelovi trake kroz lovnu godinu (postoci od 1. 4.), za prikaz. */
export function trake(p: Pravilo, godina: number): { od: number; do: number; uvjet: boolean }[] {
  if (p.tip === "zabrana" || p.tip === "plan") return [];
  const uvjet = p.tip === "uvjet" || (p.tip === "nema" && !!p.uvjet);
  if (p.tip !== "lovostaj") return [{ od: 0, do: 100, uvjet }];
  const start = new Date(godina, 3, 1);
  const kraj = new Date(godina + 1, 3, 1);
  const ukupno = Math.round((kraj.getTime() - start.getTime()) / 864e5);
  const rez: { od: number; do: number; uvjet: boolean }[] = [];
  let pocetak: number | null = null;
  for (let i = 0; i <= ukupno; i++) {
    const d = new Date(godina, 3, 1 + i);
    const otv = i < ukupno && dopusteno(p, d);
    if (otv && pocetak == null) pocetak = i;
    if (!otv && pocetak != null) {
      rez.push({ od: (pocetak / ukupno) * 100, do: (i / ukupno) * 100, uvjet: false });
      pocetak = null;
    }
  }
  return rez;
}

/** Položaj današnjeg dana u lovnoj godini (postotak). */
export function polozajDana(d: Date): number {
  const g = lovnaGodina(d);
  const start = new Date(g, 3, 1).getTime();
  const kraj = new Date(g + 1, 3, 1).getTime();
  return ((pocetakDana(d).getTime() - start) / (kraj - start)) * 100;
}

export const vrstaOtvorena = (v: Vrsta, d: Date) => v.dijelovi.some((x) => dopusteno(x.pravilo, d));

/** Dijelovi koji se uskoro zatvaraju (do `dana` dana). */
export function uskoroZatvara(vrste: Vrsta[], d: Date, dana = 30) {
  const rez: { vrsta: Vrsta; dio: string; zadnji: Date; za: number }[] = [];
  for (const v of vrste)
    for (const x of v.dijelovi) {
      if (!imaDatume(x.pravilo) || !dopusteno(x.pravilo, d)) continue;
      const n = danaDoPromjene(x.pravilo, d);
      const zadnji = danPromjene(x.pravilo, d);
      if (n != null && zadnji && n <= dana) rez.push({ vrsta: v, dio: v.dijelovi.length > 1 ? x.naziv : v.naziv, zadnji, za: n });
    }
  return rez.sort((a, b) => a.za - b.za);
}

/** Vrste u lovostaju s datumom otvaranja (samo one koje imaju datume). */
export function uLovostaju(vrste: Vrsta[], d: Date) {
  const rez: { vrsta: Vrsta; dio: string; otvara: Date; za: number }[] = [];
  for (const v of vrste)
    for (const x of v.dijelovi) {
      if (!imaDatume(x.pravilo) || dopusteno(x.pravilo, d)) continue;
      const n = danaDoPromjene(x.pravilo, d);
      const otvara = danPromjene(x.pravilo, d);
      if (n != null && otvara) rez.push({ vrsta: v, dio: v.dijelovi.length > 1 ? x.naziv : v.naziv, otvara, za: n });
    }
  return rez.sort((a, b) => a.za - b.za);
}
