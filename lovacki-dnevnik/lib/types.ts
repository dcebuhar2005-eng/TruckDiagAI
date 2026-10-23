export type ID = string;

export interface Tocka2D {
  lat: number;
  lng: number;
}

export interface Loviste {
  id: ID;
  naziv: string;
  broj?: string;
  ovlastenik?: string;
  zupanija?: string;
  povrsinaHa?: number;
  tip?: "otvoreno" | "ograđeno" | "državno" | "zajedničko";
  boja: string;
  granica?: [number, number][];
  napomena?: string;
  createdAt: number;
}

export type TipTocke =
  | "ceka"
  | "hraniliste"
  | "soliste"
  | "kamera"
  | "kaljuziste"
  | "pojiliste"
  | "zaklon"
  | "remiza"
  | "zasjeda"
  | "prijelaz"
  | "parking"
  | "ostalo";

export interface Tocka {
  id: ID;
  tip: TipTocke;
  naziv: string;
  lat: number;
  lng: number;
  lovisteId?: ID;
  napomena?: string;
  /** Za prijelaz divljači: koja divljač njime prelazi (ključevi iz DIVLJAC_PRIJELAZA). */
  divljac?: string[];
  /** Pobliže: kakva je čeka, hranilište… (ključ iz PODVRSTE). */
  podvrsta?: string;
  /** Pobliže, više odabira odjednom (npr. automatska hranilica + za divlje svinje). Zamjenjuje `podvrsta`. */
  podvrste?: string[];
  /** Za remizu: što je posijano (ključevi iz USJEVI). */
  usjevi?: string[];
  /** Dobri vjetrovi za čeku – strane svijeta (0, 45, … 315°) odakle vjetar smije puhati. */
  vjetrovi?: number[];
  /** Na istom mjestu još (npr. čeka s hranilištem i kamerom). */
  dodatno?: TipTocke[];
  createdAt: number;
}

export interface Vrijeme {
  temperatura?: number;
  vjetarSmjer?: number;
  vjetarBrzina?: number;
  udari?: number;
  tlak?: number;
  vlaga?: number;
  oblacnost?: number;
  oborine?: number;
  kod?: number;
}

export type VrstaLova =
  | "cekanje"
  | "dočekivanje"
  | "šuljanje"
  | "skupni"
  | "pogon"
  | "s psom"
  | "obilazak"
  | "ostalo";

/** Rad u lovištu tijekom izlaska: prihrana, dopuna solišta ili pojilišta. */
export type VrstaRada = "prihrana" | "sol" | "voda";

export interface Rad {
  vrsta: VrstaRada;
  /** kg (prihrana, sol) ili litre (voda) */
  kolicina?: number;
  /** Hranilište, solište ili pojilište koje je dopunjeno. */
  tockaId?: ID;
}

export interface Opazanje {
  vrsta: string;
  broj: number;
  /** Zabilježeno uživo tijekom lova: vrijeme (HH:MM), spol i mjesto. */
  vrijeme?: string;
  spol?: Spol;
  lat?: number;
  lng?: number;
  /** Fotografija opažene divljači (id u spremištu fotografija; nalazi se i u fotoIds izlaska). */
  fotoId?: string;
}

/** Trag divljači pronađen u lovištu (otisak, izmet, ležaj…). */
export interface Trag {
  /** Ključ iz DIVLJAC_TRAGA. */
  divljac: string;
  /** Ključ iz ZNAKOVI_TRAGA. */
  znak: string;
  svjez?: boolean;
  /** Ako se po tragu vidi (npr. otisak jelena ili košute). */
  spol?: Spol;
  vrijeme?: string;
  lat?: number;
  lng?: number;
  fotoId?: string;
}

