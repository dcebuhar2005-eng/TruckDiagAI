// Lovni kalendar: lovostaj po vrstama divljači i državama.
// Hrvatska: Pravilnik o lovostaju (NN 94/2019) – provjereno 4. 11. 2026., novijih izmjena nema.
// Srbija: Pravilnik o proglašavanju lovostajem zaštićenih vrsta divljači (Sl. glasnik RS 9/2012 … 6/2026) – provjereno 5. 11. 2026.
// BiH – Federacija: Pravilnik o vremenu lova lovostajem zaštićene divljači (federalni ministar, 2008.) – provjereno 5. 11. 2026.
// Slovenija: Uredba o določitvi divjadi in lovnih dob (Uradni list RS 101/04, 81/14) – provjereno 6. 11. 2026.
// BiH – Republika Srpska: Naredba o vremenu lova lovostajem zaštićene divljači (Sl. glasnik RS 105/2024) – provjereno 5. 11. 2026.
// Podatke unosimo ručno iz službenog propisa (ne s web-stranica) i jednom godišnje provjerimo.

export type Datum = [dan: number, mjesec: number];

/** Pravilo za jedan dio vrste (npr. jelen / košuta / tele). */
export type Pravilo =
  | { tip: "lovostaj"; od: Datum; do: Datum; /** dodatna razdoblja lovostaja (kad vrsta ima dva lova godišnje) */ jos?: { od: Datum; do: Datum }[] }
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
  dijelovi: { naziv: string; pravilo: Pravilo; napomena?: string }[];
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
const MJ = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const uDan = ([d, m]: Datum) => MJ.slice(0, m - 1).reduce((a, x) => a + x, 0) + Math.min(d, MJ[m - 1]) - 1;
const izDana = (i: number): Datum => {
  let m = 0;
  while (i >= MJ[m]) i -= MJ[m++];
  return [i + 1, m + 1];
};
/** Lovna sezona kako piše u propisu (kad se SMIJE loviti) → lovostaj. 29. 2. se računa kao kraj veljače. */
function S(...sezone: [Datum, Datum][]): Pravilo {
  const otv = new Array<boolean>(365).fill(false);
  for (const [od, doD] of sezone) {
    const a = uDan(od);
    const b = uDan(doD);
    for (let i = a; ; i = (i + 1) % 365) {
      otv[i] = true;
      if (i === b) break;
    }
  }
  const pocetak = otv.indexOf(true);
  if (pocetak < 0) return { tip: "zabrana" };
  const zatvoreno: { od: Datum; do: Datum }[] = [];
  let od: number | null = null;
  for (let k = 1; k <= 365; k++) {
    const i = (pocetak + k) % 365;
    if (!otv[i] && od == null) od = i;
    if (otv[i] && od != null) {
      zatvoreno.push({ od: izDana(od), do: izDana((i + 364) % 365) });
      od = null;
    }
  }
  if (!zatvoreno.length) return { tip: "nema" };
  const [prvi, ...jos] = zatvoreno;
  return jos.length ? { tip: "lovostaj", ...prvi, jos } : { tip: "lovostaj", ...prvi };
}
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

const SAMO_STETE = "lovi se samo radi sprječavanja šteta, prema godišnjem planu";
const ZENKA_RS = "osim ženke dok je visoko bređa, nosi jaja ili odgaja mladunce";

