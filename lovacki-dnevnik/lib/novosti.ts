// „Što je novo”: nakon svake objave korisnik jednom vidi kratki popis novosti.
// PRAVILO: uz svaku objavu dodati unos NA VRH popisa (samo besplatne stvari – PRO se ne spominje dok je skriven).

export interface Novost {
  /** Jedinstveno, raste s vremenom (datum objave). */
  id: string;
  naslov: string;
  stavke: string[];
}

export const NOVOSTI: Novost[] = [
  {
    id: "2026-10-26",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🆘 SOS – hitna pomoć: poziv 112, točne koordinate i slanje lokacije porukom. U izborniku Više, u Lovcima i dok ste u lovu.",
      "🌙 Obavijest večer prije (Android): u 20:00 javi kad je sutra dobar termin za lov i na kojoj je čeki vjetar dobar.",
      "👣 Prvi koraci na Pregledu za nove korisnike.",
      "📱 iPhone: Dnevnik se više ne pomiče iza otvorenog izlaska, a traka ne ulazi pod sat.",
    ],
  },
];
