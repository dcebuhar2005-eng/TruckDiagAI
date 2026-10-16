"use client";

import { metri } from "./format";
import { nativnaObavijest, uAplikaciji, vibriraj, zaustaviVibraciju } from "./nativno";

/**
 * Alarm kad prijatelj u lovu uđe u zadanu udaljenost.
 * Za svakog lovca pamti se razina (0 = daleko, 1 = unutar granice, 2 = vrlo blizu) pa se
 * alarm oglasi samo kad se razina povisi, a ponovno tek kad se lovac udalji (histereza).
 */

const KLJUC = "lovacki-dnevnik:blizina";
export const GRANICE_M = [300, 500, 800, 1000] as const;
const VRLO_BLIZU_M = 200;

export interface PostavkeBlizine {
  granica: number;
  zvuk: boolean;
  vibracija: boolean;
}

// Zadano samo vibracija (u lovu zvuk plaši divljač); zvuk se može uključiti u postavkama.
const ZADANO: PostavkeBlizine = { granica: 500, zvuk: false, vibracija: true };

export function postavkeBlizine(): PostavkeBlizine {
  try {
    const s = JSON.parse(localStorage.getItem(KLJUC) ?? "{}");
    // Starije postavke imale su zvuk uključen po zadanom – prebacuju se na samo vibraciju.
    if (!s.v2) s.zvuk = false;
    return { ...ZADANO, ...s };
  } catch {
    return ZADANO;
  }
}

export function spremiPostavkeBlizine(p: Partial<PostavkeBlizine>) {
  try {
    localStorage.setItem(KLJUC, JSON.stringify({ ...postavkeBlizine(), ...p, v2: true }));
  } catch {}
}

/** iPhone (Safari) ne dopušta vibraciju iz web aplikacije. */
export const vibracijaPodrzana = () => uAplikaciji() || (typeof navigator !== "undefined" && typeof navigator.vibrate === "function");

/* ---------------- Otkucaji srca ---------------- */

/**
 * Dok je lovac u zoni, srce kuca neprestano, sve brže što je bliže. Uzorak traje 40 s i
 * obnavlja se pri svakoj provjeri (svakih ~10 s), pa ako provjere stanu (nema signala,
 * aplikacija zatvorena), vibracija sama prestane.
 */
const NIZ_MS = 40_000;
/** Uzorak se obnavlja kad mu ostane manje od ovoga (provjera je svakih ~10 s). */
const OBNOVA_MS = 12_000;

/** Jedan otkucaj „tup-tup” pa stanka do sljedećeg; razmak je trajanje cijelog otkucaja. */
const otkucaj = (razmak: number) => [80, 120, 130, Math.max(120, razmak - 330)];

/** Što bliže, to brže: na granici otkucaj svakih 1,5 s, na 50 m i bliže svakih 0,45 s. */
function razmakOtkucaja(udaljenost: number, granica: number) {
  const r = Math.min(1, Math.max(0, (udaljenost - 50) / Math.max(1, granica - 50)));
  return Math.round(450 + r * 1050);
}

let srce: { razmak: number; kraj: number } | null = null;

function kucaj(razmak: number) {
  if (srce && Math.abs(srce.razmak - razmak) < srce.razmak * 0.08 && srce.kraj - Date.now() > OBNOVA_MS) return;
  const uzorak: number[] = [];
  // U pregledniku navigator.vibrate prima ograničen niz – tamo kraći uzorak (obnavlja se svejedno).
  const trajanje = uAplikaciji() ? NIZ_MS : 25_000;
  for (let t = 0; t < trajanje && (uAplikaciji() || uzorak.length < 96); t += razmak) uzorak.push(...otkucaj(razmak));
  vibriraj(uzorak);
  srce = { razmak, kraj: Date.now() + uzorak.reduce((a, b) => a + b, 0) };
}

function stani() {
  if (!srce) return;
  srce = null;
  zaustaviVibraciju();
}

/** Za „Isprobaj alarm”: lovac prilazi – otkucaji se ubrzavaju od granice do 50 m. */
function otkucajiPrilaska(granica: number) {
  const uzorak: number[] = [];
  for (let i = 0; i < 12; i++) uzorak.push(...otkucaj(razmakOtkucaja(granica - ((granica - 50) * i) / 11, granica)));
  vibriraj(uzorak);
}

/** Lovci koje je korisnik utišao („U redu”), s udaljenošću u tom trenutku. */
const utisani = new Map<string, number>();
const uZoni = new Map<string, number>();

/** „U redu” na alarmu: srce staje dok se netko od lovaca u zoni ne približi još 30 m ili ne uđe novi. */
export function utisajAlarm() {
  for (const [id, d] of uZoni) utisani.set(id, d);
  srce = null;
  zaustaviVibraciju();
}

