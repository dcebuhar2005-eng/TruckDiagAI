"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { Gumb, Naslov, Polje, Segmenti, cx, djeteListe, obavijest, roditeljListe, usePotvrda } from "@/components/ui";
import { konfigurirano, sb, useDrustvo } from "@/lib/drustvo";
import { dopustiBrisanjeUOblaku, odjaviSe, useSinkronizacija } from "@/lib/sinkronizacija";
import { datumDugi, sat } from "@/lib/format";
import { BROJ_KOPIJA, PRAZNA_KOPIJA_B, RAZMAK_DANA, napraviKopiju, ucitajPopis, useKopije, vratiKopiju } from "@/lib/kopije";
import { demoBaza } from "@/lib/demo";
import { spremiFoto, sveFotografije } from "@/lib/foto";
import { db, praznaBaza, useBaza } from "@/lib/store";
import type { Baza, Tocka2D, Postavke as TPostavke } from "@/lib/types";
import PoljeLokacije from "@/components/lokacija/PoljeLokacije";
import { MOJA_VERZIJA, imaNovuVerziju, osvjeziAplikaciju } from "@/lib/verzija";
import { postaviStatistiku, statistikaUkljucena } from "@/lib/pracenje";

export default function Postavke() {
  const baza = useBaza();
  if (!baza) return <Kostur />;
  // Ključ osigurava svježe stanje obrasca nakon uvoza ili brisanja podataka.
  return <Obrazac key={JSON.stringify(baza.postavke)} baza={baza} />;
}