// Srbija – Pravilnik o proglašavanju lovostajem zaštićenih vrsta divljači (Sl. glasnik RS 9/2012 … 6/2026), Prilog.
const SRBIJA: Vrsta[] = [
  // Krupna divljač
  { k: "jelen", naziv: "Jelen obični", latinski: "Cervus elaphus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[1, 8], [15, 2]]) },
    { naziv: "Košuta i tele", pravilo: S([[1, 8], [15, 2]]) },
  ] },
  { k: "lopatar", naziv: "Jelen lopatar", latinski: "Dama dama", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[1, 9], [15, 2]]) },
    { naziv: "Košuta i jelenče", pravilo: S([[1, 9], [15, 2]]) },
  ] },
  { k: "virdzinijski", naziv: "Jelen virdžinijski", latinski: "Odocoileus virginianus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[1, 9], [15, 2]]) },
    { naziv: "Košuta i tele", pravilo: S([[1, 9], [15, 2]]) },
  ] },
  { k: "srna", naziv: "Srna", latinski: "Capreolus capreolus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Srndać", pravilo: S([[15, 4], [30, 9]]) },
    { naziv: "Srna i lane", pravilo: S([[1, 9], [31, 1]]) },
  ] },
  { k: "divokoza", naziv: "Divokoza", latinski: "Rupicapra rupicapra", kat: "krupna", ikona: "🐐", dijelovi: [
    { naziv: "Divojarac", pravilo: S([[1, 7], [31, 1]]) },
    { naziv: "Divokoza i divojare", pravilo: S([[1, 9], [31, 1]]) },
  ] },
  { k: "muflon", naziv: "Muflon", latinski: "Ovis aries musimon", kat: "krupna", ikona: "🐏", dijelovi: [
    { naziv: "Muflon", pravilo: { tip: "nema" } },
    { naziv: "Muflonka i jagnje", pravilo: S([[1, 10], [31, 1]]) },
  ] },
  { k: "svinja", naziv: "Divlja svinja", latinski: "Sus scrofa", kat: "krupna", ikona: "🐗", dijelovi: [
    { naziv: "Vepar", pravilo: { tip: "nema" } },
    { naziv: "Krmača", pravilo: S([[1, 7], [28, 2]]), napomena: "radi suzbijanja afričke kuge svinja lov krmače moguć i u lovostaju, uz prethodno obavještavanje veterinarskog i lovnog inspektora" },
    { naziv: "Prase i nazime", pravilo: { tip: "nema" } },
  ] },
  { k: "medvjed", naziv: "Mrki medvjed", latinski: "Ursus arctos", kat: "krupna", ikona: "🐻", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićen") },
  { k: "vuk", naziv: "Vuk", latinski: "Canis lupus", kat: "krupna", ikona: "🐺", dijelovi: [
    { naziv: "Vuk", pravilo: S([[1, 7], [31, 3]]), napomena: "u AP Vojvodini strogo zaštićen" },
  ] },
  // Sitna dlakava divljač i zvijeri
  { k: "zec", naziv: "Zec", latinski: "Lepus europaeus", kat: "sitna", ikona: "🐇", dijelovi: [
    { naziv: "Zec", pravilo: S([[15, 10], [31, 12]]), napomena: "od 15. 10. prvi (probni) lov; daljnji lov ovisi o analizi uzoraka iz probnog lova" },
  ] },
  { k: "lisica", naziv: "Lisica", latinski: "Vulpes vulpes", kat: "sitna", ikona: "🦊", dijelovi: jedan({ tip: "nema" }) },
  { k: "cagalj", naziv: "Šakal (čagalj)", latinski: "Canis aureus", kat: "sitna", ikona: "🐺", dijelovi: jedan({ tip: "nema" }) },
  { k: "jazavac", naziv: "Jazavac", latinski: "Meles meles", kat: "sitna", ikona: "🦡", dijelovi: jedan(S([[1, 7], [28, 2]])) },
  { k: "kuna-bjelica", naziv: "Kuna belica", latinski: "Martes foina", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 10], [28, 2]])) },
  { k: "kuna-zlatica", naziv: "Kuna zlatica", latinski: "Martes martes", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 10], [28, 2]])) },
  { k: "macka", naziv: "Divlja mačka", latinski: "Felis silvestris", kat: "sitna", ikona: "🐈", dijelovi: [
    { naziv: "Divlja mačka", pravilo: S([[1, 7], [28, 2]]), napomena: "u AP Vojvodini strogo zaštićena" },
  ] },
  { k: "puh", naziv: "Sivi puh", latinski: "Glis glis", kat: "sitna", ikona: "🐭", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "vjeverica", naziv: "Veverica", latinski: "Sciurus vulgaris", kat: "sitna", ikona: "🐿️", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "rakunopas", naziv: "Rakunoliki pas", latinski: "Nyctereutes procyonoides", kat: "sitna", ikona: "🦝", dijelovi: jedan({ tip: "nema" }) },
  { k: "nutrija", naziv: "Nutrija", latinski: "Myocastor coypus", kat: "sitna", ikona: "🐀", dijelovi: jedan({ tip: "nema" }) },
  { k: "ondatra", naziv: "Ondatra", latinski: "Ondatra zibethicus", kat: "sitna", ikona: "🐀", dijelovi: jedan({ tip: "nema" }) },
  { k: "tvor", naziv: "Mrki tvor", latinski: "Mustela putorius", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "zabrana" }, "Lovostaj cijele godine") },
  { k: "lasica", naziv: "Lasica", latinski: "Mustela nivalis", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "zabrana" }, "Lovostaj cijele godine") },
  { k: "dabar", naziv: "Dabar", latinski: "Castor fiber", kat: "sitna", ikona: "🦫", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićen") },
  // Pernata divljač
  { k: "fazan", naziv: "Fazan", latinski: "Phasianus colchicus", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 10], [31, 1]])) },
  { k: "trcka", naziv: "Poljska jarebica", latinski: "Perdix perdix", kat: "ptice", ikona: "🐦", dijelovi: [
    { naziv: "Poljska jarebica", pravilo: { tip: "zabrana" }, napomena: "privremeni lovostaj do 14. 10. 2027.; nakon toga lov 15. 10. – 30. 11." },
  ] },
  { k: "pucpura", naziv: "Prepelica", latinski: "Coturnix coturnix", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 8], [30, 9]])) },
  { k: "grlica", naziv: "Grlica", latinski: "Streptopelia turtur", kat: "ptice", ikona: "🕊️", dijelovi: [
    { naziv: "Grlica", pravilo: { tip: "zabrana" }, napomena: "privremeni lovostaj do 14. 8. 2027.; nakon toga lov 15. 8. – 30. 9." },
  ] },
  { k: "gugutka", naziv: "Gugutka", latinski: "Streptopelia decaocto", kat: "ptice", ikona: "🕊️", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "grivnjas", naziv: "Divlji golub grivnaš", latinski: "Columba palumbus", kat: "ptice", ikona: "🕊️", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "bena", naziv: "Šumska šljuka", latinski: "Scolopax rusticola", kat: "ptice", ikona: "🐦", dijelovi: [
    { naziv: "Šumska šljuka", pravilo: S([[1, 10], [31, 1]]), napomena: "lovostajem zaštićena vrsta na područjima do 500 m nadmorske visine" },
  ] },
  { k: "gluhara", naziv: "Patka gluvara", latinski: "Anas platyrhynchos", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "krzulja", naziv: "Patka kržulja", latinski: "Anas crecca", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "zvizdara", naziv: "Patka zviždara", latinski: "Anas penelope", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "pupcanica", naziv: "Patka pupčanica", latinski: "Anas querquedula", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "glavata", naziv: "Patka riđoglava", latinski: "Aythya ferina", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "lisasta", naziv: "Guska lisasta", latinski: "Anser albifrons", kat: "ptice", ikona: "🪿", dijelovi: jedan(S([[1, 10], [28, 2]])) },
  { k: "glogovnjaca", naziv: "Guska glogovnjača", latinski: "Anser fabalis", kat: "ptice", ikona: "🪿", dijelovi: jedan(S([[1, 10], [28, 2]])) },
  { k: "liska", naziv: "Crna liska", latinski: "Fulica atra", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "kokica", naziv: "Barska kokica", latinski: "Gallinula chloropus", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "sojka", naziv: "Sojka", latinski: "Garrulus glandarius", kat: "ptice", ikona: "🐦", dijelovi: [{ naziv: "Sve", pravilo: S([[1, 8], [28, 2]]), napomena: SAMO_STETE }] },
  { k: "gacac", naziv: "Gačac", latinski: "Corvus frugilegus", kat: "ptice", ikona: "🐦‍⬛", dijelovi: [{ naziv: "Sve", pravilo: S([[1, 8], [28, 2]]), napomena: SAMO_STETE }] },
  { k: "vrana", naziv: "Siva vrana", latinski: "Corvus cornix", kat: "ptice", ikona: "🐦‍⬛", dijelovi: [{ naziv: "Sve", pravilo: { tip: "nema" }, napomena: SAMO_STETE }] },
  { k: "svraka", naziv: "Svraka", latinski: "Pica pica", kat: "ptice", ikona: "🐦", dijelovi: [{ naziv: "Sve", pravilo: { tip: "nema" }, napomena: SAMO_STETE }] },
  { k: "kormoran", naziv: "Veliki kormoran", latinski: "Phalacrocorax carbo", kat: "ptice", ikona: "🐦‍⬛", dijelovi: [{ naziv: "Sve", pravilo: { tip: "nema" }, napomena: "samo radi sprječavanja šteta (ribnjaci, uzgajališta), prema godišnjem planu" }] },
  { k: "caplja", naziv: "Siva čaplja", latinski: "Ardea cinerea", kat: "ptice", ikona: "🐦", dijelovi: [{ naziv: "Sve", pravilo: { tip: "nema" }, napomena: "samo radi sprječavanja šteta (ribnjaci, uzgajališta), prema godišnjem planu" }] },
  { k: "kokosar", naziv: "Jastreb kokošar", latinski: "Accipiter gentilis", kat: "ptice", ikona: "🦅", dijelovi: [{ naziv: "Sve", pravilo: { tip: "nema" }, napomena: "samo radi sprječavanja šteta (ribnjaci, uzgajališta), prema godišnjem planu" }] },
  { k: "grivna", naziv: "Jarebica kamenjarka", latinski: "Alectoris graeca", kat: "ptice", ikona: "🐦", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićena") },
  { k: "kokosica", naziv: "Barska šljuka bekasina", latinski: "Gallinago gallinago", kat: "ptice", ikona: "🐦", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićena") },
  { k: "tetrijeb", naziv: "Veliki tetreb", latinski: "Tetrao urogallus", kat: "ptice", ikona: "🐦", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićen") },
  { k: "ljestarka", naziv: "Leštarka", latinski: "Bonasa bonasia", kat: "ptice", ikona: "🐦", dijelovi: jedan({ tip: "zabrana" }, "Trajno zaštićena") },
];

// BiH – Federacija: Pravilnik o vremenu lova lovostajem zaštićene divljači (2008.), čl. 2.
const NEZASTICENA_FBIH = "nije lovostajem zaštićena (Zakon o lovstvu FBiH, čl. 17) – lovi se prema planu lovišta";
const FBIH: Vrsta[] = [
  { k: "srna", naziv: "Srna", latinski: "Capreolus capreolus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Srndać – nizinska i brdska lovišta", pravilo: S([[1, 5], [30, 9]]) },
    { naziv: "Srndać – planinska lovišta", pravilo: S([[1, 6], [30, 10]]) },
    { naziv: "Srna i lane", pravilo: S([[1, 10], [31, 1]]) },
  ] },
  { k: "lopatar", naziv: "Jelen lopatar", latinski: "Dama dama", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[16, 9], [31, 1]]) },
    { naziv: "Košuta i tele", pravilo: S([[16, 9], [31, 1]]) },
  ] },
  { k: "divokoza", naziv: "Divokoza", latinski: "Rupicapra rupicapra", kat: "krupna", ikona: "🐐", dijelovi: jedan(S([[1, 9], [31, 12]])) },
  { k: "kozorog", naziv: "Kozorog", latinski: "Capra ibex", kat: "krupna", ikona: "🐐", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "muflon", naziv: "Muflon", latinski: "Ovis aries musimon", kat: "krupna", ikona: "🐏", dijelovi: [
    { naziv: "Muflon", pravilo: S([[1, 9], [31, 1]]) },
    { naziv: "Muflonka i janje", pravilo: { tip: "nema" } },
  ] },
  { k: "svinja", naziv: "Divlja svinja", latinski: "Sus scrofa", kat: "krupna", ikona: "🐗", dijelovi: [
    { naziv: "Vepar i nazime", pravilo: { tip: "nema" } },
    { naziv: "Krmača i prase", pravilo: S([[1, 8], [31, 12]]) },
  ] },
  { k: "medvjed", naziv: "Mrki medvjed", latinski: "Ursus arctos", kat: "krupna", ikona: "🐻", dijelovi: [
    { naziv: "Medvjed", pravilo: S([[1, 10], [31, 12]], [[1, 3], [15, 5]]), napomena: "lovostajem zaštićen na uzgojnim područjima; odstrel prema planu gospodarenja" },
  ] },
  { k: "vuk", naziv: "Vuk", latinski: "Canis lupus", kat: "krupna", ikona: "🐺", dijelovi: [
    { naziv: "Mužjak", pravilo: { tip: "nema" } },
    { naziv: "Ženka i mladi", pravilo: S([[1, 7], [28, 2]]) },
  ] },
  { k: "zec", naziv: "Zec", latinski: "Lepus europaeus", kat: "sitna", ikona: "🐇", dijelovi: jedan(S([[1, 10], [31, 12]])) },
  { k: "kuna-bjelica", naziv: "Kuna bjelica", latinski: "Martes foina", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 10], [28, 2]])) },
  { k: "kuna-zlatica", naziv: "Kuna zlatica", latinski: "Martes martes", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 11], [28, 2]])) },
  { k: "lisica", naziv: "Lisica", latinski: "Vulpes vulpes", kat: "sitna", ikona: "🦊", dijelovi: jedan({ tip: "uvjet", tekst: NEZASTICENA_FBIH }) },
  { k: "cagalj", naziv: "Čagalj", latinski: "Canis aureus", kat: "sitna", ikona: "🐺", dijelovi: jedan({ tip: "uvjet", tekst: NEZASTICENA_FBIH }) },
  { k: "jazavac", naziv: "Jazavac", latinski: "Meles meles", kat: "sitna", ikona: "🦡", dijelovi: jedan({ tip: "uvjet", tekst: NEZASTICENA_FBIH }) },
  { k: "tetrijeb", naziv: "Veliki tetrijeb", latinski: "Tetrao urogallus", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 3], [31, 5]]), "Mužjak") },
  { k: "ljestarka", naziv: "Lještarka", latinski: "Bonasa bonasia", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[16, 8], [31, 10]]), "Mužjak") },
  { k: "fazan", naziv: "Fazan – gnjetao", latinski: "Phasianus spp.", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 10], [15, 1]])) },
  { k: "grivna", naziv: "Jarebica kamenjarka", latinski: "Alectoris graeca", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 9], [31, 12]])) },
  { k: "trcka", naziv: "Jarebica poljska – trčka", latinski: "Perdix perdix", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 9], [31, 12]])) },
  { k: "pucpura", naziv: "Prepelica", latinski: "Coturnix coturnix", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "bena", naziv: "Šljuka šumska", latinski: "Scolopax rusticola", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 10], [1, 3]])) },
  { k: "kokosica", naziv: "Bekasina", latinski: "Gallinago gallinago", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 10], [1, 3]])) },
  { k: "golubovi", naziv: "Golubovi", latinski: "Columba spp.", kat: "ptice", ikona: "🕊️", dijelovi: jedan(S([[1, 8], [31, 1]])) },
  { k: "grlica", naziv: "Grlica", latinski: "Streptopelia turtur", kat: "ptice", ikona: "🕊️", dijelovi: jedan(S([[1, 8], [31, 1]])) },
  { k: "guske", naziv: "Guske divlje", latinski: "Anser spp.", kat: "ptice", ikona: "🪿", dijelovi: jedan(S([[1, 9], [31, 1]])) },
  { k: "patke", naziv: "Patke divlje", latinski: "Anas spp.", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [1, 3]])) },
  { k: "liska", naziv: "Liska crna", latinski: "Fulica atra", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [31, 1]])) },
];

