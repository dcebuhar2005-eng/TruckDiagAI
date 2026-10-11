// Popis svih vanjskih izvora koje aplikacija koristi, s licencom i uvjetima korištenja.
// Detaljan plan za slučaj rasta aplikacije: lovacki-dnevnik/IZVORI.md

export interface Izvor {
  naziv: string;
  za: string;
  licenca: string;
  uvjeti: string;
  /** Što učiniti ako aplikacija postane komercijalna ili je koristi puno ljudi. */
  kadNaraste: string;
  poveznica: string;
}

export interface Skupina {
  naslov: string;
  izvori: Izvor[];
}

export const IZVORI: Skupina[] = [
  {
    naslov: "Karte i snimke",
    izvori: [
      {
        naziv: "Esri World Imagery, Clarity, World Topo i referentni slojevi",
        za: "Podloge Hibrid, Satelit, Satelit HD i Topo",
        licenca: "Esri uvjeti korištenja; snimke © Esri, Maxar, Earthstar Geographics",
        uvjeti: "Navođenje izvora na karti. Bez ključa – prihvatljivo za osobnu, nekomercijalnu i umjerenu upotrebu.",
        kadNaraste: "Besplatni ArcGIS Location Platform ključ (do 2 milijuna pločica mjesečno), iznad toga plaćeno.",
        poveznica: "https://www.esri.com/en-us/legal/terms/full-master-agreement",
      },
      {
        naziv: "Mapbox Satellite",
        za: "Podloga Satelit Pro (samo ako je postavljen ključ)",
        licenca: "Mapbox uvjeti korištenja; © Mapbox © Maxar",
        uvjeti: "Vlastiti ključ, navođenje izvora, besplatno do mjesečnog limita.",
        kadNaraste: "Pratiti potrošnju na mapbox.com; iznad besplatnog limita plaća se po pločici.",
        poveznica: "https://www.mapbox.com/legal/tos",
      },
      {
        naziv: "Državna geodetska uprava – ortofoto (DOF) i TK25",
        za: "Podloge HR ortofoto i HR TK25",
        licenca: "Otvoreni podaci RH (Otvorena dozvola), © Državna geodetska uprava",
        uvjeti: "Slobodno korištenje uz navođenje izvora.",
        kadNaraste: "Kod velikog prometa koristiti predmemoriju (mapproxy) ili registrirani pristup DGU-a.",
        poveznica: "https://geoportal.dgu.hr",
      },
      {
        naziv: "OpenTopoMap",
        za: "Podloga Reljef",
        licenca: "CC-BY-SA; podaci © OpenStreetMap suradnici, SRTM",
        uvjeti: "Navođenje izvora, umjerena upotreba (nema garancije dostupnosti).",
        kadNaraste: "Vlastiti poslužitelj pločica ili komercijalni pružatelj topografskih karata.",
        poveznica: "https://opentopomap.org/about",
      },
      {
        naziv: "CyclOSM (OpenStreetMap France)",
        za: "Podloga Putevi",
        licenca: "Podaci © OpenStreetMap suradnici (ODbL), stil CyclOSM",
        uvjeti: "Navođenje izvora, umjerena upotreba prema pravilima OSM France poslužitelja.",
        kadNaraste: "Vlastiti poslužitelj pločica ili komercijalni pružatelj OSM karata (npr. Thunderforest, MapTiler).",
        poveznica: "https://www.cyclosm.org",
      },
    ],
  },
  {
    naslov: "Podaci",
    izvori: [
      {
        naziv: "OpenStreetMap preko Overpass API-ja",
        za: "Sloj šumskih puteva i staza",
        licenca: "ODbL – © OpenStreetMap suradnici",
        uvjeti: "Navođenje izvora. Javni Overpass poslužitelji za umjerenu upotrebu; aplikacija svako područje sprema 14 dana.",
        kadNaraste: "Vlastiti Overpass poslužitelj ili unaprijed pripremljen izvoz puteva za Hrvatsku.",
        poveznica: "https://wiki.openstreetmap.org/wiki/Overpass_API",
      },
      {
        naziv: "Open-Meteo",
        za: "Vrijeme, vjetar i prognoza",
        licenca: "Podaci CC BY 4.0",
        uvjeti: "Besplatno za nekomercijalnu upotrebu (do ~10 000 poziva dnevno). Prognoza se sprema 15 minuta.",
        kadNaraste: "Komercijalna pretplata Open-Meteo API-ja.",
        poveznica: "https://open-meteo.com/en/terms",
      },
      {
        naziv: "Astronomski izračuni (Sunce, Mjesec, solunar)",
        za: "Izlazak/zalazak, faze Mjeseca, solunarna razdoblja",
        licenca: "Računa se na uređaju; formule prema J. Meeusu i biblioteci SunCalc (BSD-2)",
        uvjeti: "Bez vanjskih poziva.",
        kadNaraste: "Ništa – nema ograničenja.",
        poveznica: "https://github.com/mourner/suncalc",
      },
    ],
  },
  {
    naslov: "Poslužitelji i alati",
    izvori: [
      {
        naziv: "Supabase",
        za: "Prijava, prijatelji, dijeljenje lokacije, sigurnosne kopije",
        licenca: "Supabase uvjeti korištenja",
        uvjeti: "Besplatni paket: 500 MB baze, 1 GB pohrane; projekt se pauzira nakon tjedan dana neaktivnosti.",
        kadNaraste: "Supabase Pro (bez pauziranja, veći limiti, sigurnosne kopije baze).",
        poveznica: "https://supabase.com/pricing",
      },
      {
        naziv: "Vercel",
        za: "Objava aplikacije",
        licenca: "Vercel uvjeti korištenja",
        uvjeti: "Hobby paket je samo za osobnu, nekomercijalnu upotrebu.",
        kadNaraste: "Vercel Pro čim aplikacija postane komercijalna.",
        poveznica: "https://vercel.com/legal/terms",
      },
      {
        naziv: "Leaflet, React, Next.js, Framer Motion",
        za: "Karta i sučelje",
        licenca: "BSD-2 (Leaflet), MIT (ostalo)",
        uvjeti: "Slobodno korištenje uz zadržavanje licence.",
        kadNaraste: "Ništa.",
        poveznica: "https://leafletjs.com",
      },
      {
        naziv: "Fontovi Geist i Fraunces",
        za: "Tipografija",
        licenca: "SIL Open Font License",
        uvjeti: "Slobodno korištenje.",
        kadNaraste: "Ništa.",
        poveznica: "https://openfontlicense.org",
      },
    ],
  },
];
