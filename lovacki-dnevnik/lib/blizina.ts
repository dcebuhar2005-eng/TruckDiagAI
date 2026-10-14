"use client";

import { metri } from "./format";
import { nativnaObavijest, uAplikaciji, vibriraj } from "./nativno";

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

export function oglasiAlarm(ime: string, udaljenost: number, hitno: boolean) {
  const p = postavkeBlizine();
  const naslov = hitno ? "Lovac vrlo blizu!" : "Lovac u blizini";
  const tijelo = `${ime} je ${metri(udaljenost)} od vas. Provjerite smjer pucanja.`;
  if (p.vibracija) vibriraj(hitno ? [400, 120, 400, 120, 400, 120, 800] : [300, 150, 300, 150, 600]);
  if (p.zvuk) zapistiZvuk(hitno);
  javi(`${naslov}: ${tijelo}`);
  if (document.visibilityState !== "visible") sistemskaObavijest(naslov, tijelo);
}

const razine = new Map<string, number>();

/** Poziva se nakon svake promjene moje pozicije ili pozicija prijatelja. */
export function provjeriBlizinu(lovci: { id: string; ime: string; udaljenost: number }[]) {
  const { granica } = postavkeBlizine();
  const vidjeni = new Set<string>();
  for (const l of lovci) {
    vidjeni.add(l.id);
    const prije = razine.get(l.id) ?? 0;
    let sada = l.udaljenost <= Math.min(VRLO_BLIZU_M, granica) ? 2 : l.udaljenost <= granica ? 1 : 0;
    // Histereza: razina pada tek kad se lovac osjetno udalji, da alarm ne zvoni stalno na rubu.
    if (sada < prije) {
      if (prije === 2 && l.udaljenost <= Math.min(VRLO_BLIZU_M, granica) * 1.5) sada = 2;
      else if (l.udaljenost <= granica * 1.3) sada = Math.max(sada, 1);
    }
    if (sada > prije) oglasiAlarm(l.ime, l.udaljenost, sada === 2);
    razine.set(l.id, sada);
  }
  for (const id of razine.keys()) if (!vidjeni.has(id)) razine.delete(id);
}

export function ponistiBlizinu() {
  razine.clear();
}
