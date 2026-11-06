// Priprema za lovački ispit: opća pitanja (provjereno, osnovno lovačko znanje) + pitanja o lovostaju
// koja se slažu iz provjerenih podataka lovnog kalendara (lib/lovostaj.ts) za odabranu državu.
// Za vježbu – službena pitanja i literaturu daju lovački savezi.

import { DRZAVE, opisLova, type Pravilo } from "./lovostaj";

export interface Pitanje {
  id: string;
  tema: "Biologija divljači" | "Sigurnost i oružje" | "Lovačka praksa" | "Lovni kalendar";
  pitanje: string;
  odgovori: string[];
  /** Indeks točnog odgovora. */
  tocan: number;
  objasnjenje?: string;
}

const P = (id: string, tema: Pitanje["tema"], pitanje: string, tocno: string, krivo: string[], objasnjenje?: string): Pitanje => ({
  id,
  tema,
  pitanje,
  odgovori: [tocno, ...krivo],
  tocan: 0,
  objasnjenje,
});

export const OPCA: Pitanje[] = [
  // Biologija divljači
  P("b1", "Biologija divljači", "Kada je rika jelena običnog?", "Rujan – listopad", ["Svibanj – lipanj", "Prosinac – siječanj", "Ožujak – travanj"], "Rika je razdoblje parenja jelena običnog, u ranu jesen."),
  P("b2", "Biologija divljači", "Kada je parenje (rut) srne obične?", "Srpanj – kolovoz", ["Listopad – studeni", "Ožujak – travanj", "Prosinac – siječanj"], "Srna se pari ljeti, ali zbog odgođene implantacije lane dolazi tek u svibnju ili lipnju."),
  P("b3", "Biologija divljači", "Po čemu je posebna bređost srne?", "Odgođena implantacija – zametak miruje nekoliko mjeseci", ["Srna ima lanad dvaput godišnje", "Bređost traje samo 6 tjedana", "Srna rađa u jesen"], "Oplođeno jaje miruje do prosinca, pa lane dolazi u proljeće."),
  P("b4", "Biologija divljači", "Kada je bukanje (parenje) jelena lopatara?", "Listopad – studeni", ["Srpanj", "Ožujak", "Svibanj"]),
  P("b5", "Biologija divljači", "Kada je glavno razdoblje parenja divlje svinje?", "Studeni – siječanj", ["Lipanj – srpanj", "Rujan", "Travanj – svibanj"]),
  P("b6", "Biologija divljači", "Kako se zove mladunče jelena običnog?", "Tele", ["Lane", "Jare", "Prase"]),
  P("b7", "Biologija divljači", "Kako se zove mladunče srne?", "Lane", ["Tele", "Jare", "Mlado"]),
  P("b8", "Biologija divljači", "Kako se zove ženka divlje svinje?", "Krmača", ["Košuta", "Srna", "Muflonka"]),
  P("b9", "Biologija divljači", "Kako se zove mladunče divokoze?", "Jare", ["Lane", "Tele", "Prase"]),
  P("b10", "Biologija divljači", "Kada srnjak odbacuje rogovlje?", "U kasnu jesen i početkom zime (listopad – prosinac)", ["U proljeće (travanj)", "Usred ljeta", "Ne odbacuje ga nikad"], "Novo rogovlje raste preko zime u bastu i čisti se u proljeće."),
  P("b11", "Biologija divljači", "Kada jelen obični odbacuje rogovlje?", "Krajem zime i u rano proljeće (veljača – travanj)", ["U jesen, nakon rike", "Usred ljeta", "Svake druge godine"]),
  P("b12", "Biologija divljači", "Koja divljač ima rogove koji ne otpadaju, nego rastu cijeli život?", "Divokoza i muflon", ["Jelen i srnjak", "Jelen lopatar", "Jelen aksis"], "Jelenska divljač ima rogovlje koje se odbacuje svake godine; šupljorošci (divokoza, muflon) imaju stalne rogove."),
  P("b13", "Biologija divljači", "Kako se zove koža koja hrani rogovlje dok raste?", "Basta", ["Krzno", "Ruža", "Vijenac"], "Kad rogovlje okošta, jelen ili srnjak ga „čisti” – struže bastu o grmlje."),
  P("b14", "Biologija divljači", "Kada je srneća divljač najaktivnija?", "U zoru i sumrak", ["U podne", "Samo noću u ponoć", "Jednako cijeli dan"]),

  // Sigurnost i oružje
  P("s1", "Sigurnost i oružje", "Koje je osnovno pravilo rukovanja oružjem?", "S oružjem uvijek postupaj kao da je napunjeno", ["Oružje je sigurno ako je zakočeno", "Cijev smije biti okrenuta prema ljudima ako je prazno", "Prst uvijek drži na okidaču"]),
  P("s2", "Sigurnost i oružje", "Kada se smije pucati na divljač?", "Tek kad je divljač sigurno prepoznata i iza nje je siguran zaštitni prostor", ["Čim se u grmlju nešto pomakne", "Kad čujemo divljač", "Uvijek kad je divljač u dometu"]),
  P("s3", "Sigurnost i oružje", "Što napraviti s puškom prije prelaska ograde, jarka ili penjanja na čeku?", "Isprazniti je", ["Samo zakočiti", "Ništa ako je u futroli", "Okrenuti cijev prema gore"]),
  P("s4", "Sigurnost i oružje", "Smije li se u skupnom lovu pucati u pogon (prema goničima i kroz liniju strijelaca)?", "Ne – nikada u pogon i prema liniji", ["Da, ako je divljač blizu", "Da, ako lovnik dopusti", "Da, sačmom"]),
  P("s5", "Sigurnost i oružje", "Čime se lovi krupna divljač (npr. srna, jelen)?", "Puškom kuglaricom (zrnom)", ["Sačmom iz sačmarice", "Zračnom puškom", "Bilo kojim oružjem"]),

  // Lovačka praksa
  P("l1", "Lovačka praksa", "Kako treba puhati vjetar dok prilazimo divljači ili sjedimo na čeki?", "Od divljači prema lovcu (u lice)", ["Od lovca prema divljači", "S leđa", "Smjer vjetra nije važan"], "Divljač ima izvrstan njuh – miris lovca ne smije stići do nje."),
  P("l2", "Lovačka praksa", "Kako se zove mjesto gdje je divljač stajala u trenutku pogotka?", "Nastrijel", ["Solište", "Remiza", "Kaljužište"]),
  P("l3", "Lovačka praksa", "Što napraviti ako pogođena divljač pobjegne?", "Označiti nastrijel, pričekati i potražiti krvni trag – po potrebi pozvati krvosljednika", ["Odmah trčati za njom", "Ostaviti je, sama će uginuti", "Pucati ponovno u smjeru bijega"]),
  P("l4", "Lovačka praksa", "Čemu služi krvosljednik (npr. bavarski ili hanoverski krvoslijednik)?", "Traženju ranjene divljači po krvnom tragu", ["Goniču u skupnom lovu", "Lovu na pernatu divljač", "Čuvanju lovačke kuće"]),
  P("l5", "Lovačka praksa", "Što je „posljednji zalogaj”?", "Grančica stavljena u usta odstrijeljene divljači iz poštovanja", ["Hrana ostavljena na hranilištu", "Prvi obrok nakon lova", "Zadnji metak u spremniku"]),
  P("l6", "Lovačka praksa", "Što je solište?", "Mjesto na kojem se divljači postavlja sol", ["Čeka za lov na svinje", "Mjesto gdje se divljač valja u blatu", "Hranilište sa zrnjem"]),
  P("l7", "Lovačka praksa", "Kako se zove blatno mjesto u kojem se divlje svinje valjaju?", "Kaljužište", ["Solište", "Remiza", "Pojilište"]),
  P("l8", "Lovačka praksa", "Što je remiza?", "Zaklon i hranidbena površina za sitnu divljač", ["Vrsta čeke", "Lovački pas", "Mjesto pogotka"]),
];