export interface Izlazak {
  id: ID;
  datum: string;
  od: string;
  do?: string;
  lovisteId?: ID;
  tockaId?: ID;
  /** Mjesto izlaska kad nije vezano uz točku (odabrano na karti ili GPS-om). */
  lat?: number;
  lng?: number;
  nacin: VrstaLova;
  vrijeme?: Vrijeme;
  pratitelji?: string;
  opazanja: Opazanje[];
  tragovi?: Trag[];
  radovi?: Rad[];
  ocjena?: number;
  napomena?: string;
  /** Lov je u tijeku (pokrenut gumbom „Kreni u lov”). */
  uTijeku?: boolean;
  /** Snimljeni GPS trag kretanja tijekom lova [lat, lng]. */
  trag?: [number, number][];
  fotoIds?: string[];
  createdAt: number;
}

export type Spol = "m" | "z" | "n";

export interface Odstrel {
  id: ID;
  datum: string;
  vrijeme: string;
  vrsta: string;
  spol: Spol;
  dob?: string;
  masa?: number;
  trofejCic?: number;
  trofejOpis?: string;
  lovisteId?: ID;
  izlazakId?: ID;
  lat?: number;
  lng?: number;
  udaljenost?: number;
  oruzje?: string;
  kalibar?: string;
  markica?: string;
  /** Odstrijelio je drugi lovac (npr. u pogonu) – zapis ostaje, ali se ne broji u moj odstrel. */
  tudji?: boolean;
  /** Ime lovca koji je odstrijelio (kad nisam ja). */
  strijelac?: string;
  /** Stari zapis s jednom fotografijom – novi zapisi koriste `fotoIds`. */
  fotoId?: string;
  fotoIds?: string[];
  napomena?: string;
  createdAt: number;
}

export type TipDozvole =
  | "lovacka-iskaznica"
  | "dozvola-za-lov"
  | "oruzni-list"
  | "osiguranje"
  | "clanarina"
  | "ispit"
  | "ostalo";

export interface Kvota {
  vrsta: string;
  spol?: Spol;
  broj: number;
}

export interface Dozvola {
  id: ID;
  tip: TipDozvole;
  naziv: string;
  broj?: string;
  izdavatelj?: string;
  od?: string;
  do?: string;
  lovisteId?: ID;
  kvote: Kvota[];
  napomena?: string;
  createdAt: number;
}

export interface Postavke {
  ime: string;
  drustvo?: string;
  iskaznica?: string;
  lokacija: Tocka2D;
  lokacijaNaziv?: string;
  tema: "tamna" | "svijetla" | "auto";
  dovrsenUvod: boolean;
  /** Učitani su primjeri podataka (prikazuje se ponuda za brisanje). */
  primjer?: boolean;
}

/** Lovačko oružje – odabire se kod upisa odstrela. */
export interface Oruzje {
  id: ID;
  naziv: string;
  kalibar?: string;
  /** Serijski broj ili broj iz oružnog lista. */
  broj?: string;
  napomena?: string;
  createdAt: number;
}

/** Staza uvezena iz datoteke (GPX/KML – planinarske staze, šumski putovi, tragovi iz drugih aplikacija). */
export interface Staza {
  id: ID;
  naziv: string;
  /** Linije staze [lat, lng], pojednostavljene da stanu u dnevnik. */
  linije: [number, number][][];
  /** Imenovane točke iz datoteke (izvori, vrhovi, raskrižja…). */
  tocke?: { naziv: string; lat: number; lng: number }[];
  boja: string;
  /** Duljina svih linija u metrima. */
  duljina: number;
  createdAt: number;
}

export interface Baza {
  verzija: 1;
  lovista: Loviste[];
  tocke: Tocka[];
  izlasci: Izlazak[];
  odstrel: Odstrel[];
  dozvole: Dozvola[];
  oruzje: Oruzje[];
  staze: Staza[];
  postavke: Postavke;
}

export type Kolekcija = "lovista" | "tocke" | "izlasci" | "odstrel" | "dozvole" | "oruzje" | "staze";
