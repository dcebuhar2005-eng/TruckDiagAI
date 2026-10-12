"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { Brojac, Gumb, Naslov, cx, djeteListe, roditeljListe } from "@/components/ui";
import { konfigurirano, sb, useDrustvo } from "@/lib/drustvo";
import { datumKratki, mnozina, sat } from "@/lib/format";
import { MOJA_VERZIJA, imaNovuVerziju, osvjeziAplikaciju } from "@/lib/verzija";

interface Korisnik {
  email: string;
  korisnicko_ime: string | null;
  ime: string | null;
  drustvo: string | null;
  registriran: string;
  zadnja_prijava: string | null;
  zadnja_izmjena: string | null;
  odstrel: number;
  izlasci: number;
  fotografija: number;
}

interface Misljenje {
  id: number;
  ocjena: 1 | -1;
  tekst: string | null;
  verzija: string | null;
  stvoreno: string;
  email: string;
  ime: string | null;
  korisnicko_ime: string | null;
}

interface VerzijaKorisnika {
  email: string;
  verzija: string;
  adresa: string | null;
  uredaj: string | null;
  azurirano: string;
}

const PRAVA_ADRESA = "hunt-jade.vercel.app";
/** Broj korisnika po stranici u popisu. */
const PO_STRANICI = 10;

interface Statistika {
  korisnika: number;
  racuna_u_projektu: number;
  novi_7: number;
  novi_30: number;
  aktivni_1: number;
  aktivni_7: number;
  aktivni_30: number;
  odstrel: number;
  izlasci: number;
  lovista: number;
  tocke: number;
  prijateljstva: number;
  zahtjevi: number;
  u_lovu: number;
  fotografija: number;
  foto_mb: number;
  kopija: number;
  kopije_mb: number;
  registracije: { dan: string; broj: number }[];
  popis: Korisnik[];
}