function Obrazac({ baza }: { baza: Baza }) {
  const p = baza.postavke;
  const [ime, setIme] = useState(p.ime);
  const [drustvo, setDrustvo] = useState(p.drustvo ?? "");
  const [iskaznica, setIskaznica] = useState(p.iskaznica ?? "");
  const [lok, setLok] = useState<Tocka2D>(p.lokacija);
  const [lokNaziv, setLokNaziv] = useState(p.lokacijaNaziv ?? "");
  const datoteka = useRef<HTMLInputElement>(null);
  const potvrda = usePotvrda();

  const spremiProfil = (lokacija: Tocka2D = lok, naziv = lokNaziv) => {
    db.postavke({
      ime: ime.trim() || "Lovac",
      drustvo: drustvo.trim() || undefined,
      iskaznica: iskaznica.trim() || undefined,
      lokacija,
      lokacijaNaziv: naziv.trim() || undefined,
    });
    obavijest("Postavke su spremljene");
  };

  // Odabir lokacije sprema se odmah – o njoj ovise vjetar, prognoza i Sunce.
  const promijeniLokaciju = (t: Tocka2D | undefined) => {
    if (!t) return;
    setLok(t);
    spremiProfil(t, lokNaziv);
  };

  const izvezi = async () => {
    let fotografije: Record<string, string> = {};
    try {
      fotografije = await sveFotografije();
    } catch {
      // Bez fotografija ako IndexedDB nije dostupan.
    }
    const blob = new Blob([JSON.stringify({ ...db.dohvati(), fotografije }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lovacki-dnevnik-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    obavijest("Sigurnosna kopija je preuzeta");
  };

  const uvezi = async (f?: File) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text()) as Baza & { fotografije?: Record<string, string> };
      if (!Array.isArray(j.izlasci) || !Array.isArray(j.odstrel)) throw new Error();
      const { fotografije, ...podaci } = j;
      for (const [id, url] of Object.entries(fotografije ?? {})) await spremiFoto(id, url);
      db.zamijeni({ ...podaci, postavke: { ...podaci.postavke, dovrsenUvod: true } });
      obavijest(`Uvezeno: ${j.izlasci.length} izlazaka, ${j.odstrel.length} odstrela`);
    } catch {
      obavijest("Datoteka nije valjana sigurnosna kopija", "greska");
    } finally {
      if (datoteka.current) datoteka.current.value = "";
    }
  };

  return (
    <div>
      <Naslov natpis="Aplikacija" naslov="Postavke" opis="Profil, lokacija, izgled i upravljanje podacima." />

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 lg:grid-cols-2">
        {konfigurirano && <Racun />}

        <Sekcija ikona="korisnik" naslov="Profil lovca">
          <div className="grid gap-3.5">
            <Polje oznaka="Ime i prezime">
              <input className="unos" value={ime} onChange={(e) => setIme(e.target.value)} />
            </Polje>
            <div className="grid grid-cols-2 gap-3">
              <Polje oznaka="Lovačko društvo">
                <input className="unos" value={drustvo} onChange={(e) => setDrustvo(e.target.value)} />
              </Polje>
              <Polje oznaka="Br. iskaznice">
                <input className="unos brojke" value={iskaznica} onChange={(e) => setIskaznica(e.target.value)} />
              </Polje>
            </div>
          </div>
        </Sekcija>

        <Sekcija ikona="lokacija" naslov="Zadana lokacija" opis="Na ovom mjestu mjere se vjetar i prognoza, izlazak/zalazak Sunca i solunarna razdoblja.">
          <div className="grid gap-3.5">
            <Polje oznaka="Naziv">
              <input className="unos" value={lokNaziv} onChange={(e) => setLokNaziv(e.target.value)} placeholder="npr. Lovište Bukovac" />
            </Polje>
            <PoljeLokacije
              naslov="Područje vjetra i prognoze"
              naslovKarte="Odaberite područje lova"
              vrijednost={lok}
              promjena={promijeniLokaciju}
              obavezno
            />
          </div>
        </Sekcija>

        <motion.div variants={djeteListe} className="flex justify-end lg:col-span-2">
          <Gumb vrsta="primarni" ikona="kvacica" onClick={() => spremiProfil()}>
            Spremi promjene
          </Gumb>
        </motion.div>

        <Sekcija ikona="sunce" naslov="Izgled">
          <Segmenti
            vrijednost={p.tema}
            promjena={(t: TPostavke["tema"]) => db.postavke({ tema: t })}
            opcije={[
              { vrijednost: "tamna", oznaka: "Tamna" },
              { vrijednost: "svijetla", oznaka: "Svijetla" },
              { vrijednost: "auto", oznaka: "Sustav" },
            ]}
          />
          <p className="mt-3 text-[13px] text-tekst-3">Tamna tema štedi bateriju i ne zasljepljuje na čeki u sumrak.</p>
          <ProvjeraVerzije />
          <StatistikaKoristenja />
        </Sekcija>

        <Sekcija ikona="stit" naslov="Podaci i sigurnosna kopija" opis={konfigurirano ? "Dnevnik je spremljen na uređaju i u vašem privatnom računu." : "Svi podaci čuvaju se isključivo na ovom uređaju."}>
          <div className="grid grid-cols-2 gap-2">
            <Gumb ikona="preuzmi" onClick={izvezi}>
              Izvezi kopiju
            </Gumb>
            <Gumb ikona="ucitaj" onClick={() => datoteka.current?.click()}>
              Uvezi kopiju
            </Gumb>
            <input ref={datoteka} type="file" accept="application/json,.json" hidden onChange={(e) => uvezi(e.target.files?.[0])} />
            <Gumb
              vrsta="tihi"
              ikona="slojevi"
              onClick={() =>
                potvrda.pitaj("Učitati primjer podataka?", "Trenutni podaci bit će zamijenjeni primjerima. Najprije izvezite kopiju ako ih želite sačuvati.", () => {
                  db.zamijeni({ ...demoBaza(p.ime), postavke: { ...demoBaza(p.ime).postavke, tema: p.tema } });
                  obavijest("Primjeri su učitani");
                })
              }
            >
              Primjer podataka
            </Gumb>
            <Gumb
              vrsta="opasni"
              ikona="smece"
              onClick={() =>
                potvrda.pitaj("Obrisati sve podatke?", "Svi izlasci, odstrel, lovišta, točke i dozvole bit će trajno obrisani s ovog uređaja.", () => {
                  dopustiBrisanjeUOblaku();
                  db.zamijeni({ ...praznaBaza(), postavke: { ...p, dovrsenUvod: true } });
                  obavijest("Svi podaci su obrisani", "info");
                })
              }
            >
              Obriši sve
            </Gumb>
          </div>
          <div className="brojke mt-4 grid grid-cols-5 gap-1.5 text-center">
            {[
              [baza.izlasci.length, "izlazaka"],
              [baza.odstrel.length, "odstrel"],
              [baza.lovista.length, "lovišta"],
              [baza.tocke.length, "točaka"],
              [baza.dozvole.length, "dozvola"],
            ].map(([n, o]) => (
              <div key={o} className="rounded-xl bg-povrsina-2 py-2">
                <div className="font-semibold">{n}</div>
                <div className="text-[10px] tracking-wide text-tekst-3 uppercase">{o}</div>
              </div>
            ))}
          </div>
        </Sekcija>

        <AutomatskaKopija />

        <motion.div variants={djeteListe} className="lg:col-span-2">
          <Link
            href="/izvori"
            transitionTypes={["naprijed"]}
            className="kartica flex items-center gap-3 p-4 transition-colors hover:border-rub-jaki"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
              <Ikona ime="slojevi" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[17px] font-semibold">Izvori i licence</div>
              <div className="text-[13px] text-tekst-3">Karte, vrijeme, putevi i servisi – uvjeti korištenja</div>
            </div>
            <Ikona ime="desno" className="text-tekst-3" />
          </Link>
        </motion.div>

        <motion.div variants={djeteListe} className="lg:col-span-2">
          <Link
            href="/privatnost"
            transitionTypes={["naprijed"]}
            className="kartica flex items-center gap-3 p-4 transition-colors hover:border-rub-jaki"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
              <Ikona ime="oko" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[17px] font-semibold">Pravila privatnosti</div>
              <div className="text-[13px] text-tekst-3">Koji se podaci koriste, gdje se čuvaju i brisanje računa</div>
            </div>
            <Ikona ime="desno" className="text-tekst-3" />
          </Link>
        </motion.div>
      </motion.div>
      {potvrda.element}
    </div>
  );
}