// BiH – Republika Srpska: Naredba o vremenu lova lovostajem zaštićene divljači (Sl. glasnik RS 105/2024).
const RSRP: Vrsta[] = [
  { k: "srna", naziv: "Srna", latinski: "Capreolus capreolus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Srndać", pravilo: S([[1, 5], [30, 9]]) },
    { naziv: "Srna i lane", pravilo: S([[1, 10], [31, 1]]) },
  ] },
  { k: "jelen", naziv: "Jelen obični", latinski: "Cervus elaphus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[1, 9], [31, 1]]) },
    { naziv: "Košuta i tele", pravilo: S([[16, 9], [31, 1]]) },
  ] },
  { k: "lopatar", naziv: "Jelen lopatar", latinski: "Dama dama", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[1, 9], [31, 1]]) },
    { naziv: "Košuta i tele", pravilo: S([[16, 9], [31, 1]]) },
  ] },
  { k: "divokoza", naziv: "Divokoza", latinski: "Rupicapra rupicapra", kat: "krupna", ikona: "🐐", dijelovi: [
    { naziv: "Divojarac", pravilo: S([[1, 8], [31, 1]]) },
    { naziv: "Divokoza i jare", pravilo: S([[1, 9], [31, 12]]) },
  ] },
  { k: "muflon", naziv: "Muflon", latinski: "Ovis aries musimon", kat: "krupna", ikona: "🐏", dijelovi: [
    { naziv: "Muflon", pravilo: { tip: "nema" } },
    { naziv: "Ovca i jagnje", pravilo: S([[1, 9], [31, 1]]) },
  ] },
  { k: "svinja", naziv: "Divlja svinja", latinski: "Sus scrofa", kat: "krupna", ikona: "🐗", dijelovi: [
    { naziv: "Vepar i nazime", pravilo: { tip: "nema" } },
    { naziv: "Krmača i prase", pravilo: S([[1, 7], [15, 1]]) },
  ] },
  { k: "medvjed", naziv: "Mrki medvjed", latinski: "Ursus arctos", kat: "krupna", ikona: "🐻", dijelovi: jedan(S([[1, 10], [15, 5]])) },
  { k: "vuk", naziv: "Vuk", latinski: "Canis lupus", kat: "krupna", ikona: "🐺", dijelovi: [
    { naziv: "Mužjak", pravilo: { tip: "nema" } },
    { naziv: "Ženka i mladi", pravilo: S([[1, 7], [28, 2]]) },
  ] },
  { k: "zec", naziv: "Zec", latinski: "Lepus europaeus", kat: "sitna", ikona: "🐇", dijelovi: jedan(S([[1, 10], [5, 12]])) },
  { k: "macka", naziv: "Divlja mačka", latinski: "Felis silvestris", kat: "sitna", ikona: "🐈", dijelovi: jedan(S([[1, 7], [28, 2]])) },
  { k: "dabar", naziv: "Dabar", latinski: "Castor fiber", kat: "sitna", ikona: "🦫", dijelovi: jedan(S([[1, 8], [31, 3]])) },
  { k: "puh", naziv: "Veliki puh", latinski: "Glis glis", kat: "sitna", ikona: "🐭", dijelovi: jedan(S([[15, 8], [1, 12]])) },
  { k: "lisica", naziv: "Lisica", latinski: "Vulpes vulpes", kat: "sitna", ikona: "🦊", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "cagalj", naziv: "Šakal (čagalj)", latinski: "Canis aureus", kat: "sitna", ikona: "🐺", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "jazavac", naziv: "Jazavac", latinski: "Meles meles", kat: "sitna", ikona: "🦡", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "kuna-bjelica", naziv: "Kuna bjelica", latinski: "Martes foina", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "kuna-zlatica", naziv: "Kuna zlatica", latinski: "Martes martes", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "tvor", naziv: "Tvor", latinski: "Mustela putorius", kat: "sitna", ikona: "🦦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "rakunopas", naziv: "Rakunopas", latinski: "Nyctereutes procyonoides", kat: "sitna", ikona: "🦝", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "nutrija", naziv: "Nutrija", latinski: "Myocastor coypus", kat: "sitna", ikona: "🐀", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "tetrijeb", naziv: "Veliki tetrijeb", latinski: "Tetrao urogallus", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 3], [20, 5]]), "Mužjak") },
  { k: "ljestarka", naziv: "Lještarka", latinski: "Bonasa bonasia", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [31, 12]]), "Mužjak") },
  { k: "fazan", naziv: "Fazan", latinski: "Phasianus spp.", kat: "ptice", ikona: "🐦", dijelovi: [
    { naziv: "Iz slobodne prirode", pravilo: S([[15, 9], [5, 1]]) },
    { naziv: "Iz vještačkog uzgoja", pravilo: S([[15, 9], [31, 3]]) },
  ] },
  { k: "grivna", naziv: "Jarebica kamenjarka", latinski: "Alectoris graeca", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 9], [5, 1]])) },
  { k: "trcka", naziv: "Jarebica poljska", latinski: "Perdix perdix", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[15, 9], [5, 1]])) },
  { k: "pucpura", naziv: "Prepelica", latinski: "Coturnix coturnix", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "sljuke", naziv: "Šljuke (šumska, bekasina, kozica)", latinski: "Scolopacidae", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "golubovi", naziv: "Golubovi (divlji, grivnjaš) i grlica", latinski: "Columbidae", kat: "ptice", ikona: "🕊️", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "patke", naziv: "Patke (gluvara, kržulja) i divlja guska", latinski: "Anatidae", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "liska", naziv: "Crna liska", latinski: "Fulica atra", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "vrane", naziv: "Vrane, svraka, čavka, gačac, šojka", latinski: "Corvidae", kat: "ptice", ikona: "🐦‍⬛", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "caplja", naziv: "Siva čaplja i veliki kormoran", latinski: "Ardea cinerea, Phalacrocorax carbo", kat: "ptice", ikona: "🐦", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
  { k: "kokosar", naziv: "Jastreb kokošar", latinski: "Accipiter gentilis", kat: "ptice", ikona: "🦅", dijelovi: jedan({ tip: "nema", uvjet: ZENKA_RS }) },
];

