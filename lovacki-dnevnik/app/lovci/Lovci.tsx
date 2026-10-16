"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { ObrazacPrijave } from "@/components/PrijavaZaslon";
import QrKod from "@/components/QrKod";
import { Gumb, Naslov, Ploca, Polje, Segmenti, djeteListe, obavijest, opruga, roditeljListe, usePotvrda } from "@/components/ui";
import {
  drziZaslonUkljucen,
  konfigurirano,
  lovciUBlizini,
  osvjeziPoziciju,
  pokreniDijeljenje,
  posaljiZahtjev,
  postaviDrzanjeZaslona,
  predlozeniLovci,
  ZUPANIJE,
  type PredlozeniLovac,
  prihvati,
  prijeKoliko,
  spremiProfil,
  trazi,
  ukloni,
  useDrustvo,
  zaustaviDijeljenje,
  type Profil,
} from "@/lib/drustvo";
import {
  GRANICE_M,
  type PostavkeBlizine,
  dozvolaObavijesti,
  oglasiAlarm,
  postavkeBlizine,
  pripremiZvuk,
  spremiPostavkeBlizine,
  zatraziObavijesti,
  vibracijaPodrzana,
} from "@/lib/blizina";
import { metri, sat, udaljenostM } from "@/lib/format";
import { useBaza } from "@/lib/store";
import { odjaviSe } from "@/lib/sinkronizacija";

export default function Lovci() {
  const d = useDrustvo();
  if (!konfigurirano) return <NijePostavljeno />;
  if (!d.spremno) return <Kostur redova={2} />;
  if (!d.sesija) return <ObrazacPrijave />;
  if (!d.profil) return <PostaviProfil />;
  return <Glavno />;
}

function Zaglavlje({ opis }: { opis?: ReactNode }) {
  return (
    <Naslov
      natpis="Sigurnost u lovu"
      naslov="Lovci"
      opis={opis ?? "Dodajte lovačke prijatelje i dijelite lokaciju dok ste u lovu, da znate gdje su drugi lovci."}
    />
  );
}