function Racun() {
  const d = useDrustvo();
  const s = useSinkronizacija();
  const [radim, setRadim] = useState(false);
  const [admin, setAdmin] = useState(false);
  const uid = d.sesija?.user.id;
  useEffect(() => {
    if (!uid) return;
    let ziv = true;
    sb()
      .rpc("lov_je_admin")
      .then(({ data }) => ziv && setAdmin(data === true));
    return () => {
      ziv = false;
    };
  }, [uid]);
  const email = d.sesija?.user.email;
  const status = typeof navigator !== "undefined" && !navigator.onLine
    ? { boja: "bg-naglasak", tekst: s.neposlano ? "Bez interneta – izmjene će se poslati kad se spojite" : "Bez interneta" }
    : s.salje
      ? { boja: "bg-naglasak", tekst: "Spremam u oblak…" }
      : s.greska
        ? { boja: "bg-opasnost", tekst: "Spremanje u oblak trenutno ne uspijeva" }
        : { boja: "bg-mahovina", tekst: s.zadnje ? `Spremljeno u oblak u ${sat(new Date(s.zadnje))}` : "Spremljeno" };
  return (
    <Sekcija ikona="stit" naslov="Račun" opis="Dnevnik vidite samo vi, i to samo kad ste prijavljeni.">
      <div className="grid gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
          <div className="grid size-10 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
            <Ikona ime="korisnik" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{email}</div>
            <div className="flex items-center gap-1.5 text-[12.5px] text-tekst-2">
              <span className={cx("size-2 rounded-full", status.boja)} /> {status.tekst}
            </div>
          </div>
        </div>
        <Gumb
          disabled={radim}
          onClick={() => {
            setRadim(true);
            odjaviSe()
              .then(() => obavijest("Odjavljeni ste – dnevnik je skriven dok se ponovno ne prijavite", "info"))
              .finally(() => setRadim(false));
          }}
        >
          {radim ? "Odjavljujem…" : "Odjava"}
        </Gumb>
        {admin && (
          <Link href="/admin" transitionTypes={["naprijed"]}>
            <Gumb ikona="statistika" className="w-full">
              Administracija
            </Gumb>
          </Link>
        )}
      </div>
    </Sekcija>
  );
}

function ProvjeraVerzije() {
  const [radim, setRadim] = useState(false);
  const provjeri = () => {
    if (!navigator.onLine) return obavijest("Za provjeru nove verzije potreban je internet", "info");
    setRadim(true);
    imaNovuVerziju().then((nova) => {
      if (nova) {
        obavijest("Učitavam novu verziju…", "info");
        osvjeziAplikaciju();
      } else {
        setRadim(false);
        obavijest("Imate najnoviju verziju CroLovca");
      }
    });
  };
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-rub pt-4">
      <div className="text-[13px] text-tekst-3">
        Verzija <span className="brojke">{MOJA_VERZIJA.slice(0, 7) || "–"}</span>
      </div>
      <Gumb velicina="sm" ikona="preuzmi" onClick={provjeri} disabled={radim}>
        {radim ? "Provjeravam…" : "Provjeri nove verzije"}
      </Gumb>
    </div>
  );
}