// Slovenija – Uredba o določitvi divjadi in lovnih dob (Uradni list RS, št. 101/04 in 81/14), 4. člen.
// „Lanščak/mladica” = grlo u drugoj godini; odrasli razredi = treća godina i stariji.
const SLO_DVIJE = "jednogodišnjak (lanščak) = grlo u drugoj godini života";
const SLOVENIJA: Vrsta[] = [
  { k: "srna", naziv: "Srna", latinski: "Capreolus capreolus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Srnjak i jednogodišnjak (lanščak)", pravilo: S([[1, 5], [31, 10]]), napomena: SLO_DVIJE },
    { naziv: "Srna i lanad", pravilo: S([[1, 9], [31, 12]]) },
    { naziv: "Jednogodišnja srna (mladica)", pravilo: S([[1, 5], [31, 12]]) },
  ] },
  { k: "jelen", naziv: "Jelen obični", latinski: "Cervus elaphus", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[16, 8], [31, 12]]) },
    { naziv: "Košuta", pravilo: S([[1, 9], [31, 12]]) },
    { naziv: "Telad", pravilo: S([[1, 9], [31, 1]]) },
    { naziv: "Junica i jednogodišnjak (lanščak)", pravilo: S([[1, 7], [31, 1]]), napomena: SLO_DVIJE },
  ] },
  { k: "lopatar", naziv: "Jelen lopatar", latinski: "Dama dama", kat: "krupna", ikona: "🦌", dijelovi: [
    { naziv: "Jelen", pravilo: S([[16, 8], [31, 12]]) },
    { naziv: "Košuta", pravilo: S([[1, 9], [31, 12]]) },
    { naziv: "Telad", pravilo: S([[1, 9], [31, 1]]) },
    { naziv: "Junica i jednogodišnjak (lanščak)", pravilo: S([[1, 7], [31, 1]]) },
  ] },
  { k: "muflon", naziv: "Muflon", latinski: "Ovis aries musimon", kat: "krupna", ikona: "🐏", dijelovi: [
    { naziv: "Ovan, jednogodišnjaci i janjad", pravilo: S([[1, 8], [28, 2]]) },
    { naziv: "Ovca", pravilo: S([[1, 8], [31, 12]]) },
  ] },
  { k: "divokoza", naziv: "Divokoza (gams)", latinski: "Rupicapra rupicapra", kat: "krupna", ikona: "🐐", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "kozorog", naziv: "Alpski kozorog", latinski: "Capra ibex", kat: "krupna", ikona: "🐐", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "svinja", naziv: "Divlja svinja", latinski: "Sus scrofa", kat: "krupna", ikona: "🐗", dijelovi: [
    { naziv: "Vepar", pravilo: { tip: "nema" } },
    { naziv: "Krmača", pravilo: S([[1, 7], [31, 1]]) },
    { naziv: "Prasad i jednogodišnjaci", pravilo: { tip: "nema" } },
  ] },
  { k: "zec", naziv: "Zec", latinski: "Lepus europaeus", kat: "sitna", ikona: "🐇", dijelovi: jedan(S([[1, 10], [15, 12]])) },
  { k: "kuna-bjelica", naziv: "Kuna bjelica", latinski: "Martes foina", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 11], [28, 2]])) },
  { k: "kuna-zlatica", naziv: "Kuna zlatica", latinski: "Martes martes", kat: "sitna", ikona: "🦦", dijelovi: jedan(S([[1, 11], [28, 2]])) },
  { k: "jazavac", naziv: "Jazavac", latinski: "Meles meles", kat: "sitna", ikona: "🦡", dijelovi: jedan(S([[1, 8], [31, 12]])) },
  { k: "lisica", naziv: "Lisica", latinski: "Vulpes vulpes", kat: "sitna", ikona: "🦊", dijelovi: jedan(S([[1, 7], [15, 3]])) },
  { k: "cagalj", naziv: "Čagalj (šakal)", latinski: "Canis aureus", kat: "sitna", ikona: "🐺", dijelovi: jedan(S([[1, 7], [15, 3]])) },
  { k: "rakunopas", naziv: "Rakunopas", latinski: "Nyctereutes procyonoides", kat: "sitna", ikona: "🦝", dijelovi: jedan(S([[1, 8], [31, 3]])) },
  { k: "puh", naziv: "Puh", latinski: "Glis glis", kat: "sitna", ikona: "🐭", dijelovi: jedan(S([[1, 10], [30, 11]])) },
  { k: "svizac", naziv: "Alpski svizac", latinski: "Marmota marmota", kat: "sitna", ikona: "🐿️", dijelovi: jedan(S([[1, 9], [30, 10]])) },
  { k: "ondatra", naziv: "Bizamski štakor (pižmovka)", latinski: "Ondatra zibethicus", kat: "sitna", ikona: "🐀", dijelovi: jedan({ tip: "nema" }) },
  { k: "nutrija", naziv: "Nutrija", latinski: "Myocastor coypus", kat: "sitna", ikona: "🐀", dijelovi: jedan({ tip: "nema" }) },
  { k: "fazan", naziv: "Fazan", latinski: "Phasianus colchicus", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 9], [28, 2]])) },
  { k: "trcka", naziv: "Trčka (uzgojena)", latinski: "Perdix perdix", kat: "ptice", ikona: "🐦", dijelovi: [
    { naziv: "Sve", pravilo: S([[1, 9], [15, 11]]), napomena: "lovi se samo uzgojena trčka" },
  ] },
  { k: "gluhara", naziv: "Patka gluhara (mlakarica)", latinski: "Anas platyrhynchos", kat: "ptice", ikona: "🦆", dijelovi: jedan(S([[1, 9], [15, 1]])) },
  { k: "sojka", naziv: "Šojka", latinski: "Garrulus glandarius", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "svraka", naziv: "Svraka", latinski: "Pica pica", kat: "ptice", ikona: "🐦", dijelovi: jedan(S([[1, 8], [28, 2]])) },
  { k: "vrana", naziv: "Siva vrana", latinski: "Corvus cornix", kat: "ptice", ikona: "🐦‍⬛", dijelovi: jedan(S([[1, 8], [28, 2]])) },
];