export default function Admin() {
  const d = useDrustvo();
  const [s, setS] = useState<Statistika | null>(null);
  const [misljenja, setMisljenja] = useState<Misljenje[] | null>(null);
  const [stranica, setStranica] = useState(0);
  const [verzije, setVerzije] = useState<Map<string, VerzijaKorisnika>>(new Map());
  const [greska, setGreska] = useState<string | null>(null);
  const [ucitavam, setUcitavam] = useState(false);
  const [osvjezeno, setOsvjezeno] = useState<Date | null>(null);
  const prijavljen = d.sesija?.user.id;

  const ucitajMisljenja = () => {
    sb()
      .rpc("lov_admin_misljenja")
      .then(({ data, error }) => !error && setMisljenja((data ?? []) as Misljenje[]));
    sb()
      .rpc("lov_admin_verzije")
      .then(({ data, error }) => !error && setVerzije(new Map(((data ?? []) as VerzijaKorisnika[]).map((v) => [v.email, v]))));
  };

  // „Osvježi” najprije provjeri je li objavljena nova verzija aplikacije; ako jest, učita je.
  const osvjezi = () => {
    setUcitavam(true);
    imaNovuVerziju().then((nova) => (nova ? osvjeziAplikaciju() : ucitaj()));
  };

  const ucitaj = () => {
    setUcitavam(true);
    ucitajMisljenja();
    sb()
      .rpc("lov_admin_statistika")
      .then(({ data, error }) => {
        if (error) setGreska(error.code === "42501" ? "pristup" : error.message);
        else {
          setS(data as Statistika);
          setGreska(null);
          setOsvjezeno(new Date());
        }
      })
      .then(() => setUcitavam(false));
  };

  useEffect(() => {
    if (!konfigurirano || !prijavljen) return;
    let ziv = true;
    sb()
      .rpc("lov_admin_statistika")
      .then(({ data, error }) => {
        if (!ziv) return;
        if (error) setGreska(error.code === "42501" ? "pristup" : error.message);
        else {
          setS(data as Statistika);
          setOsvjezeno(new Date());
        }
      });
    sb()
      .rpc("lov_admin_misljenja")
      .then(({ data, error }) => ziv && !error && setMisljenja((data ?? []) as Misljenje[]));
    sb()
      .rpc("lov_admin_verzije")
      .then(({ data, error }) => ziv && !error && setVerzije(new Map(((data ?? []) as VerzijaKorisnika[]).map((v) => [v.email, v]))));
    return () => {
      ziv = false;
    };
  }, [prijavljen]);

  if (greska === "pristup" || !konfigurirano)
    return (
      <div>
        <Naslov natpis="Aplikacija" naslov="Administracija" />
        <div className="kartica flex items-center gap-3 p-5 text-tekst-2">
          <Ikona ime="stit" className="text-naglasak" /> Ova stranica dostupna je samo administratoru aplikacije.
        </div>
      </div>
    );
  if (greska)
    return (
      <div>
        <Naslov natpis="Aplikacija" naslov="Administracija" />
        <div className="kartica p-5 text-opasnost">Statistika se ne može učitati: {greska}</div>
      </div>
    );
  if (!s) return <Kostur />;

  const brojStranica = Math.max(1, Math.ceil(s.popis.length / PO_STRANICI));
  const trenutna = Math.min(stranica, brojStranica - 1);
  const naStranici = s.popis.slice(trenutna * PO_STRANICI, (trenutna + 1) * PO_STRANICI);

  return (
    <div>
      <Naslov
        natpis="Samo za vas"
        naslov="Administracija"
        opis={osvjezeno ? `Stanje u ${sat(osvjezeno)}` : undefined}
        akcija={
          <Gumb velicina="sm" ikona="ucitaj" onClick={osvjezi} disabled={ucitavam}>
            {ucitavam ? "Učitavam…" : "Osvježi"}
          </Gumb>
        }
      />

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4">
        <motion.section variants={djeteListe} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Plocica ikona="korisnik" oznaka="Korisnika" vrijednost={s.korisnika} dodatak={`+${s.novi_7} ovaj tjedan`} istaknuta />
          <Plocica ikona="sat" oznaka="Aktivni danas" vrijednost={s.aktivni_1} dodatak={`${s.aktivni_7} u 7 dana · ${s.aktivni_30} u 30`} />
          <Plocica ikona="lokacija" oznaka="U lovu sada" vrijednost={s.u_lovu} dodatak="dijele lokaciju" />
          <Plocica ikona="plus" oznaka="Novi u 30 dana" vrijednost={s.novi_30} dodatak={`${s.racuna_u_projektu} računa u projektu`} />
        </motion.section>

        <motion.section variants={djeteListe} className="kartica p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Registracije – zadnjih 30 dana</h2>
            <span className="brojke text-[12.5px] text-tekst-3">ukupno {s.novi_30}</span>
          </div>
          <Registracije podaci={s.registracije} />
        </motion.section>

        <motion.section variants={djeteListe} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Plocica ikona="meta" oznaka="Odstrela" vrijednost={s.odstrel} />
          <Plocica ikona="dnevnik" oznaka="Izlazaka" vrijednost={s.izlasci} />
          <Plocica ikona="loviste" oznaka="Lovišta" vrijednost={s.lovista} dodatak={`${s.tocke} točaka`} />
          <Plocica ikona="korisnik" oznaka="Prijateljstava" vrijednost={s.prijateljstva} dodatak={`${s.zahtjevi} zahtjeva čeka`} />
        </motion.section>

        <motion.section variants={djeteListe} className="grid grid-cols-2 gap-3">
          <Plocica ikona="kamera" oznaka="Fotografija u oblaku" vrijednost={s.fotografija} dodatak={`${s.foto_mb.toLocaleString("hr-HR")} MB`} />
          <Plocica ikona="stit" oznaka="Sigurnosnih kopija" vrijednost={s.kopija} dodatak={`${s.kopije_mb.toLocaleString("hr-HR")} MB · limit pohrane 1 GB`} />
        </motion.section>

        {misljenja && (
          <motion.section variants={djeteListe} className="kartica p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Mišljenja korisnika ({misljenja.length})</h2>
              <span className="brojke text-[13px] text-tekst-2">
                👍 {misljenja.filter((m) => m.ocjena === 1).length} · 👎 {misljenja.filter((m) => m.ocjena === -1).length}
              </span>
            </div>
            {misljenja.length === 0 ? (
              <p className="text-[13.5px] text-tekst-3">Još nema odgovora. Pitanje se korisniku prikaže nakon sat vremena korištenja aplikacije.</p>
            ) : (
              <ul className="grid gap-2">
                {misljenja.map((m) => (
                  <li key={m.id} className="rounded-xl border border-rub bg-povrsina-2 p-3">
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px] text-tekst-3">
                      <span className="truncate">
                        <span className="text-[15px]">{m.ocjena === 1 ? "👍" : "👎"}</span>{" "}
                        <span className="font-medium text-tekst">{m.ime ?? m.email}</span>
                        {m.korisnicko_ime ? ` · @${m.korisnicko_ime}` : ""} · {m.email}
                      </span>
                      <span className="brojke shrink-0">{kadJe(m.stvoreno)}</span>
                    </div>
                    {m.tekst ? (
                      <p className="mt-1.5 text-[14.5px] whitespace-pre-wrap">{m.tekst}</p>
                    ) : (
                      <p className="mt-1 text-[13px] text-tekst-3 italic">Bez komentara</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        <motion.section variants={djeteListe} className="kartica overflow-hidden">
          <h2 className="p-5 pb-3 text-[13px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">Korisnici ({s.popis.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="text-[11.5px] tracking-wide text-tekst-3 uppercase">
                <tr className="border-y border-rub">
                  <th className="px-5 py-2 font-medium">Korisnik</th>
                  <th className="px-3 py-2 font-medium">Registriran</th>
                  <th className="px-3 py-2 font-medium">Zadnje aktivan</th>
                  <th className="px-3 py-2 text-right font-medium">Odstrel</th>
                  <th className="px-3 py-2 text-right font-medium">Izlasci</th>
                  <th className="px-5 py-2 text-right font-medium">Foto</th>
                </tr>
              </thead>
              <tbody>
                {naStranici.map((k) => {
                  const zadnje = [k.zadnja_prijava, k.zadnja_izmjena].filter(Boolean).sort().pop();
                  return (
                    <tr key={k.email} className="border-b border-rub last:border-0 hover:bg-povrsina-2">
                      <td className="px-5 py-2.5">
                        <div className="font-medium">{k.ime ?? k.email}</div>
                        <div className="text-[12px] text-tekst-3">
                          {k.korisnicko_ime ? `@${k.korisnicko_ime} · ` : ""}
                          {k.email}
                          {k.drustvo ? ` · ${k.drustvo}` : ""}
                        </div>
                        <OznakaVerzije v={verzije.get(k.email)} />
                      </td>
                      <td className="brojke px-3 py-2.5 text-tekst-2">{datumKratki(new Date(k.registriran))}</td>
                      <td className="brojke px-3 py-2.5 text-tekst-2">{zadnje ? kadJe(zadnje) : "–"}</td>
                      <td className="brojke px-3 py-2.5 text-right">{k.odstrel}</td>
                      <td className="brojke px-3 py-2.5 text-right">{k.izlasci}</td>
                      <td className="brojke px-5 py-2.5 text-right">{k.fotografija}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {brojStranica > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-rub px-5 py-3">
              <Gumb velicina="sm" ikona="lijevo" onClick={() => setStranica(trenutna - 1)} disabled={trenutna === 0}>
                Prethodna
              </Gumb>
              <span className="brojke text-center text-[13px] leading-tight whitespace-nowrap text-tekst-2">
                Stranica {trenutna + 1} / {brojStranica}
                <span className="block text-[11.5px] text-tekst-3">
                  {trenutna * PO_STRANICI + 1}–{Math.min((trenutna + 1) * PO_STRANICI, s.popis.length)} od {s.popis.length}
                </span>
              </span>
              <Gumb velicina="sm" onClick={() => setStranica(trenutna + 1)} disabled={trenutna >= brojStranica - 1}>
                Sljedeća
                <Ikona ime="desno" velicina={16} />
              </Gumb>
            </div>
          )}
          <p className="p-5 pt-3 text-[12px] text-tekst-3">
            Verzija: „najnovija” znači da korisnik ima istu verziju kao vi sada; „–” znači da aplikaciju još nije otvorio
            otkad se verzija bilježi. Vidite samo brojke. Sadržaj dnevnika (izlasci, odstrel, lovišta, fotografije) ostaje privatan svakom korisniku.
          </p>
        </motion.section>
      </motion.div>
    </div>
  );
}

function OznakaVerzije({ v }: { v?: VerzijaKorisnika }) {
  if (!v) return <div className="mt-1 text-[12px] text-tekst-3">Verzija: –</div>;
  const najnovija = v.verzija === MOJA_VERZIJA;
  const staraAdresa = v.adresa && v.adresa !== PRAVA_ADRESA;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-tight">
      <span className={cx("rounded-full px-2 py-0.5 font-medium", najnovija ? "bg-mahovina/15 text-mahovina" : "bg-naglasak-meki text-naglasak")}>
        {najnovija ? "najnovija" : `stara · ${v.verzija.slice(0, 7)}`}
      </span>
      <span className="text-tekst-3">
        {v.uredaj ?? ""}
        {staraAdresa ? <span className="text-opasnost"> · stara adresa</span> : null}
      </span>
    </div>
  );
}

function kadJe(iso: string) {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 60) return `prije ${Math.max(1, min)} min`;
  if (min < 1440) return `prije ${Math.round(min / 60)} h`;
  return datumKratki(new Date(iso));
}

function Plocica({ ikona, oznaka, vrijednost, dodatak, istaknuta }: { ikona: ImeIkone; oznaka: string; vrijednost: number; dodatak?: string; istaknuta?: boolean }) {
  return (
    <div className={cx("kartica p-4", istaknuta && "border-naglasak/40")}>
      <div className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-tekst-3 uppercase">
        <Ikona ime={ikona} velicina={15} className={istaknuta ? "text-naglasak" : undefined} /> {oznaka}
      </div>
      <div className="brojke mt-1.5 font-display text-[34px] leading-none font-semibold">
        <Brojac vrijednost={vrijednost} />
      </div>
      {dodatak && <div className="mt-1.5 truncate text-[12.5px] text-tekst-2">{dodatak}</div>}
    </div>
  );
}

/** Stupci registracija po danu s oblačićem na dodir/prelazak. */
function Registracije({ podaci }: { podaci: { dan: string; broj: number }[] }) {
  const [aktivan, setAktivan] = useState<number | null>(null);
  const maks = Math.max(1, ...podaci.map((p) => p.broj));
  const a = aktivan != null ? podaci[aktivan] : null;
  return (
    <div className="relative">
      <div className="h-5 text-[12.5px] text-tekst-2">
        {a ? (
          <>
            <span className="brojke font-medium text-tekst">{a.broj}</span> {mnozina(a.broj, "registracija", "registracije", "registracija")} ·{" "}
            {datumKratki(a.dan)}
          </>
        ) : (
          <span className="text-tekst-3">Dodirnite stupac za detalje</span>
        )}
      </div>
      <div className="mt-2 flex h-28 items-end gap-[2px] border-b border-rub" onMouseLeave={() => setAktivan(null)}>
        {podaci.map((p, i) => (
          <button
            key={p.dan}
            type="button"
            aria-label={`${p.dan}: ${p.broj}`}
            onMouseEnter={() => setAktivan(i)}
            onFocus={() => setAktivan(i)}
            onClick={() => setAktivan(i)}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={cx("w-full rounded-t-[4px] transition-colors", p.broj ? "bg-naglasak" : "bg-rub", aktivan === i && "brightness-125")}
              style={{ height: p.broj ? `${Math.max(6, (p.broj / maks) * 100)}%` : "2px" }}
            />
          </button>
        ))}
      </div>
      <div className="brojke mt-1.5 flex justify-between text-[11px] text-tekst-3">
        <span>{podaci[0] ? datumKratki(podaci[0].dan) : ""}</span>
        <span>danas</span>
      </div>
    </div>
  );
}