function Sekcija({ ikona, naslov, opis, children }: { ikona: ImeIkone; naslov: string; opis?: string; children: ReactNode }) {
  return (
    <motion.section variants={djeteListe} className="kartica p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
          <Ikona ime={ikona} />
        </div>
        <div>
          <h2 className="font-display text-[18px] font-semibold">{naslov}</h2>
          {opis && <p className="text-[13px] text-tekst-3">{opis}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function AutomatskaKopija() {
  const d = useDrustvo();
  const k = useKopije();
  const potvrda = usePotvrda();
  const prijavljen = !!d.sesija;

  useEffect(() => {
    if (prijavljen && !k.ucitano) ucitajPopis().catch(() => {});
  }, [prijavljen, k.ucitano]);

  const zadnja = k.kopije[0];
  const sljedeca = zadnja ? new Date(zadnja.datum + RAZMAK_DANA * 86400000) : null;

  return (
    <Sekcija
      ikona="ucitaj"
      naslov="Automatska sigurnosna kopija"
      opis={`Svaki dan dnevnik se dodatno sprema na vaš privatni račun (fotografije su u oblaku zasebno). Čuvaju se samo ${BROJ_KOPIJA} najnovije kopije, starije se brišu same.`}
    >
      {!konfigurirano || !prijavljen ? (
        <div className="rounded-2xl bg-povrsina-2 p-4 text-[14px] text-tekst-2">
          Za automatsku kopiju prijavite se na stranici{" "}
          <Link href="/lovci" transitionTypes={["naprijed"]} className="font-medium text-naglasak">
            Lovci
          </Link>
          . Bez prijave podaci postoje samo na ovom uređaju.
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-povrsina-2 p-3.5">
            <span className={cx("size-2.5 rounded-full", zadnja ? "bg-mahovina" : "bg-naglasak")} />
            <div className="min-w-0 flex-1 text-[14px]">
              {zadnja ? (
                <>
                  Zadnja kopija: <span className="font-medium">{datumDugi(new Date(zadnja.datum))}</span>
                  <div className="text-[12.5px] text-tekst-3">Sljedeća: {sljedeca ? datumDugi(sljedeca) : "–"}</div>
                </>
              ) : k.ucitano ? (
                "Još nema kopije – napravit će se automatski ili odmah gumbom."
              ) : (
                "Provjeravam kopije…"
              )}
            </div>
            <Gumb
              velicina="sm"
              ikona="ucitaj"
              disabled={k.radim}
              onClick={() =>
                napraviKopiju()
                  .then(() => obavijest("Sigurnosna kopija je spremljena"))
                  .catch((e) => obavijest(e.message, "greska"))
              }
            >
              {k.radim ? "Spremam…" : "Kopiraj sada"}
            </Gumb>
          </div>
          {k.greska && <p className="text-[13px] text-opasnost">{k.greska}</p>}
          {k.kopije.map((kop) => (
            <div key={kop.naziv} className="flex items-center gap-3 rounded-xl border border-rub px-3.5 py-2.5 text-[14px]">
              <span className="flex-1">
                {datumDugi(new Date(kop.datum))} <span className="brojke text-tekst-2">u {sat(new Date(kop.datum))}</span>
                {kop.velicina < PRAZNA_KOPIJA_B ? (
                  <span className="ml-2 rounded-md bg-povrsina-3 px-1.5 py-0.5 text-[11.5px] text-tekst-3">prazna</span>
                ) : (
                  <span className="brojke ml-2 text-[12.5px] text-tekst-3">{(kop.velicina / 1024).toLocaleString("hr-HR", { maximumFractionDigits: 0 })} KB</span>
                )}
              </span>
              <Gumb
                velicina="sm"
                vrsta="tihi"
                disabled={kop.velicina < PRAZNA_KOPIJA_B}
                onClick={() =>
                  potvrda.pitaj(
                    "Vratiti ovu kopiju?",
                    "Zapisi iz kopije dodat će se vašem dnevniku. Ništa što ste upisali nakon kopije neće se obrisati.",
                    () =>
                      vratiKopiju(kop.naziv)
                        .then((r) => obavijest(`Vraćeno: ${r.izlasci} izlazaka, ${r.odstrel} odstrela`))
                        .catch((e) => obavijest(e.message, "greska")),
                    { oznaka: "Vrati", ikona: "ucitaj", vrsta: "primarni" },
                  )
                }
              >
                Vrati
              </Gumb>
            </div>
          ))}
        </div>
      )}
      {potvrda.element}
    </Sekcija>
  );
}

/** Anonimna statistika korištenja (PostHog) – može se isključiti. */
function StatistikaKoristenja() {
  // Postavke se crtaju tek kad je dnevnik učitan na uređaju, pa localStorage ovdje postoji.
  const [ukljuceno, setUkljuceno] = useState(statistikaUkljucena);
  return (
    <div className="mt-4 border-t border-rub pt-4">
      <div className="mb-2 text-[14px] font-medium">Anonimna statistika korištenja</div>
      <Segmenti
        vrijednost={ukljuceno ? "da" : "ne"}
        promjena={(v: string) => {
          postaviStatistiku(v === "da");
          setUkljuceno(v === "da");
        }}
        opcije={[
          { vrijednost: "da", oznaka: "Uključeno" },
          { vrijednost: "ne", oznaka: "Isključeno" },
        ]}
      />
      <p className="mt-2 text-[13px] text-tekst-3">
        Pomaže nam vidjeti koje se funkcije koriste i gdje zapinje. Ne šalje se sadržaj dnevnika, lokacija, ime ni e-mail.
      </p>
    </div>
  );
}