/* ---------------- Zvuk ---------------- */

let zvuk: AudioContext | null = null;

/** Mora se pozvati iz korisničke radnje (dodir) da bi preglednik kasnije dopustio zvuk. */
export function pripremiZvuk() {
  try {
    zvuk ??= new AudioContext();
    if (zvuk.state === "suspended") zvuk.resume().catch(() => {});
  } catch {}
}

function zapistiZvuk(hitno: boolean) {
  if (!zvuk) return;
  if (zvuk.state === "suspended") zvuk.resume().catch(() => {});
  const t0 = zvuk.currentTime + 0.05;
  const tonovi = hitno ? [0, 0.22, 0.44, 0.66, 0.88] : [0, 0.3, 0.6];
  for (const [i, dt] of tonovi.entries()) {
    const o = zvuk.createOscillator();
    const g = zvuk.createGain();
    o.type = "square";
    o.frequency.value = i % 2 ? 880 : 1320;
    g.gain.setValueAtTime(0.0001, t0 + dt);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
    o.connect(g).connect(zvuk.destination);
    o.start(t0 + dt);
    o.stop(t0 + dt + 0.2);
  }
}

/* ---------------- Obavijest sustava ---------------- */

export function dozvolaObavijesti(): NotificationPermission | "nepodrzano" {
  return typeof Notification === "undefined" ? "nepodrzano" : Notification.permission;
}

export async function zatraziObavijesti() {
  if (typeof Notification === "undefined") return "nepodrzano" as const;
  return Notification.requestPermission();
}

async function sistemskaObavijest(naslov: string, tijelo: string) {
  if (uAplikaciji()) return nativnaObavijest(naslov, tijelo);
  if (dozvolaObavijesti() !== "granted") return;
  const opcije = { body: tijelo, tag: "lovac-blizu", renotify: true, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", requireInteraction: true } as NotificationOptions;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(naslov, opcije));
    new Notification(naslov, opcije);
  } catch {}
}

/* ---------------- Alarm ---------------- */

type Javi = (poruka: string) => void;
let javi: Javi = () => {};
/** UI se prijavljuje da prikaže poruku unutar aplikacije. */
export function naAlarm(f: Javi) {
  javi = f;
}

export function oglasiAlarm(ime: string, udaljenost: number, hitno: boolean, proba = false) {
  const p = postavkeBlizine();
  const naslov = hitno ? "Lovac vrlo blizu!" : "Lovac u blizini";
  const tijelo = `${ime} je ${metri(udaljenost)} od vas. Provjerite smjer pucanja.`;
  if (p.vibracija && proba) otkucajiPrilaska(p.granica);
  if (p.zvuk) zapistiZvuk(hitno);
  javi(`${naslov}: ${tijelo}`);
  if (document.visibilityState !== "visible") sistemskaObavijest(naslov, tijelo);
}

const razine = new Map<string, number>();

/** Poziva se nakon svake promjene moje pozicije ili pozicija prijatelja. */
export function provjeriBlizinu(lovci: { id: string; ime: string; udaljenost: number }[]) {
  const { granica, vibracija } = postavkeBlizine();
  const vidjeni = new Set<string>();
  let najblizi = Infinity;
  for (const l of lovci) {
    vidjeni.add(l.id);
    const prije = razine.get(l.id) ?? 0;
    let sada = l.udaljenost <= Math.min(VRLO_BLIZU_M, granica) ? 2 : l.udaljenost <= granica ? 1 : 0;
    // Histereza: razina pada tek kad se lovac osjetno udalji, da alarm ne zvoni stalno na rubu.
    if (sada < prije) {
      if (prije === 2 && l.udaljenost <= Math.min(VRLO_BLIZU_M, granica) * 1.5) sada = 2;
      else if (l.udaljenost <= granica * 1.3) sada = Math.max(sada, 1);
    }
    if (sada > prije) {
      utisani.delete(l.id);
      oglasiAlarm(l.ime, l.udaljenost, sada === 2);
    }
    razine.set(l.id, sada);
    if (!sada) {
      uZoni.delete(l.id);
      utisani.delete(l.id);
      continue;
    }
    uZoni.set(l.id, l.udaljenost);
    const tiho = utisani.get(l.id);
    if (tiho != null && l.udaljenost <= tiho - 30) utisani.delete(l.id);
    if (!utisani.has(l.id)) najblizi = Math.min(najblizi, l.udaljenost);
  }
  for (const m of [razine, uZoni, utisani]) for (const id of m.keys()) if (!vidjeni.has(id)) m.delete(id);
  if (vibracija && najblizi < Infinity) kucaj(razmakOtkucaja(najblizi, granica));
  else stani();
}

export function ponistiBlizinu() {
  razine.clear();
  uZoni.clear();
  utisani.clear();
  stani();
}
