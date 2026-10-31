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
    id: "2026-10-31",
    naslov: "Novo u CroLovcu",
    stavke: [
      "📋 Popis svega na karti: novi gumb na karti otvara sve čeke, hranilišta, kamere, tragove i odstrel na jednom mjestu – s pretragom, udaljenošću i vjetrom za svaku čeku. Dodir i karta skoči na mjesto.",
    ],
  },
  {
    id: "2026-10-30",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🙏 Hvala svim testerima! Testiranje na Google Playu je gotovo – podsjetnika za testiranje više nema.",
      "🔔 Povremene obavijesti (Android): rijetko i samo kad aplikaciju nekoliko dana ne otvorite. Isključuju se u Postavkama.",
      "🐗 Ne zaboravite: Dolazak divljači sa slikom s kamere – datum i sat upišu se sami.",
    ],
  },
  {
    id: "2026-10-28b",
    naslov: "Novo u CroLovcu",
    stavke: [
      "📷 Dolazak divljači sa slikom: dodajte sliku s lovačke kamere, a datum i sat se upišu sami iz slike.",
      "🐗 Dolazak divljači: zapišite gdje, kad i koliko je divljači došlo – kartica na Pregledu ili gumb „Dolazak” na karti.",
      "🌽 Prihrana: uz izlazak odaberite ili upišite što ste nosili (npr. kukuruz u zrnu).",
    ],
  },
  {
    id: "2026-10-28",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🐗 Dolazak divljači: kamera snimila svinje? Zapišite gdje, kad i koliko ih je došlo – kartica na Pregledu ili gumb „Dolazak” na karti.",
      "🌽 Prihrana: uz izlazak odaberite ili upišite što ste nosili (npr. kukuruz u zrnu). Vidi se i na karti i u statistici.",
    ],
  },
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