/* ---------------- Pitanja iz lovnog kalendara ---------------- */

const promijesaj = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const imaSezonu = (p: Pravilo) => p.tip === "lovostaj";

/** Pitanja „Kada se lovi …?” iz kalendara odabrane države – odgovori su stvarna razdoblja drugih vrsta. */
export function pitanjaKalendara(drzavaK: string, broj: number): Pitanje[] {
  const d = DRZAVE.find((x) => x.k === drzavaK) ?? DRZAVE[0];
  const dijelovi = d.vrste.flatMap((v) =>
    v.dijelovi.filter((x) => imaSezonu(x.pravilo)).map((x) => ({ naziv: v.dijelovi.length > 1 ? `${v.naziv} – ${x.naziv.toLowerCase()}` : v.naziv, opis: opisLova(x.pravilo) })),
  );
  const rez: Pitanje[] = [];
  for (const t of promijesaj(dijelovi)) {
    if (rez.length >= broj) break;
    const krivi = promijesaj([...new Set(dijelovi.map((x) => x.opis).filter((o) => o !== t.opis))]).slice(0, 3);
    if (krivi.length < 3) continue;
    rez.push({
      id: `k-${d.k}-${t.naziv}`,
      tema: "Lovni kalendar",
      pitanje: `${d.zastava} Kada je dopušten lov: ${t.naziv}?`,
      odgovori: [t.opis.replace(/^lov /, ""), ...krivi.map((o) => o.replace(/^lov /, ""))],
      tocan: 0,
      objasnjenje: `Prema propisu: ${d.izvor ?? d.naziv}.`,
    });
  }
  return rez;
}

/** Jedan krug: 6 općih i 4 iz kalendara, odgovori izmiješani. */
export function noviKrug(drzavaK: string): Pitanje[] {
  const pitanja = [...promijesaj(OPCA).slice(0, 6), ...pitanjaKalendara(drzavaK, 4)];
  return promijesaj(pitanja).map((p) => {
    const red = promijesaj(p.odgovori.map((o, i) => ({ o, i })));
    return { ...p, odgovori: red.map((x) => x.o), tocan: red.findIndex((x) => x.i === p.tocan) };
  });
}