export const DRZAVE: Drzava[] = [
  { k: "hr", naziv: "Hrvatska", zastava: "🇭🇷", izvor: "Pravilnik o lovostaju (NN 94/2019)", vrste: HRVATSKA },
  { k: "fbih", naziv: "BiH – Federacija", zastava: "🇧🇦", izvor: "Pravilnik o vremenu lova lovostajem zaštićene divljači (Federacija BiH, 2008.)", vrste: FBIH },
  { k: "rsrp", naziv: "BiH – Republika Srpska", zastava: "🇧🇦", izvor: "Naredba o vremenu lova lovostajem zaštićene divljači (Sl. glasnik Republike Srpske 105/2024)", vrste: RSRP },
  { k: "si", naziv: "Slovenija", zastava: "🇸🇮", izvor: "Uredba o določitvi divjadi in lovnih dob (Uradni list RS, št. 101/04 in 81/14)", vrste: SLOVENIJA },
  { k: "rs", naziv: "Srbija", zastava: "🇷🇸", izvor: "Pravilnik o proglašavanju lovostajem zaštićenih vrsta divljači (Sl. glasnik RS 9/2012 … 6/2026)", vrste: SRBIJA },
];

/* ---------------- Odabrana država ---------------- */

const KLJUC_DRZAVE = "lovacki-dnevnik:kalendar-drzava";

