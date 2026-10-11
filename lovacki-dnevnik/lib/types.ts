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
  | "ostalo";

export interface Opazanje {
  vrsta: string;
  broj: number;
}

export interface Izlazak {
  id: ID;
  datum: string;
  od: string;
  do?: string;
  lovisteId?: ID;
  tockaId?: ID;
  nacin: VrstaLova;
  vrijeme?: Vrijeme;
  pratitelji?: string;
  opazanja: Opazanje[];
  ocjena?: number;
  napomena?: string;
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
  fotoId?: string;
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
}

export interface Baza {
  verzija: 1;
  lovista: Loviste[];
  tocke: Tocka[];
  izlasci: Izlazak[];
  odstrel: Odstrel[];
  dozvole: Dozvola[];
  postavke: Postavke;
}

export type Kolekcija = "lovista" | "tocke" | "izlasci" | "odstrel" | "dozvole";
