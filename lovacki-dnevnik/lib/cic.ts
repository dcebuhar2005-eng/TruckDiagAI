// Ocjena trofeja po CIC formulama (Pravilnik o trofejima divljači, NN 24/2021, čl. 2: ocjenjuje se po CIC-u).
// Formule i koeficijenti: službeni CIC mjerni listovi (srnjak, jelen obični, vepar); granice medalja:
// CIC prema Hromas i sur. (2008.), kako ih navodi Šumarski fakultet Zagreb.
// Ovo je informativni izračun – službenu ocjenu daje komisija za ocjenjivanje trofeja.

export type VrstaTrofeja = "srnjak" | "jelen" | "vepar";

export const MEDALJE: Record<VrstaTrofeja, [bronca: number, srebro: number, zlato: number]> = {
  srnjak: [105, 115, 130],
  jelen: [170, 190, 210],
  vepar: [110, 115, 120],
};

export type Medalja = "zlato" | "srebro" | "bronca" | null;

export function medalja(vrsta: VrstaTrofeja, bodovi: number): Medalja {
  const [b, s, z] = MEDALJE[vrsta];
  return bodovi >= z ? "zlato" : bodovi >= s ? "srebro" : bodovi >= b ? "bronca" : null;
}

export const NAZIV_MEDALJE: Record<Exclude<Medalja, null>, string> = { zlato: "🥇 Zlatna medalja", srebro: "🥈 Srebrna medalja", bronca: "🥉 Brončana medalja" };

/** Vrsta trofeja iz naziva divljači u dnevniku (i spola) – null ako kalkulator ne podržava. */
export function vrstaTrofeja(vrsta: string, spol?: string): VrstaTrofeja | null {
  if (spol && spol !== "m") return null;
  if (vrsta === "Srna obična") return "srnjak";
  if (vrsta === "Jelen obični") return "jelen";
  if (vrsta === "Divlja svinja") return "vepar";
  return null;
}

const pr = (a: number, b: number) => (a + b) / 2;
const n = (x: number | undefined) => (Number.isFinite(x) ? (x as number) : 0);

export interface Srnjak {
  duljinaL: number;
  duljinaD: number;
  /** Masa rogovlja u gramima (kratko odrezana lubanja). */
  masa: number;
  /** Volumen rogovlja u cm³. */
  volumen: number;
  /** Raspon 0–4 (procjena ocjenjivača). */
  raspon: number;
  /** Dodaci: boja 0–4, biserje 0–4, ruže 0–4, vrhovi 0–2, pravilnost 0–5 (ukupno do 19). */
  dodaci: number;
  /** Odbici 0–5. */
  odbici: number;
}

export function bodoviSrnjaka(x: Srnjak) {
  return 0.5 * pr(n(x.duljinaL), n(x.duljinaD)) + 0.1 * n(x.masa) + 0.3 * n(x.volumen) + n(x.raspon) + n(x.dodaci) - n(x.odbici);
}

export interface Jelen {
  duljinaL: number;
  duljinaD: number;
  nadocnjakL: number;
  nadocnjakD: number;
  srednjakL: number;
  srednjakD: number;
  vijenacL: number;
  vijenacD: number;
  donjiL: number;
  donjiD: number;
  gornjiL: number;
  gornjiD: number;
  /** Masa rogovlja u kg (nakon odbitka za lubanju). */
  masa: number;
  /** Ukupan broj parožaka (najmanje 2 cm). */
  parozaka: number;
  /** Unutarnji raspon u cm – bodovi se računaju prema postotku prosječne duljine grana. */
  rasponCm: number;
  /** Dodaci: boja 0–2, biserje 0–2, vrhovi 0–2, ledenjaci 0–2, kruna 0–10. */
  dodaci: number;
  /** Odbici 0–3. */
  odbici: number;
}

/** Bodovi za raspon jelena: < 60 % prosječne duljine grana 0, 60–69,9 % 1, 70–79,9 % 2, 80 % i više 3. */
export function rasponJelena(rasponCm: number, prosjecnaDuljina: number) {
  if (!rasponCm || !prosjecnaDuljina) return 0;
  const p = (rasponCm / prosjecnaDuljina) * 100;
  return p >= 80 ? 3 : p >= 70 ? 2 : p >= 60 ? 1 : 0;
}

export function bodoviJelena(x: Jelen) {
  const duljina = pr(n(x.duljinaL), n(x.duljinaD));
  return (
    0.5 * duljina +
    0.25 * pr(n(x.nadocnjakL), n(x.nadocnjakD)) +
    0.25 * pr(n(x.srednjakL), n(x.srednjakD)) +
    pr(n(x.vijenacL), n(x.vijenacD)) +
    // Donji i gornji opseg grane zbrajaju se (lijeva + desna), ne uzima se prosjek.
    n(x.donjiL) +
    n(x.donjiD) +
    n(x.gornjiL) +
    n(x.gornjiD) +
    2 * n(x.masa) +
    n(x.parozaka) +
    rasponJelena(n(x.rasponCm), duljina) +
    n(x.dodaci) -
    n(x.odbici)
  );
}

export interface Vepar {
  /** Duljina donjih kljova (sjekača) u cm. */
  duljinaL: number;
  duljinaD: number;
  /** Širina donjih kljova u mm. */
  sirinaL: number;
  sirinaD: number;
  /** Opseg gornjih kljova (brusača) u cm. */
  brusacL: number;
  brusacD: number;
  /** Ljepota 0–5 (kljove 0–2, brusači 0–3). */
  dodaci: number;
  /** Odbici 0–10. */
  odbici: number;
}

export function bodoviVepra(x: Vepar) {
  return pr(n(x.duljinaL), n(x.duljinaD)) + 3 * pr(n(x.sirinaL), n(x.sirinaD)) + n(x.brusacL) + n(x.brusacD) + n(x.dodaci) - n(x.odbici);
}

export const zaokruzi = (b: number) => Math.round(b * 100) / 100;
