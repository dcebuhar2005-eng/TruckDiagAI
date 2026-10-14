"use client";

// Prijatelji i dijeljenje lokacije u lovu (Supabase). Dnevnik i dalje ostaje samo na uređaju;
// na poslužitelj idu samo profil, prijateljstva i lokacija dok korisnik sam dijeli.

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { ponistiBlizinu, postavkeBlizine, pripremiZvuk, provjeriBlizinu } from "./blizina";
import { udaljenostM } from "./format";
import { fetchZaSupabase, pratiLokaciju, uAplikaciji } from "./nativno";
import { postaviVlasnika } from "./store";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KLJUC = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const konfigurirano = Boolean(URL_ && KLJUC);

const KLJUC_PRIJAVE = "lovacki-dnevnik:prijava";
const KLJUC_ISTEKLA = "lovacki-dnevnik:prijava-istekla";
let klijent: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!konfigurirano) throw new Error("Prijatelji nisu konfigurirani");
  if (!klijent) {
    klijent = createClient(URL_!, KLJUC!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: KLJUC_PRIJAVE },
      global: { fetch: fetchZaSupabase },
    });
  }
  return klijent;
}

export interface Profil {
  id: string;
  korisnicko_ime: string;
  ime: string;
  drustvo: string | null;
}

export interface Prijateljstvo {
  id: number;
  status: "ceka" | "prihvaceno";
  dolazni: boolean;
  drugi: Profil;
}

export interface LokacijaLovca {
  profil: Profil;
  lat: number;
  lng: number;
  tocnost: number | null;
  azurirano: number;
  aktivnoDo: number;
}

export interface MojaPozicija {
  lat: number;
  lng: number;
  tocnost: number;
  t: number;
}

interface Stanje {
  spremno: boolean;
  sesija: Session | null;
  profil: Profil | null;
  prijateljstva: Prijateljstvo[];
  lokacije: LokacijaLovca[];
  dijelim: { do: number } | null;
  pozicija: MojaPozicija | null;
  greskaLokacije: string | null;
  /** Prijava je poništena jer aplikacija nije otvarana više od 2 mjeseca. */
  prijavaIstekla: boolean;
  /** Profil je provjeren na poslužitelju (pa `profil: null` znači da ga stvarno nema). */
  profilUcitan: boolean;
}

let stanje: Stanje = {
  spremno: false,
  sesija: null,
  profil: null,
  prijateljstva: [],
  lokacije: [],
  dijelim: null,
  pozicija: null,
  greskaLokacije: null,
  prijavaIstekla: false,
  profilUcitan: false,
};
const slusaci = new Set<() => void>();
function postavi(izmjene: Partial<Stanje>) {
  stanje = { ...stanje, ...izmjene };
  slusaci.forEach((f) => f());
}

const POCETNO: Stanje = stanje;
export function useDrustvo() {
  return useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => stanje,
    () => POCETNO,
  );
}

/* ---------------- Prijava ---------------- */

export async function registracija(email: string, lozinka: string) {
  const { data, error } = await sb().auth.signUp({
    email,
    password: lozinka,
    options: { emailRedirectTo: window.location.origin + "/" },
  });
  if (error) throw prevedi(error.message);
  return { trebaPotvrda: !data.session };
}

export async function prijava(email: string, lozinka: string) {
  const { error } = await sb().auth.signInWithPassword({ email, password: lozinka });
  if (error) throw prevedi(error.message);
  zabiljeziAktivnost();
  try {
    localStorage.removeItem(KLJUC_ISTEKLA);
  } catch {}
  postavi({ prijavaIstekla: false });
}

export async function odjava() {
  await zaustaviDijeljenje().catch(() => {});
  const { error } = await sb().auth.signOut();
  // Bez interneta odjavi barem ovaj uređaj.
  if (error) await sb().auth.signOut({ scope: "local" });
  postaviVlasnika(null);
  postavi({ sesija: null, profil: null, prijateljstva: [], lokacije: [], profilUcitan: false });
}