/** Pogodi državu po vremenskoj zoni i jeziku uređaja (BiH: srpski jezik → Republika Srpska). */
export function pogodiDrzavu(): string {
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const jezici = (navigator.languages?.length ? navigator.languages : [navigator.language]).map((j) => j.toLowerCase());
    const prvi = jezici[0] ?? "";
    if (zona === "Europe/Belgrade") return "rs";
    if (zona === "Europe/Sarajevo") return prvi.startsWith("sr") ? "rsrp" : "fbih";
    if (zona === "Europe/Zagreb") return "hr";
    if (zona === "Europe/Ljubljana") return "si";
    if (prvi.startsWith("sr")) return "rs";
    if (prvi.startsWith("bs")) return "fbih";
    if (prvi.startsWith("sl")) return "si";
  } catch {}
  return "hr";
}

/** Država koju je korisnik zadnju odabrao u kalendaru (ili pogođena). */
export function odabranaDrzava(): string {
  try {
    const k = localStorage.getItem(KLJUC_DRZAVE);
    if (k && DRZAVE.some((d) => d.k === k && d.vrste.length)) return k;
  } catch {}
  return pogodiDrzavu();
}

export function spremiDrzavu(k: string) {
  try {
    localStorage.setItem(KLJUC_DRZAVE, k);
  } catch {}
}

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
  const u = (r: { od: Datum; do: Datum }) => {
    const a = vrijednost(r.od);
    const b = vrijednost(r.do);
    return a <= b ? x >= a && x <= b : x >= a || x <= b;
  };
  return ![p, ...(p.jos ?? [])].some(u);
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
      // otvorena razdoblja: prođi godinu od dana nakon kraja prvog lovostaja
      const start = new Date(2001, p.do[1] - 1, p.do[0] + 1);
      const dijelovi: string[] = [];
      let od: Date | null = null;
      for (let i = 0; i <= 365; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const otv = i < 365 && dopusteno(p, d);
        if (otv && !od) od = d;
        if (!otv && od) {
          dijelovi.push(`${kratkiDatum(od)} – ${kratkiDatum(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}`);
          od = null;
        }
      }
      return `lov ${dijelovi.join(" i ")}`;
    }
  }
}

export function opisLovostaja(p: Pravilo): string | null {
  return imaDatume(p) ? `lovostaj ${[p, ...(p.jos ?? [])].sort((a, b) => vrijednost(a.od) - vrijednost(b.od)).map((r) => `${kratkiDatum(r.od)} – ${kratkiDatum(r.do)}`).join(" i ")}` : null;
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
