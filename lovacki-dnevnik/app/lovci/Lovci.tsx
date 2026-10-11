"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Ikona, { type ImeIkone } from "@/components/Ikona";
import { Kostur } from "@/components/Kostur";
import { Gumb, Naslov, Polje, Segmenti, cx, djeteListe, obavijest, opruga, roditeljListe, usePotvrda } from "@/components/ui";
import {
  drziZaslonUkljucen,
  konfigurirano,
  lovciUBlizini,
  odjava,
  osvjeziPoziciju,
  pokreniDijeljenje,
  posaljiZahtjev,
  postaviDrzanjeZaslona,
  prihvati,
  prijava,
  prijeKoliko,
  registracija,
  spremiProfil,
  trazi,
  ukloni,
  useDrustvo,
  zaustaviDijeljenje,
  type Profil,
} from "@/lib/drustvo";
import { metri, sat, udaljenostM } from "@/lib/format";
import { useBaza } from "@/lib/store";

export default function Lovci() {
  const d = useDrustvo();
  if (!konfigurirano) return <NijePostavljeno />;
  if (!d.spremno) return <Kostur redova={2} />;
  if (!d.sesija) return <Prijava />;
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

function Prijava() {
  const [nacin, setNacin] = useState<"prijava" | "registracija">("prijava");
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [radim, setRadim] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadim(true);
    setPoruka(null);
    try {
      if (nacin === "prijava") {
        await prijava(email.trim(), lozinka);
        obavijest("Prijavljeni ste");
      } else {
        const { trebaPotvrda } = await registracija(email.trim(), lozinka);
        if (trebaPotvrda) {
          setPoruka({ tekst: "Poslali smo vam e-mail. Kliknite poveznicu u njemu, zatim se vratite ovdje i prijavite.", greska: false });
          setNacin("prijava");
        }
      }
    } catch (err) {
      setPoruka({ tekst: (err as Error).message, greska: true });
    } finally {
      setRadim(false);
    }
  };

  return (
    <div>
      <Zaglavlje />
      <motion.form
        onSubmit={posalji}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="kartica mx-auto max-w-md p-5"
      >
        <Segmenti
          className="mb-5"
          vrijednost={nacin}
          promjena={(v) => {
            setNacin(v);
            setPoruka(null);
          }}
          opcije={[
            { vrijednost: "prijava", oznaka: "Prijava" },
            { vrijednost: "registracija", oznaka: "Novi račun" },
          ]}
        />
        <div className="grid gap-3.5">
          <Polje oznaka="E-mail">
            <input id="lov-email" type="email" autoComplete="email" required className="unos" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Polje>
          <Polje oznaka="Lozinka" pomoc={nacin === "registracija" ? "Najmanje 6 znakova" : undefined}>
            <input
              id="lov-lozinka"
              type="password"
              autoComplete={nacin === "prijava" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="unos"
              value={lozinka}
              onChange={(e) => setLozinka(e.target.value)}
            />
          </Polje>
        </div>
        <AnimatePresence>
          {poruka && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cx("mt-4 rounded-xl p-3 text-[14px]", poruka.greska ? "bg-opasnost-meka text-opasnost" : "bg-mahovina-meka text-tekst")}
            >
              {poruka.tekst}
            </motion.p>
          )}
        </AnimatePresence>
        <Gumb type="submit" vrsta="primarni" className="mt-5 w-full" disabled={radim}>
          {radim ? "Pričekajte…" : nacin === "prijava" ? "Prijavi se" : "Napravi račun"}
        </Gumb>
        <p className="mt-4 text-[12.5px] text-tekst-3">
          Vaš dnevnik ostaje samo na ovom uređaju. Na poslužitelj idu samo profil, popis prijatelja i lokacija dok je sami dijelite.
        </p>
      </motion.form>
    </div>
  );
}

function PostaviProfil() {
  const baza = useBaza();
  const [ki, setKi] = useState("");
  const [ime, setIme] = useState(baza?.postavke.ime ?? "");
  const [drustvo, setDrustvo] = useState(baza?.postavke.drustvo ?? "");
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const spremi = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadim(true);
    setGreska(null);
    try {
      await spremiProfil(ki, ime, drustvo);
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
        <Polje oznaka="Lovačko društvo" pomoc="Neobavezno – pomaže prijateljima da vas prepoznaju">
          <input id="lov-drustvo" className="unos" value={drustvo} onChange={(e) => setDrustvo(e.target.value)} />
        </Polje>
        {greska && <p className="rounded-xl bg-opasnost-meka p-3 text-[14px] text-opasnost">{greska}</p>}
        <Gumb type="submit" vrsta="primarni" disabled={radim}>
          {radim ? "Spremam…" : "Spremi profil"}
        </Gumb>
      </form>
    </div>
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

  return (
    <div>
      <Naslov
        natpis="Sigurnost u lovu"
        naslov="Lovci"
        opis={
          <>
            Prijavljeni kao <span className="font-medium text-tekst">@{d.profil!.korisnicko_ime}</span>
          </>
        }
        akcija={
          <Gumb vrsta="tihi" velicina="sm" onClick={() => odjava().then(() => obavijest("Odjavljeni ste", "info"))}>
            Odjava
          </Gumb>
        }
      />

      <motion.div variants={roditeljListe} initial="skriveno" animate="vidljivo" className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={djeteListe} className="lg:col-span-2">
          <UpozorenjeBlizine blizu={blizu} />
        </motion.div>

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

        <Sekcija naslov="Dodaj prijatelja" ikona="plus">
          <Trazilica />
        </Sekcija>

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
      <Napomena zaslon={zaslon} setZaslon={setZaslon} />
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
        <input id="lov-trazi" className="unos pl-10" placeholder="Ime ili @korisničko ime" value={upit} onChange={(e) => setUpit(e.target.value)} />
      </div>
      <div className="mt-3 grid gap-2">
        {prikaz.map((p) => {
          const odnos = stanjeOdnosa(p.id);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-povrsina-2 p-3">
              <Avatar ime={p.ime} />
              <ProfilTekst p={p} />
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
        {upit.trim().length >= 2 && !trazim && !prikaz.length && <p className="text-[14px] text-tekst-3">Nema lovaca s tim imenom.</p>}
      </div>
    </div>
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

function ProfilTekst({ p, dodatak }: { p: Profil; dodatak?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate font-medium">{p.ime}</div>
      <div className="truncate text-[12.5px] text-tekst-3">
        @{p.korisnicko_ime}
        {p.drustvo ? ` · ${p.drustvo}` : ""}
        {dodatak ? ` · ${dodatak}` : ""}
      </div>
    </div>
  );
}