function prevedi(poruka: string) {
  const p = poruka.toLowerCase();
  if (p.includes("invalid login"))
    return new Error("Pogrešan e-mail ili lozinka. Ako još nemate račun, odaberite „Novi račun”.");
  if (p.includes("email not confirmed")) return new Error("Najprije potvrdite e-mail adresu (poveznica je u e-pošti).");
  if (p.includes("already registered")) return new Error("Taj e-mail je već registriran. Prijavite se.");
  if (p.includes("weak") || p.includes("pwned") || p.includes("leaked"))
    return new Error("Lozinka je preslaba ili se pojavila u poznatim curenjima podataka. Odaberite drugu.");
  if (p.includes("password")) return new Error("Lozinka mora imati barem 8 znakova, i slova i brojke.");
  if (p.includes("rate limit")) return new Error("Previše pokušaja. Pričekajte malo pa pokušajte ponovno.");
  if (p.includes("duplicate key") && p.includes("korisnicko_ime")) return new Error("To korisničko ime je zauzeto.");
  if (p.includes("check constraint") && p.includes("korisnicko_ime"))
    return new Error("Korisničko ime: 3–24 znaka, mala slova, brojevi, točka ili podvlaka.");
  if (p.includes("relation") && p.includes("does not exist"))
    return new Error("Baza za prijatelje još nije postavljena (pokrenite lov_shema.sql u Supabaseu).");
  return new Error(poruka);
}

/* ---------------- Profil i prijatelji ---------------- */

const POLJA_PROFILA = "id,korisnicko_ime,ime,drustvo";

export async function spremiProfil(korisnickoIme: string, ime: string, drustvo?: string) {
  const id = stanje.sesija?.user.id;
  if (!id) throw new Error("Niste prijavljeni");
  const { data, error } = await sb()
    .from("lov_profili")
    .upsert({ id, korisnicko_ime: korisnickoIme.trim().toLowerCase(), ime: ime.trim(), drustvo: drustvo?.trim() || null })
    .select(POLJA_PROFILA)
    .single();
  if (error) throw prevedi(error.message);
  postavi({ profil: data as Profil });
}

/** Pretraga lovaca na poslužitelju: bez obzira na kvačice (č ć ž š đ), s @ ili bez, više riječi bilo kojim redom. */
export async function trazi(upit: string): Promise<Profil[]> {
  const q = upit.trim().replace(/^@+/, "");
  if (q.length < 2) return [];
  const { data, error } = await sb().rpc("lov_trazi_lovce", { upit: q.slice(0, 60) });
  if (error) throw prevedi(error.message);
  return (data ?? []) as Profil[];
}

export async function posaljiZahtjev(za: string) {
  const ja = stanje.sesija?.user.id;
  if (!ja) return;
  // Ako je drugi lovac već poslao zahtjev nama, samo ga prihvatimo.
  const dolazni = stanje.prijateljstva.find((p) => p.dolazni && p.drugi.id === za && p.status === "ceka");
  if (dolazni) return prihvati(dolazni.id);
  const { error } = await sb().from("lov_prijateljstva").insert({ od: ja, za });
  if (error && !error.message.includes("duplicate")) throw prevedi(error.message);
  await osvjezi();
}

export async function prihvati(id: number) {
  const { error } = await sb().from("lov_prijateljstva").update({ status: "prihvaceno" }).eq("id", id);
  if (error) throw prevedi(error.message);
  await osvjezi();
}

export async function ukloni(id: number) {
  const { error } = await sb().from("lov_prijateljstva").delete().eq("id", id);
  if (error) throw prevedi(error.message);
  await osvjezi();
}

let osvjezavanje: Promise<void> | null = null;
export function osvjezi() {
  if (!osvjezavanje) osvjezavanje = osvjeziInterno().finally(() => (osvjezavanje = null));
  return osvjezavanje;
}

