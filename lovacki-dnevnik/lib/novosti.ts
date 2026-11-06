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
    id: "2026-11-06b",
    naslov: "Novo u CroLovcu",
    stavke: [
      "📅 Lovni kalendar pamti vašu državu (Hrvatska, BiH – Federacija, BiH – Republika Srpska, Srbija), a kartica „Danas se smije loviti” na Pregledu pokazuje upravo nju.",
      "📸 Kartica lova: u odstrelu gumb „Podijeli” napravi lijepu sliku (fotka, vrsta, datum) za WhatsApp, Facebook ili Instagram.",
      "🚗 Stradala divljač: tko vodi evidenciju divljači stradale u prometu, pod vlakom ili strojem, može je uključiti u Postavkama – brzi upis s GPS-om, znak na karti i pregled u statistici.",
    ],
  },
  {
    id: "2026-11-06",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🇧🇦🇷🇸 Lovni kalendar sada i za BiH (Federacija i Republika Srpska) i Srbiju – po službenim propisima, s napomenama gdje vrijede posebna pravila.",
    ],
  },
  {
    id: "2026-11-05",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🎯 Odstrel iz izlaska: u izlasku označite „Imao sam odstrel” i nakon spremanja odmah se otvara upis odstrela – datum, sat, lovište i mjesto već su popunjeni, a odstrel je povezan s izlaskom.",
      "📸 U „Kreni u lov” gumb Odstrel sada nudi i fotografije snimljene u tom lovu – jednim dodirom idu u odstrel.",
    ],
  },
  {
    id: "2026-11-04",
    naslov: "Novo u CroLovcu",
    stavke: [
      "📅 Lovni kalendar: što se danas smije loviti, što se uskoro zatvara i cijela lovna godina za svaku vrstu (po Pravilniku o lovostaju). Otvara se u izborniku „Više” ili s Pregleda.",
      "✨ Nove animacije: kvačica kad spremite izlazak, odstrel ili točku, konfete za prvi odstrel, animirani jelen i GPS traženje.",
    ],
  },
  {
    id: "2026-11-03b",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🗺️ Nove sličice na karti umjesto slova: čeka, hranilište (bačva), solište, kamera, pojilište, zasjeda (tronožac)… – odmah se vidi što je što, bez legende.",
    ],
  },
  {
    id: "2026-11-03",
    naslov: "Novo u CroLovcu",
    stavke: [
      "📍 Preciznija lokacija: „Moja lokacija” sada pričeka da GPS uhvati satelite (prikazuje ±m) umjesto da spremi prvu, grubu lokaciju. Najtočnije je na otvorenom.",
      "💡 Ako je lokacija i dalje gruba, u postavkama mobitela uključite „Precizna lokacija” za CroLovac.",
    ],
  },
  {
    id: "2026-11-02",
    naslov: "Novo u CroLovcu",
    stavke: [
      "🎉 CroLovac je sada na Google Playu! Ako ste zadovoljni, ostavite nam ocjenu – jako pomaže.",
      "🔑 Zaboravili ste lozinku? Na prijavi dodirnite „Zaboravili ste lozinku?” i stići će vam poveznica za novu.",
    ],
  },
  {
    id: "2026-11-01",
    naslov: "Novo u CroLovcu",
    stavke: [
      "✏️ Dolazak divljači sada možete urediti – i naknadno dodati sliku s kamere ako ste je zaboravili.",
      "🔍 Novi narančasti gumb „Popis” na karti: sve čeke, hranilišta, tragovi i odstrel na jednom mjestu.",
    ],
  },
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