function NijePostavljeno() {
  return (
    <div>
      <Zaglavlje />
      <div className="kartica p-6">
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-naglasak-meki text-naglasak">
          <Ikona ime="korisnik" velicina={24} />
        </div>
        <h2 className="font-display text-xl font-semibold">Prijatelji još nisu uključeni</h2>
        <p className="mt-1.5 max-w-xl text-[15px] text-tekst-2">
          Za prijatelje i dijeljenje lokacije aplikaciji treba poslužitelj (Supabase). Administrator ga postavlja jednom,
          prema uputama u datoteci <code className="rounded bg-povrsina-2 px-1.5 py-0.5 text-[13px]">lovacki-dnevnik/README.md</code>.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Prijava ---------------- */

function PostaviProfil() {
  const baza = useBaza();
  const [ki, setKi] = useState("");
  const [ime, setIme] = useState(baza?.postavke.ime ?? "");
  const [drustvo, setDrustvo] = useState(baza?.postavke.drustvo ?? "");
  const [zupanija, setZupanija] = useState("");
  const [mjesto, setMjesto] = useState("");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const spremi = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    try {
      await spremiProfil(ki, ime, drustvo, zupanija, mjesto);
      obavijest("Profil je spremljen");
    } catch (err) {
      setGreska((err as Error).message);
    } finally {
      setRadim(false);
    }
  };

  return (
    <div>
      <Zaglavlje opis="Još jedan korak: odaberite korisničko ime po kojem će vas drugi lovci pronaći." />
      <form onSubmit={spremi} className="kartica mx-auto grid max-w-md gap-3.5 p-5">
        <Polje oznaka="Korisničko ime" pomoc="3–24 znaka: mala slova, brojevi, točka ili podvlaka">
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-tekst-3">@</span>
            <input
              id="lov-ki"
              required
              pattern="[a-z0-9_.]{3,24}"
              className="unos pl-8 lowercase"
              value={ki}
              onChange={(e) => setKi(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              placeholder="ivan.horvat"
            />
          </div>
        </Polje>
        <Polje oznaka="Ime i prezime">
          <input id="lov-ime" required className="unos" value={ime} onChange={(e) => setIme(e.target.value)} />
        </Polje>
        <PoljaPronalaska drustvo={drustvo} setDrustvo={setDrustvo} zupanija={zupanija} setZupanija={setZupanija} mjesto={mjesto} setMjesto={setMjesto} />
        {greska && <p className="rounded-xl bg-opasnost-meka p-3 text-[14px] text-opasnost">{greska}</p>}
        <Gumb type="submit" vrsta="primarni" disabled={radim}>
          {radim ? "Spremam…" : "Spremi profil"}
        </Gumb>
      </form>
    </div>
  );
}

/** LD, županija i mjesto – po njima vas kolege pronalaze i dobivate prijedloge „Možda poznajete”. */
function PoljaPronalaska(p: {
  drustvo: string;
  setDrustvo: (v: string) => void;
  zupanija: string;
  setZupanija: (v: string) => void;
  mjesto: string;
  setMjesto: (v: string) => void;
}) {
  return (
    <>
      <Polje oznaka="Lovačko društvo (LD)" pomoc="Kolege iz istog LD-a dobit će vas kao prijedlog">
        <input id="lov-drustvo" className="unos" value={p.drustvo} onChange={(e) => p.setDrustvo(e.target.value)} placeholder="npr. LD Srnjak Bukovac" />
      </Polje>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Polje oznaka="Županija">
          <select id="lov-zupanija" className="unos" value={p.zupanija} onChange={(e) => p.setZupanija(e.target.value)}>
            <option value="">— Odaberite —</option>
            {ZUPANIJE.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Polje>
        <Polje oznaka="Mjesto">
          <input id="lov-mjesto" className="unos" value={p.mjesto} onChange={(e) => p.setMjesto(e.target.value)} placeholder="npr. Daruvar" />
        </Polje>
      </div>
      <p className="-mt-1 text-[12px] text-tekst-3">Neobavezno. Vidljivo drugim lovcima u pretrazi – lokacija u lovu ostaje skrivena kao i dosad.</p>
    </>
  );
}

/** Uređivanje profila: ime, LD, županija i mjesto (korisničko ime ostaje isto). */
function UrediProfil({ otvorena, zatvori }: { otvorena: boolean; zatvori: () => void }) {
  const d = useDrustvo();
  const p = d.profil;
  const [ime, setIme] = useState(p?.ime ?? "");
  const [drustvo, setDrustvo] = useState(p?.drustvo ?? "");
  const [zupanija, setZupanija] = useState(p?.zupanija ?? "");
  const [mjesto, setMjesto] = useState(p?.mjesto ?? "");
  const [radim, setRadim] = useState(false);
  if (!p) return null;
  const spremi = () => {
    setRadim(true);
    spremiProfil(p.korisnicko_ime, ime, drustvo, zupanija, mjesto)
      .then(() => {
        obavijest("Profil je spremljen");
        zatvori();
      })
      .catch((e) => obavijest((e as Error).message, "greska"))
      .finally(() => setRadim(false));
  };
  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Moj profil"
      podnaslov={`@${p.korisnicko_ime}`}
      podnozje={
        <div className="flex gap-2">
          <Gumb className="flex-1" onClick={zatvori}>
            Odustani
          </Gumb>
          <Gumb vrsta="primarni" ikona="kvacica" className="flex-[1.5]" disabled={radim || !ime.trim()} onClick={spremi}>
            {radim ? "Spremam…" : "Spremi"}
          </Gumb>
        </div>
      }
    >
      <div className="grid gap-3.5">
        <Polje oznaka="Ime i prezime">
          <input className="unos" value={ime} onChange={(e) => setIme(e.target.value)} />
        </Polje>
        <PoljaPronalaska drustvo={drustvo} setDrustvo={setDrustvo} zupanija={zupanija} setZupanija={setZupanija} mjesto={mjesto} setMjesto={setMjesto} />
      </div>
    </Ploca>
  );
}

/* ---------------- Glavni prikaz ---------------- */

const TRAJANJA = [
  { v: "120", o: "2 h" },
  { v: "240", o: "4 h" },
  { v: "480", o: "8 h" },
  { v: "kraj", o: "Do ponoći" },
];

function Glavno() {
  const d = useDrustvo();
  const potvrda = usePotvrda();
  const prijatelji = d.prijateljstva.filter((p) => p.status === "prihvaceno");
  const dolazni = d.prijateljstva.filter((p) => p.status === "ceka" && p.dolazni);
  const odlazni = d.prijateljstva.filter((p) => p.status === "ceka" && !p.dolazni);
  const blizu = lovciUBlizini(d);
  const [qr, setQr] = useState(false);
  const [profil, setProfil] = useState(false);
  // Dok lovac nema prijatelja, traženje je prvo na stranici (inače ga ljudi ne nađu ispod postavki alarma).
  const bezPrijatelja = !prijatelji.length && !odlazni.length && !dolazni.length;
  const dodaj = (
    <Sekcija naslov="Dodaj prijatelja" ikona="plus">
      <Trazilica />
    </Sekcija>
  );

  return (
    <div>
      <Naslov
        natpis="Sigurnost u lovu"
        naslov="Lovci"
        opis={
          <>
            Prijavljeni kao <span className="font-medium text-tekst">@{d.profil!.korisnicko_ime}</span> ·{" "}
            <button onClick={() => setProfil(true)} className="font-medium text-naglasak">
              Uredi profil
            </button>
          </>
        }
        akcija={
          <div className="flex gap-2">
            <Gumb velicina="sm" ikona="korisnik" onClick={() => setQr(true)}>
              Moj QR kod
            </Gumb>
            <Gumb vrsta="tihi" velicina="sm" onClick={() => odjaviSe().then(() => obavijest("Odjavljeni ste", "info"))}>
              Odjava
            </Gumb>
          </div>
        }
      />
      <MojQr otvorena={qr} zatvori={() => setQr(false)} />
      <UrediProfil key={String(profil)} otvorena={profil} zatvori={() => setProfil(false)} />
      <DodajIzPoveznice />

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={djeteListe} className="lg:col-span-2">
          <UpozorenjeBlizine blizu={blizu} />
        </motion.div>

        {bezPrijatelja && dodaj}

        <motion.section variants={djeteListe} className="lg:col-span-2">
          <UloviSam brojPrijatelja={prijatelji.length} />
        </motion.section>

        <Sekcija naslov="U lovu sada" ikona="lokacija" broj={d.lokacije.length}>
          {d.lokacije.length ? (
            <div className="grid gap-2">
              {d.lokacije.map((l) => {
                const udalj = d.pozicija ? udaljenostM(d.pozicija, l) : null;
                return (
                  <div key={l.profil.id} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
                    <Avatar ime={l.profil.ime} aktivan />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{l.profil.ime}</div>
                      <div className="brojke text-[12.5px] text-tekst-2">
                        {udalj != null ? `${metri(udalj)} od vas · ` : ""}
                        {prijeKoliko(l.azurirano)} · do {sat(new Date(l.aktivnoDo))}
                      </div>
                    </div>
                    <Link
                      href={`/karta?fokus=${l.lat},${l.lng}`}
                      transitionTypes={["naprijed"]}
                      className="grid size-10 place-items-center rounded-xl border border-rub bg-povrsina text-tekst-2 hover:text-naglasak"
                      aria-label={`Prikaži ${l.profil.ime} na karti`}
                    >
                      <Ikona ime="karta" velicina={18} />
                    </Link>
                  </div>
                );
              })}
              {!d.pozicija && (
                <button onClick={osvjeziPoziciju} className="mt-1 text-left text-[13px] font-medium text-naglasak">
                  Prikaži udaljenosti od mene
                </button>
              )}
            </div>
          ) : (
            <p className="text-[14px] text-tekst-3">Nitko od prijatelja trenutno ne dijeli lokaciju.</p>
          )}
        </Sekcija>

        <Sekcija naslov="Zahtjevi za prijateljstvo" ikona="korisnik" broj={dolazni.length}>
          {dolazni.length ? (
            <div className="grid gap-2">
              {dolazni.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
                  <Avatar ime={p.drugi.ime} />
                  <ProfilTekst p={p.drugi} />
                  <Gumb velicina="sm" vrsta="tihi" onClick={() => ukloni(p.id).catch((e) => obavijest(e.message, "greska"))}>
                    Odbij
                  </Gumb>
                  <Gumb
                    velicina="sm"
                    vrsta="primarni"
                    onClick={() =>
                      prihvati(p.id)
                        .then(() => obavijest(`${p.drugi.ime} je sada vaš prijatelj`))
                        .catch((e) => obavijest(e.message, "greska"))
                    }
                  >
                    Prihvati
                  </Gumb>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-tekst-3">Nema novih zahtjeva.</p>
          )}
        </Sekcija>

        {!bezPrijatelja && dodaj}

        <Sekcija naslov="Prijatelji" ikona="korisnik" broj={prijatelji.length}>
          {prijatelji.length || odlazni.length ? (
            <div className="grid gap-2">
              {prijatelji.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
                  <Avatar ime={p.drugi.ime} aktivan={d.lokacije.some((l) => l.profil.id === p.drugi.id)} />
                  <ProfilTekst p={p.drugi} />
                  <button
                    className="grid size-9 place-items-center rounded-lg text-tekst-3 hover:bg-opasnost-meka hover:text-opasnost"
                    aria-label={`Ukloni ${p.drugi.ime}`}
                    onClick={() =>
                      potvrda.pitaj("Ukloniti prijatelja?", `${p.drugi.ime} više neće vidjeti vašu lokaciju niti vi njegovu.`, () =>
                        ukloni(p.id).catch((e) => obavijest(e.message, "greska")),
                      )
                    }
                  >
                    <Ikona ime="x" velicina={16} />
                  </button>
                </div>
              ))}
              {odlazni.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-rub-jaki p-3">
                  <Avatar ime={p.drugi.ime} />
                  <ProfilTekst p={p.drugi} dodatak="čeka potvrdu" />
                  <Gumb velicina="sm" vrsta="tihi" onClick={() => ukloni(p.id).catch((e) => obavijest(e.message, "greska"))}>
                    Otkaži
                  </Gumb>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-tekst-3">Još nemate prijatelja. Potražite ih po imenu ili korisničkom imenu.</p>
          )}
        </Sekcija>
      </motion.div>
      {potvrda.element}
    </div>
  );
}

function UpozorenjeBlizine({ blizu }: { blizu: ReturnType<typeof lovciUBlizini> }) {
  return (
    <AnimatePresence>
      {blizu.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={opruga}
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-opasnost/50 bg-opasnost-meka p-4"
        >
          <Ikona ime="upozorenje" className="mt-0.5 shrink-0 text-opasnost" />
          <div>
            <div className="font-semibold text-opasnost">Pažnja – lovac u blizini</div>
            <div className="mt-0.5 text-[14px]">
              {blizu.map((l) => `${l.profil.ime} (${metri(l.udaljenost)})`).join(", ")}. Provjerite smjer pucanja.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function UloviSam({ brojPrijatelja }: { brojPrijatelja: number }) {
  const d = useDrustvo();
  const [trajanje, setTrajanje] = useState("240");
  const [zaslon, setZaslon] = useState(drziZaslonUkljucen);

  const pokreni = () => {
    let min = Number(trajanje);
    if (trajanje === "kraj") {
      const p = new Date();
      p.setHours(23, 59, 0, 0);
      min = Math.max(30, Math.round((p.getTime() - Date.now()) / 60000));
    }
    pokreniDijeljenje(min)
      .then(() => obavijest("Dijelite lokaciju s prijateljima"))
      .catch((e) => obavijest(e.message, "greska"));
  };

  if (d.dijelim) {
    return (
      <div className="kartica relative overflow-hidden border-mahovina/40 p-5">
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-mahovina opacity-10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="puls relative grid size-12 shrink-0 place-items-center rounded-full bg-mahovina text-[#0b100c]" style={{ color: "var(--mahovina)" }}>
            <Ikona ime="lokacija" velicina={22} className="relative text-[#0b100c]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[20px] font-semibold">U lovu ste</div>
            <div className="brojke text-[13.5px] text-tekst-2">
              Lokaciju vidi {brojPrijatelja} {brojPrijatelja === 1 ? "prijatelj" : "prijatelja"} · do {sat(new Date(d.dijelim.do))}
              {d.pozicija && ` · točnost ±${Math.round(d.pozicija.tocnost)} m`}
            </div>
            {d.greskaLokacije && <div className="mt-1 text-[13px] text-opasnost">{d.greskaLokacije}</div>}
          </div>
          <Gumb vrsta="opasni" onClick={() => zaustaviDijeljenje().then(() => obavijest("Dijeljenje je zaustavljeno", "info"))}>
            Završi lov
          </Gumb>
        </div>
        <PostavkeAlarma />
        <Napomena zaslon={zaslon} setZaslon={setZaslon} />
      </div>
    );
  }

  return (
    <div className="kartica p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-naglasak-meki text-naglasak">
          <Ikona ime="gps" velicina={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[20px] font-semibold">Idete u lov?</h2>
          <p className="text-[14px] text-tekst-2">
            Podijelite lokaciju s prijateljima dok lovite. Dijeljenje se samo isključuje nakon odabranog vremena.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmenti className="sm:flex-1" vrijednost={trajanje} promjena={setTrajanje} opcije={TRAJANJA.map((t) => ({ vrijednost: t.v, oznaka: t.o }))} />
        <Gumb vrsta="primarni" ikona="lokacija" onClick={pokreni} disabled={!brojPrijatelja}>
          U lovu sam
        </Gumb>
      </div>
      {!brojPrijatelja && <p className="mt-2 text-[13px] text-tekst-3">Najprije dodajte barem jednog prijatelja.</p>}
      <PostavkeAlarma />
      <Napomena zaslon={zaslon} setZaslon={setZaslon} />
    </div>
  );
}

function PostavkeAlarma() {
  const [p, setP] = useState(postavkeBlizine);
  const [dozvola, setDozvola] = useState(dozvolaObavijesti);
  const promijeni = (x: Partial<PostavkeBlizine>) => {
    spremiPostavkeBlizine(x);
    setP((s) => ({ ...s, ...x }));
  };
  return (
    <div className="relative mt-4 grid gap-3 border-t border-rub pt-4">
      <div className="flex items-center gap-2">
        <Ikona ime="upozorenje" velicina={17} className="text-opasnost" />
        <span className="font-medium">Alarm kad je lovac blizu</span>
      </div>
      <Segmenti
        vrijednost={String(p.granica)}
        promjena={(v) => promijeni({ granica: Number(v) })}
        opcije={GRANICE_M.map((g) => ({ vrijednost: String(g), oznaka: g < 1000 ? `${g} m` : "1 km" }))}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="size-5 accent-[var(--naglasak)]" checked={p.zvuk} onChange={(e) => promijeni({ zvuk: e.target.checked })} />
          Zvuk
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="size-5 accent-[var(--naglasak)]" checked={p.vibracija} onChange={(e) => promijeni({ vibracija: e.target.checked })} />
          Vibracija
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Gumb
          velicina="sm"
          ikona="upozorenje"
          onClick={() => {
            pripremiZvuk();
            oglasiAlarm("Probni lovac", Math.round(p.granica * 0.7), false, true);
          }}
        >
          Isprobaj alarm
        </Gumb>
        {dozvola === "default" && (
          <Gumb velicina="sm" onClick={() => zatraziObavijesti().then((d) => setDozvola(d))}>
            Dopusti obavijesti
          </Gumb>
        )}
      </div>
      {p.vibracija && !p.zvuk && !vibracijaPodrzana() && (
        <p className="rounded-xl border border-naglasak/30 bg-naglasak-meki px-3 py-2 text-[12.5px] text-tekst-2">
          Ovaj mobitel ne dopušta vibraciju iz aplikacije (iPhone). Alarm će se prikazati na zaslonu – uključite zvuk ako
          želite i zvučni signal.
        </p>
      )}
      <p className="text-[12.5px] text-tekst-3">
        Alarm radi dok ste u lovu (dijelite lokaciju): oglasi se kad prijatelj uđe u odabranu udaljenost, a vibracija kuca
        kao srce dok je u zoni – sve brže što vam je bliže. „U redu” utiša dok se ne približi još više.{dozvola === "denied" && " Obavijesti su blokirane u postavkama preglednika."}
      </p>
    </div>
  );
}

function Napomena({ zaslon, setZaslon }: { zaslon: boolean; setZaslon: (v: boolean) => void }) {
  return (
    <div className="relative mt-4 grid gap-2 border-t border-rub pt-3">
      <label className="flex cursor-pointer items-center justify-between gap-3 text-[14px]">
        Ne gasi zaslon dok dijelim
        <input
          id="lov-zaslon"
          type="checkbox"
          className="size-5 accent-[var(--naglasak)]"
          checked={zaslon}
          onChange={(e) => {
            setZaslon(e.target.checked);
            postaviDrzanjeZaslona(e.target.checked);
          }}
        />
      </label>
      <p className="flex gap-2 text-[12.5px] text-tekst-3">
        <Ikona ime="upozorenje" velicina={14} className="mt-0.5 shrink-0" />
        Lokacija se osvježava dok je aplikacija otvorena. Kad je zatvorite, prijatelji vide zadnju poznatu poziciju s vremenom
        osvježavanja. Uvijek se dogovorite i glasovno ili porukom.
      </p>
    </div>
  );
}

function Trazilica() {
  const d = useDrustvo();
  const [upit, setUpit] = useState("");
  const [rez, setRez] = useState<Profil[]>([]);
  const [trazim, setTrazim] = useState(false);

  useEffect(() => {
    if (upit.trim().length < 2) return;
    let ziv = true;
    const t = setTimeout(() => {
      setTrazim(true);
      trazi(upit)
        .then((r) => ziv && setRez(r))
        .catch(() => ziv && setRez([]))
        .finally(() => ziv && setTrazim(false));
    }, 300);
    return () => {
      ziv = false;
      clearTimeout(t);
    };
  }, [upit]);

  const stanjeOdnosa = (id: string) => d.prijateljstva.find((p) => p.drugi.id === id);
  const prikaz = upit.trim().length < 2 ? [] : rez;

  return (
    <div>
      <div className="relative">
        <Ikona ime="pretraga" velicina={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tekst-3" />
        <input id="lov-trazi" className="unos pl-10" placeholder="Ime, LD, mjesto ili županija" value={upit} onChange={(e) => setUpit(e.target.value)} />
      </div>
      {upit.trim().length < 2 && <MozdaPoznajete />}
      <div className="mt-3 grid gap-2">
        {prikaz.map((p) => {
          const odnos = stanjeOdnosa(p.id);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
              <Avatar ime={p.ime} />
              <ProfilTekst p={p} mjesto />
              {odnos?.status === "prihvaceno" ? (
                <span className="text-[12.5px] text-mahovina">Prijatelj</span>
              ) : odnos && !odnos.dolazni ? (
                <span className="text-[12.5px] text-tekst-3">Poslano</span>
              ) : (
                <Gumb
                  velicina="sm"
                  vrsta="primarni"
                  ikona="plus"
                  onClick={() =>
                    posaljiZahtjev(p.id)
                      .then(() => obavijest(odnos ? `${p.ime} je sada vaš prijatelj` : `Zahtjev je poslan: ${p.ime}`))
                      .catch((e) => obavijest(e.message, "greska"))
                  }
                >
                  {odnos ? "Prihvati" : "Dodaj"}
                </Gumb>
              )}
            </motion.div>
          );
        })}
        {upit.trim().length >= 2 && !trazim && !prikaz.length && (
          <div className="rounded-2xl bg-povrsina-2 p-3 text-[13.5px] text-tekst-2">
            <p className="font-medium text-tekst">Nema lovaca s tim imenom.</p>
            <p className="mt-1">
              Prijatelj se može pronaći tek kad jednom otvori <b>Lovci</b> u svojoj aplikaciji i spremi korisničko ime. Pošaljite
              mu poziv:
            </p>
            <PozoviPrijatelja />
          </div>
        )}
      </div>
    </div>
  );
}

const poveznicaProfila = (ki: string) => `https://hunt-jade.vercel.app/lovci?dodaj=${encodeURIComponent(ki)}`;

/** Moj QR kod: prijatelj ga skenira kamerom mobitela i odmah me dodaje. */
function MojQr({ otvorena, zatvori }: { otvorena: boolean; zatvori: () => void }) {
  const d = useDrustvo();
  const ki = d.profil?.korisnicko_ime ?? "";
  const veza = poveznicaProfila(ki);
  const podijeli = () => {
    const tekst = `Dodaj me za prijatelja u CroLovcu (@${ki}): ${veza}`;
    if (navigator.share) navigator.share({ text: tekst }).catch(() => {});
    else navigator.clipboard?.writeText(tekst).then(() => obavijest("Poveznica je kopirana")).catch(() => {});
  };
  return (
    <Ploca otvorena={otvorena} zatvori={zatvori} naslov="Moj QR kod" podnaslov="Neka ga prijatelj skenira kamerom mobitela" sirina={420}>
      <div className="grid justify-items-center gap-3 pb-2 text-center">
        <div className="rounded-3xl bg-white p-3 shadow-jaka">
          <QrKod tekst={veza} velicina={248} />
        </div>
        <div>
          <div className="font-display text-[20px] font-semibold">{d.profil?.ime}</div>
          <div className="text-[14px] text-naglasak">@{ki}</div>
        </div>
        <p className="max-w-xs text-[13.5px] text-tekst-2">
          Prijatelj otvori kameru na mobitelu, usmjeri je na kod i dodirne poveznicu. CroLovac mu ponudi da vas doda za
          prijatelja.
        </p>
        <Gumb velicina="sm" ikona="plus" onClick={podijeli}>
          Pošalji poveznicu
        </Gumb>
      </div>
    </Ploca>
  );
}

/** Otvaranje /lovci?dodaj=korisnicko_ime (iz QR koda ili poveznice) nudi dodavanje tog lovca. */
function DodajIzPoveznice() {
  const d = useDrustvo();
  const [lovac, setLovac] = useState<Profil | null>(null);
  const [radim, setRadim] = useState(false);

  useEffect(() => {
    const ki = new URLSearchParams(window.location.search).get("dodaj")?.trim().toLowerCase().replace(/^@/, "");
    if (!ki) return;
    const ocisti = () => window.history.replaceState(null, "", "/lovci");
    if (ki === d.profil?.korisnicko_ime) {
      obavijest("To je vaš QR kod – neka ga skenira prijatelj", "info");
      return ocisti();
    }
    trazi(ki)
      .then((r) => {
        const p = r.find((x) => x.korisnicko_ime === ki);
        if (!p) obavijest(`Lovac @${ki} nije pronađen`, "greska");
        else if (d.prijateljstva.some((x) => x.drugi.id === p.id && x.status === "prihvaceno")) obavijest(`${p.ime} vam je već prijatelj`, "info");
        else setLovac(p);
      })
      .catch(() => obavijest("Provjera nije uspjela – provjerite internet", "greska"))
      .finally(ocisti);
    // Samo pri otvaranju stranice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dodaj = () => {
    if (!lovac) return;
    setRadim(true);
    const dolazni = d.prijateljstva.some((x) => x.drugi.id === lovac.id && x.dolazni);
    posaljiZahtjev(lovac.id)
      .then(() => obavijest(dolazni ? `${lovac.ime} je sada vaš prijatelj` : `Zahtjev je poslan: ${lovac.ime}`))
      .catch((e) => obavijest(e.message, "greska"))
      .finally(() => {
        setRadim(false);
        setLovac(null);
      });
  };

  return (
    <Ploca otvorena={Boolean(lovac)} zatvori={() => setLovac(null)} naslov="Dodati za prijatelja?" sirina={420}>
      {lovac && (
        <div className="grid justify-items-center gap-3 pb-2 text-center">
          <Avatar ime={lovac.ime} />
          <div>
            <div className="font-display text-[20px] font-semibold">{lovac.ime}</div>
            <div className="text-[14px] text-tekst-3">
              @{lovac.korisnicko_ime}
              {lovac.drustvo ? ` · ${lovac.drustvo}` : ""}
            </div>
          </div>
          <p className="max-w-xs text-[13.5px] text-tekst-2">Kad prihvati zahtjev, vidjet ćete se u lovu i alarm će vas upozoriti kad ste blizu.</p>
          <div className="flex w-full gap-2">
            <Gumb vrsta="tihi" className="flex-1" onClick={() => setLovac(null)}>
              Odustani
            </Gumb>
            <Gumb vrsta="primarni" ikona="plus" className="flex-[2]" disabled={radim} onClick={dodaj}>
              Dodaj prijatelja
            </Gumb>
          </div>
        </div>
      )}
    </Ploca>
  );
}

function PozoviPrijatelja() {
  const d = useDrustvo();
  const ki = d.profil?.korisnicko_ime;
  const tekst = `Dodaj me u CroLovcu${ki ? ` – moje korisničko ime je @${ki}` : ""}. Otvori aplikaciju, idi na Lovci i spremi svoje korisničko ime da te mogu pronaći: https://hunt-jade.vercel.app/lovci`;
  const posalji = () => {
    if (navigator.share) navigator.share({ text: tekst }).catch(() => {});
    else
      navigator.clipboard
        ?.writeText(tekst)
        .then(() => obavijest("Poruka je kopirana – zalijepite je prijatelju"))
        .catch(() => {});
  };
  return (
    <Gumb velicina="sm" ikona="plus" className="mt-2" onClick={posalji}>
      Pošalji poziv
    </Gumb>
  );
}

function Sekcija({ naslov, ikona, broj, children }: { naslov: string; ikona: ImeIkone; broj?: number; children: ReactNode }) {
  return (
    <motion.section variants={djeteListe} className="kartica p-5">
      <div className="mb-3 flex items-center gap-2">
        <Ikona ime={ikona} velicina={17} className="text-naglasak" />
        <h2 className="font-display text-[18px] font-semibold">{naslov}</h2>
        {broj != null && broj > 0 && (
          <span className="brojke ml-auto rounded-full bg-naglasak-meki px-2 text-[12px] leading-5 font-semibold text-naglasak">{broj}</span>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function Avatar({ ime, aktivan }: { ime: string; aktivan?: boolean }) {
  const inicijali = ime
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-povrsina-3 text-[13px] font-semibold text-tekst-2">
      {inicijali}
      {aktivan && <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-povrsina bg-mahovina" />}
    </span>
  );
}

function ProfilTekst({ p, dodatak, mjesto }: { p: Profil; dodatak?: string; mjesto?: boolean }) {
  const gdje = mjesto ? [p.mjesto, p.zupanija].filter(Boolean).join(", ") : "";
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-medium">{p.ime}</div>
      <div className="truncate text-[12.5px] text-tekst-3">
        @{p.korisnicko_ime}
        {p.drustvo ? ` · ${p.drustvo}` : ""}
        {dodatak ? ` · ${dodatak}` : ""}
      </div>
      {gdje && <div className="truncate text-[12px] text-tekst-3">{gdje}</div>}
    </div>
  );
}

const RAZLOZI: Record<PredlozeniLovac["razlog"], string> = { ld: "Isti LD", mjesto: "Isto mjesto", zupanija: "Ista županija" };

/** Prijedlozi: lovci iz istog LD-a, mjesta ili županije koji vam još nisu prijatelji. */
function MozdaPoznajete() {
  const d = useDrustvo();
  const [lovci, setLovci] = useState<PredlozeniLovac[] | null>(null);
  const [poslano, setPoslano] = useState<Set<string>>(new Set());
  const p = d.profil;
  const kljuc = `${p?.drustvo}|${p?.zupanija}|${p?.mjesto}`;
  useEffect(() => {
    let ziv = true;
    predlozeniLovci()
      .then((r) => ziv && setLovci(r))
      .catch(() => ziv && setLovci([]));
    return () => {
      ziv = false;
    };
  }, [kljuc]);
  const nepotpun = !p?.drustvo || !p?.zupanija;
  const prikaz = (lovci ?? []).filter((l) => !poslano.has(l.id));
  if (!prikaz.length && !nepotpun) return null;
  return (
    <div className="mt-4">
      {prikaz.length > 0 && (
        <>
          <div className="mb-2 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Možda poznajete</div>
          <div className="grid gap-2">
            {prikaz.map((l) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
                <Avatar ime={l.ime} />
                <ProfilTekst p={l} dodatak={RAZLOZI[l.razlog]} mjesto />
                <Gumb
                  velicina="sm"
                  vrsta="primarni"
                  ikona="plus"
                  onClick={() =>
                    posaljiZahtjev(l.id)
                      .then(() => {
                        setPoslano((s) => new Set(s).add(l.id));
                        obavijest(`Zahtjev je poslan: ${l.ime}`);
                      })
                      .catch((e) => obavijest(e.message, "greska"))
                  }
                >
                  Dodaj
                </Gumb>
              </motion.div>
            ))}
          </div>
        </>
      )}
      {nepotpun && (
        <p className="mt-3 rounded-xl border border-naglasak/30 bg-naglasak-meki px-3 py-2 text-[12.5px] text-tekst-2">
          Upišite svoj <b>LD i županiju</b> (<b>Uredi profil</b> gore) – kolege iz društva i kraja pojavit će se ovdje, a i oni će lakše
          pronaći vas.
        </p>
      )}
    </div>
  );
}