async function osvjeziInterno() {
  const ja = stanje.sesija?.user.id;
  if (!ja) return;
  const k = sb();
  const [prof, prij, lok] = await Promise.all([
    k.from("lov_profili").select(POLJA_PROFILA).eq("id", ja).maybeSingle(),
    k
      .from("lov_prijateljstva")
      .select(`id,od,za,status,od_p:lov_profili!lov_prijateljstva_od_fkey(${POLJA_PROFILA}),za_p:lov_profili!lov_prijateljstva_za_fkey(${POLJA_PROFILA})`),
    k.from("lov_lokacije").select("korisnik,lat,lng,tocnost,azurirano,aktivno_do").neq("korisnik", ja),
  ]);
  if (prof.error || prij.error || lok.error) return;

  type Red = { id: number; od: string; za: string; status: "ceka" | "prihvaceno"; od_p: Profil; za_p: Profil };
  const prijateljstva: Prijateljstvo[] = ((prij.data ?? []) as unknown as Red[]).map((r) => ({
    id: r.id,
    status: r.status,
    dolazni: r.za === ja,
    drugi: r.od === ja ? r.za_p : r.od_p,
  }));
  const poId = new Map(prijateljstva.filter((p) => p.status === "prihvaceno").map((p) => [p.drugi.id, p.drugi]));
  const sada = Date.now();
  const lokacije: LokacijaLovca[] = (lok.data ?? [])
    .filter((l) => poId.has(l.korisnik) && Date.parse(l.aktivno_do) > sada)
    .map((l) => ({
      profil: poId.get(l.korisnik)!,
      lat: l.lat,
      lng: l.lng,
      tocnost: l.tocnost,
      azurirano: Date.parse(l.azurirano),
      aktivnoDo: Date.parse(l.aktivno_do),
    }));
  postavi({ profil: (prof.data as Profil | null) ?? null, prijateljstva, lokacije, profilUcitan: true });
  provjeriAlarm();
}

/** Alarm blizine radi dok sam u lovu (tada je poznata moja pozicija). */
function provjeriAlarm() {
  const p = stanje.pozicija;
  if (!stanje.dijelim || !p || Date.now() - p.t > 120000) return;
  provjeriBlizinu(
    stanje.lokacije
      .filter((l) => Date.now() - l.azurirano < 30 * 60000)
      .map((l) => ({ id: l.profil.id, ime: l.profil.ime, udaljenost: udaljenostM(p, l) })),
  );
}

/* ---------------- Dijeljenje lokacije ---------------- */

const KLJUC_DIJELJENJA = "lovacki-dnevnik:dijelim";
let pracenje: (() => void) | null = null;
let zadnjeSlanje: { t: number; lat: number; lng: number } | null = null;
let zakljucavanje: WakeLockSentinel | null = null;

export function drziZaslonUkljucen(): boolean {
  try {
    return localStorage.getItem("lovacki-dnevnik:zaslon") === "1";
  } catch {
    return false;
  }
}

export function postaviDrzanjeZaslona(da: boolean) {
  try {
    localStorage.setItem("lovacki-dnevnik:zaslon", da ? "1" : "0");
  } catch {}
  if (da && stanje.dijelim) zakljucajZaslon();
  else otkljucajZaslon();
}

async function zakljucajZaslon() {
  try {
    if (!zakljucavanje && "wakeLock" in navigator && document.visibilityState === "visible") {
      zakljucavanje = await navigator.wakeLock.request("screen");
      zakljucavanje.addEventListener("release", () => (zakljucavanje = null));
    }
  } catch {
    // Uređaj ne dopušta – nastavljamo bez toga.
  }
}

function otkljucajZaslon() {
  zakljucavanje?.release().catch(() => {});
  zakljucavanje = null;
}

async function posaljiPoziciju(p: MojaPozicija, prisilno = false) {
  const ja = stanje.sesija?.user.id;
  if (!ja || !stanje.dijelim) return;
  const pomak = zadnjeSlanje ? udaljenostM(zadnjeSlanje, p) : Infinity;
  if (!prisilno && zadnjeSlanje && Date.now() - zadnjeSlanje.t < 30000 && pomak < 25) return;
  zadnjeSlanje = { t: Date.now(), lat: p.lat, lng: p.lng };
  await sb()
    .from("lov_lokacije")
    .upsert({
      korisnik: ja,
      lat: p.lat,
      lng: p.lng,
      tocnost: Math.round(p.tocnost),
      azurirano: new Date().toISOString(),
      aktivno_do: new Date(stanje.dijelim.do).toISOString(),
    });
}

