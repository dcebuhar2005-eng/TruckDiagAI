import { isoDatum } from "./format";
import { noviId as noviIdSiguran, ZADANE_POSTAVKE } from "./store";
import type { Baza, Izlazak, Odstrel } from "./types";

/** Primjer podataka za upoznavanje s aplikacijom (izmišljena lovišta i događaji). */
export function demoBaza(ime: string): Baza {
  const centar = { lat: 45.598, lng: 16.548 };
  const d = (dana: number) => {
    const x = new Date();
    x.setDate(x.getDate() - dana);
    return isoDatum(x);
  };
  const L1 = noviIdSiguran();
  const L2 = noviIdSiguran();
  const T = Array.from({ length: 7 }, noviIdSiguran);
  const sad = Date.now();

  const izlasci: Izlazak[] = [
    { id: noviIdSiguran(), datum: d(1), od: "05:10", do: "08:30", lovisteId: L1, tockaId: T[0], nacin: "cekanje", vrijeme: { temperatura: 6, vjetarSmjer: 300, vjetarBrzina: 7, tlak: 1018, oblacnost: 20, kod: 1 }, opazanja: [{ vrsta: "Srna obična", broj: 4 }, { vrsta: "Divlja svinja", broj: 2 }], tragovi: [{ divljac: "svinje", znak: "rovanje", svjez: true, vrijeme: "07:55", lat: centar.lat + 0.0042, lng: centar.lng - 0.0035 }, { divljac: "srneca", znak: "otisak", svjez: true, vrijeme: "08:10", lat: centar.lat + 0.0021, lng: centar.lng + 0.0049 }], ocjena: 4, napomena: "Krdo svinja prešlo prosjek oko 6:40, vjetar povoljan.", createdAt: sad - 1 },
    { id: noviIdSiguran(), datum: d(4), od: "17:30", do: "20:15", lovisteId: L1, tockaId: T[1], nacin: "cekanje", vrijeme: { temperatura: 12, vjetarSmjer: 200, vjetarBrzina: 12, tlak: 1011, oblacnost: 70, kod: 3 }, opazanja: [{ vrsta: "Srna obična", broj: 2 }], ocjena: 3, createdAt: sad - 2 },
    { id: noviIdSiguran(), datum: d(9), od: "06:00", do: "11:30", lovisteId: L2, nacin: "šuljanje", vrijeme: { temperatura: 9, vjetarSmjer: 20, vjetarBrzina: 5, tlak: 1022, oblacnost: 5, kod: 0 }, opazanja: [{ vrsta: "Jelen obični", broj: 3 }, { vrsta: "Lisica", broj: 1 }], tragovi: [{ divljac: "jelenska", znak: "guljenje", svjez: false, vrijeme: "09:20", lat: centar.lat - 0.0065, lng: centar.lng + 0.0012 }, { divljac: "grabezljivci", znak: "izmet", vrijeme: "10:05", lat: centar.lat - 0.0018, lng: centar.lng - 0.0061 }], ocjena: 5, napomena: "Rika u punom jeku na Velikom brdu.", createdAt: sad - 3 },
    { id: noviIdSiguran(), datum: d(16), od: "18:00", do: "21:00", lovisteId: L1, tockaId: T[0], nacin: "cekanje", vrijeme: { temperatura: 15, vjetarSmjer: 270, vjetarBrzina: 9, tlak: 1015, oblacnost: 30, kod: 1 }, opazanja: [{ vrsta: "Divlja svinja", broj: 5 }], ocjena: 4, createdAt: sad - 4 },
    { id: noviIdSiguran(), datum: d(31), od: "07:00", do: "13:00", lovisteId: L1, nacin: "skupni", pratitelji: "LD Bukovac – 14 lovaca", vrijeme: { temperatura: 11, vjetarSmjer: 90, vjetarBrzina: 15, tlak: 1008, oblacnost: 90, kod: 61 }, opazanja: [{ vrsta: "Fazan", broj: 11 }, { vrsta: "Zec obični", broj: 6 }], ocjena: 3, createdAt: sad - 5 },
    { id: noviIdSiguran(), datum: d(47), od: "19:00", do: "22:30", lovisteId: L2, tockaId: T[4], nacin: "cekanje", vrijeme: { temperatura: 19, vjetarSmjer: 180, vjetarBrzina: 4, tlak: 1016, oblacnost: 10, kod: 0 }, opazanja: [{ vrsta: "Divlja svinja", broj: 3 }, { vrsta: "Čagalj", broj: 2 }], ocjena: 4, createdAt: sad - 6 },
  ];

  const odstrel: Odstrel[] = [
    { id: noviIdSiguran(), datum: izlasci[0].datum, vrijeme: "06:42", vrsta: "Divlja svinja", spol: "m", dob: "Srednjodobno", masa: 78, lovisteId: L1, izlazakId: izlasci[0].id, lat: centar.lat + 0.0042, lng: centar.lng - 0.006, udaljenost: 85, oruzje: "Sauer 404", kalibar: ".308 Win", markica: "HR-DS-004812", napomena: "Pogodak u plećku, palo na mjestu.", createdAt: sad - 1 },
    { id: noviIdSiguran(), datum: izlasci[2].datum, vrijeme: "07:55", vrsta: "Jelen obični", spol: "m", dob: "Zrelo", masa: 168, trofejCic: 182.4, trofejOpis: "Neparni 14-erac", lovisteId: L2, izlazakId: izlasci[2].id, lat: centar.lat + 0.031, lng: centar.lng + 0.044, udaljenost: 140, oruzje: "Blaser R8", kalibar: "8x57 IS", markica: "HR-JO-001257", createdAt: sad - 2 },
    { id: noviIdSiguran(), datum: izlasci[4].datum, vrijeme: "10:20", vrsta: "Fazan", spol: "m", lovisteId: L1, izlazakId: izlasci[4].id, oruzje: "Beretta 686", kalibar: "12/70", createdAt: sad - 3 },
    { id: noviIdSiguran(), datum: izlasci[4].datum, vrijeme: "11:05", vrsta: "Fazan", spol: "m", lovisteId: L1, izlazakId: izlasci[4].id, oruzje: "Beretta 686", kalibar: "12/70", createdAt: sad - 4 },
    { id: noviIdSiguran(), datum: d(68), vrijeme: "05:35", vrsta: "Srna obična", spol: "m", dob: "Zrelo", masa: 19, trofejCic: 104.2, lovisteId: L1, lat: centar.lat - 0.004, lng: centar.lng + 0.008, udaljenost: 120, oruzje: "Sauer 404", kalibar: ".308 Win", markica: "HR-SO-018830", createdAt: sad - 5 },
    { id: noviIdSiguran(), datum: d(47), vrijeme: "21:48", vrsta: "Čagalj", spol: "z", lovisteId: L2, izlazakId: izlasci[5].id, udaljenost: 60, oruzje: "Sauer 404", kalibar: ".308 Win", createdAt: sad - 6 },
  ];

  const g = new Date();
  const lg = g.getMonth() >= 3 ? g.getFullYear() : g.getFullYear() - 1;

  return {
    verzija: 1,
    lovista: [
      {
        id: L1, naziv: "Bukovac", broj: "VII/118", ovlastenik: "LD Bukovac", zupanija: "Bjelovarsko-bilogorska", tip: "otvoreno", boja: "#d4a24c", createdAt: sad,
        granica: [[45.612, 16.522], [45.618, 16.556], [45.604, 16.578], [45.586, 16.571], [45.581, 16.538], [45.594, 16.519]],
        napomena: "Nizinsko-brdsko lovište, hrast i grab, oranice uz rub.",
      },
      {
        id: L2, naziv: "Veliko brdo", broj: "VII/121", ovlastenik: "LD Šljuka", zupanija: "Bjelovarsko-bilogorska", tip: "zajedničko", boja: "#6fa3c7", createdAt: sad - 1,
        granica: [[45.640, 16.570], [45.645, 16.612], [45.622, 16.620], [45.618, 16.585]],
      },
    ],
    tocke: [
      { id: T[0], tip: "ceka", naziv: "Čeka Hrastik", lat: centar.lat + 0.004, lng: centar.lng - 0.0075, lovisteId: L1, vjetrovi: [135, 180, 225], napomena: "Zatvorena čeka, pogled na prosjek prema jugu.", createdAt: sad },
      { id: T[1], tip: "ceka", naziv: "Čeka Livada", lat: centar.lat - 0.006, lng: centar.lng + 0.011, lovisteId: L1, vjetrovi: [0, 45, 315], createdAt: sad },
      { id: T[2], tip: "hraniliste", naziv: "Hranilište Potok", lat: centar.lat + 0.0005, lng: centar.lng - 0.002, lovisteId: L1, createdAt: sad },
      { id: T[3], tip: "soliste", naziv: "Solište Grabik", lat: centar.lat - 0.002, lng: centar.lng + 0.004, lovisteId: L1, createdAt: sad },
      { id: T[4], tip: "ceka", naziv: "Čeka Vrh", lat: centar.lat + 0.033, lng: centar.lng + 0.041, lovisteId: L2, vjetrovi: [225, 270], createdAt: sad },
      { id: T[5], tip: "kamera", naziv: "Kamera Kaljuža", lat: centar.lat + 0.0085, lng: centar.lng + 0.002, lovisteId: L1, createdAt: sad },
      { id: T[6], tip: "kaljuziste", naziv: "Kaljužište Jarak", lat: centar.lat + 0.009, lng: centar.lng + 0.0028, lovisteId: L1, createdAt: sad },
    ],
    izlasci,
    odstrel,
    oruzje: [
      { id: noviIdSiguran(), naziv: "Sauer 404", kalibar: ".308 Win", createdAt: sad - 1 },
      { id: noviIdSiguran(), naziv: "Blaser R8", kalibar: "8x57 IS", createdAt: sad - 2 },
      { id: noviIdSiguran(), naziv: "Beretta 686", kalibar: "12/70", napomena: "Sačmarica", createdAt: sad - 3 },
    ],
    dozvole: [
      { id: noviIdSiguran(), tip: "lovacka-iskaznica", naziv: "Lovačka iskaznica", broj: "HLS-0457821", izdavatelj: "Hrvatski lovački savez", od: `${lg}-04-01`, do: `${lg + 1}-03-31`, kvote: [], createdAt: sad },
      { id: noviIdSiguran(), tip: "dozvola-za-lov", naziv: "Dozvola za lov – krupna divljač", broj: "DZL-118/24", izdavatelj: "LD Bukovac", od: `${lg}-04-01`, do: `${lg + 1}-03-31`, lovisteId: L1, kvote: [{ vrsta: "Divlja svinja", broj: 4 }, { vrsta: "Srna obična", spol: "m", broj: 2 }, { vrsta: "Srna obična", spol: "z", broj: 2 }], createdAt: sad - 1 },
      { id: noviIdSiguran(), tip: "oruzni-list", naziv: "Oružni list", broj: "OL-2219044", izdavatelj: "PU bjelovarsko-bilogorska", od: "2021-06-14", do: isoDatum(new Date(Date.now() + 24 * 86400000)), kvote: [], napomena: "Produljiti na vrijeme!", createdAt: sad - 2 },
      { id: noviIdSiguran(), tip: "osiguranje", naziv: "Osiguranje od odgovornosti", broj: "POL-77-11902", izdavatelj: "Osiguravatelj d.d.", od: `${lg}-04-01`, do: `${lg + 1}-03-31`, kvote: [], createdAt: sad - 3 },
    ],
    postavke: {
      ...ZADANE_POSTAVKE,
      ime: ime || "Lovac",
      drustvo: "LD Bukovac",
      lokacija: centar,
      lokacijaNaziv: "Lovište Bukovac",
      dovrsenUvod: true,
      primjer: true,
    },
  };
}