function pokreniPracenje() {
  if (pracenje != null || (!uAplikaciji() && !navigator.geolocation)) return;
  pracenje = pratiLokaciju(
    (pos) => {
      const p = { ...pos, t: Date.now() };
      postavi({ pozicija: p, greskaLokacije: null });
      provjeriAlarm();
      posaljiPoziciju(p).catch(() => {});
    },
    (odbijeno) =>
      postavi({
        greskaLokacije: odbijeno
          ? uAplikaciji()
            ? "Pristup lokaciji je odbijen. Dopustite ga u postavkama mobitela (Aplikacije → CroLovac → Dopuštenja)."
            : "Pristup lokaciji je odbijen. Dopustite ga u postavkama preglednika."
          : "Lokacija trenutno nije dostupna.",
      }),
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 },
  );
  if (drziZaslonUkljucen()) zakljucajZaslon();
}

function zaustaviPracenje() {
  pracenje?.();
  pracenje = null;
  otkljucajZaslon();
}

export async function pokreniDijeljenje(minuta: number) {
  const doT = Date.now() + minuta * 60000;
  pripremiZvuk();
  ponistiBlizinu();
  try {
    localStorage.setItem(KLJUC_DIJELJENJA, String(doT));
  } catch {}
  zadnjeSlanje = null;
  postavi({ dijelim: { do: doT } });
  pokreniPracenje();
  if (stanje.pozicija && Date.now() - stanje.pozicija.t < 60000) await posaljiPoziciju(stanje.pozicija, true);
}

export async function zaustaviDijeljenje() {
  try {
    localStorage.removeItem(KLJUC_DIJELJENJA);
  } catch {}
  zaustaviPracenje();
  ponistiBlizinu();
  postavi({ dijelim: null });
  const ja = stanje.sesija?.user.id;
  if (ja) await sb().from("lov_lokacije").delete().eq("korisnik", ja);
}

/** Jednokratno dohvaća vlastitu poziciju (za udaljenosti bez dijeljenja). */
export function osvjeziPoziciju() {
  navigator.geolocation?.getCurrentPosition(
    (pos) =>
      postavi({
        pozicija: { lat: pos.coords.latitude, lng: pos.coords.longitude, tocnost: pos.coords.accuracy, t: Date.now() },
        greskaLokacije: null,
      }),
    () => postavi({ greskaLokacije: "Lokacija trenutno nije dostupna." }),
    { enableHighAccuracy: true, timeout: 15000 },
  );
}

/* ---------------- Pokretanje (jednom, iz ljuske aplikacije) ---------------- */

const KLJUC_AKTIVNOSTI = "lovacki-dnevnik:zadnja-aktivnost";
/** Nakon ovoliko dana bez otvaranja aplikacije korisnik se mora ponovno prijaviti. */
export const ISTEK_PRIJAVE_DANA = 60;

function zabiljeziAktivnost() {
  try {
    localStorage.setItem(KLJUC_AKTIVNOSTI, String(Date.now()));
  } catch {}
}

function zadnjaAktivnost() {
  try {
    return Number(localStorage.getItem(KLJUC_AKTIVNOSTI)) || 0;
  } catch {
    return 0;
  }
}

function spremljenaSesija(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KLJUC_PRIJAVE) ?? "null") as Session | null;
    return s?.user?.id && s.refresh_token ? s : null;
  } catch {
    return null;
  }
}

let pokrenuto = false;
export function pokreniDrustvo() {
  if (pokrenuto || !konfigurirano) {
    if (!konfigurirano) {
      // Bez poslužitelja nema računa – dnevnik je lokalan kao prije.
      postaviVlasnika("lokalno");
      postavi({ spremno: true });
    }
    return;
  }
  pokrenuto = true;
  // Predugo neaktivni korisnici moraju se ponovno prijaviti: spremljena prijava briše se
  // prije pokretanja Supabase klijenta, pa se stari račun ni na trenutak ne učita.
  const zadnja = zadnjaAktivnost();
  if (zadnja && Date.now() - zadnja > ISTEK_PRIJAVE_DANA * 86400000) {
    try {
      if (localStorage.getItem(KLJUC_PRIJAVE)) {
        localStorage.removeItem(KLJUC_PRIJAVE);
        localStorage.removeItem(KLJUC_DIJELJENJA);
        localStorage.setItem(KLJUC_ISTEKLA, "1");
      }
    } catch {}
  }
  try {
    if (localStorage.getItem(KLJUC_ISTEKLA)) postavi({ prijavaIstekla: true });
  } catch {}
  const k = sb();
  k.auth.getSession().then(({ data, error }) => {
    zabiljeziAktivnost();
    // Bez signala (npr. u šumi) istekli token se ne može obnoviti pa Supabase ne vraća sesiju,
    // iako je prijava i dalje spremljena. Tada koristimo spremljenu prijavu; token se obnovi
    // čim se veza vrati.
    let sesija = data.session;
    if (!sesija && (error || !navigator.onLine)) {
      sesija = spremljenaSesija();
      if (sesija) window.addEventListener("online", () => k.auth.getSession().catch(() => {}), { once: true });
    }
    postaviVlasnika(sesija?.user.id ?? null);
    postavi({ sesija, spremno: true });
    if (sesija) {
      osvjezi();
      // Nastavi dijeljenje ako je bilo uključeno i još nije isteklo.
      let doT = 0;
      try {
        doT = Number(localStorage.getItem(KLJUC_DIJELJENJA)) || 0;
      } catch {}
      if (doT > Date.now()) {
        postavi({ dijelim: { do: doT } });
        pokreniPracenje();
      }
    }
  });
  k.auth.onAuthStateChange((dogadaj, sesija) => {
    // Prazna sesija bez stvarne odjave (npr. neuspjelo obnavljanje bez signala) ne odjavljuje korisnika.
    if (!sesija && dogadaj !== "SIGNED_OUT") return;
    const promjena = sesija?.user.id !== stanje.sesija?.user.id;
    if (stanje.spremno) postaviVlasnika(sesija?.user.id ?? null);
    postavi({ sesija });
    if (sesija && promjena) osvjezi();
  });

  // U lovu se pozicije prijatelja osvježavaju češće (zbog alarma blizine).
  let otkucaj = 0;
  setInterval(() => {
    otkucaj++;
    if (stanje.dijelim && Date.now() > stanje.dijelim.do) zaustaviDijeljenje().catch(() => {});
    // U Android aplikaciji se i sa skrivenom aplikacijom osvježava dok dijelim (alarm blizine radi i u džepu).
    const vidljivo = document.visibilityState === "visible" || (uAplikaciji() && stanje.dijelim);
    if (stanje.sesija && vidljivo && (stanje.dijelim || otkucaj % 2 === 0)) osvjezi();
  }, 10000);

  // Zvuk alarma smije se pripremiti tek nakon dodira korisnika.
  document.addEventListener("pointerdown", () => stanje.dijelim && pripremiZvuk(), { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    zabiljeziAktivnost();
    if (stanje.sesija) osvjezi();
    if (stanje.dijelim) {
      pokreniPracenje();
      if (drziZaslonUkljucen()) zakljucajZaslon();
      if (stanje.pozicija) posaljiPoziciju(stanje.pozicija, true).catch(() => {});
    }
  });
}

/** Prijatelji u lovu blizu mene (za upozorenje). */
export function lovciUBlizini(s: Stanje, granicaM = postavkeBlizine().granica) {
  if (!s.pozicija) return [];
  return s.lokacije
    .map((l) => ({ ...l, udaljenost: udaljenostM(s.pozicija!, l) }))
    .filter((l) => l.udaljenost <= granicaM)
    .sort((a, b) => a.udaljenost - b.udaljenost);
}

export function prijeKoliko(t: number) {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "upravo";
  if (min < 60) return `prije ${min} min`;
  const h = Math.floor(min / 60);
  return `prije ${h} h`;
}
