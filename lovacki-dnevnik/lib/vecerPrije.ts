"use client";

// Obavijest večer prije (Android aplikacija, besplatno): u 20:00 javi ako je sutra dobar termin za lov
// i na koju čeku je vjetar dobar. Svakim otvaranjem aplikacije presložuje se za iduće tri večeri
// iz svježe prognoze – pa radi i kad korisnik koji dan ne otvori aplikaciju.

import { LocalNotifications } from "@capacitor/local-notifications";
import { izgledLova, type DanLova, type Termin } from "./izgledLova";
import { sat } from "./format";
import { uAplikaciji } from "./nativno";
import { konfigurirano, sb } from "./drustvo";
import { db } from "./store";
import { STRANE, imaVjetrove, ocjenaVjetra, tockaZaVjetar } from "./vjetarCeke";
import type { Tocka } from "./types";
import { dohvatiPrognozu } from "./vrijeme";

const KLJUC = "lovacki-dnevnik:vecer-prije";
const KANAL = "vecer-prije";
const PRVI_ID = 7200;
const VECERI = 3;
const SAT_OBAVIJESTI = 20;
/** Najmanja ocjena termina za obavijest („Dobro” i bolje). */
const PRAG = 57;

export function vecerPrijeUkljucena() {
  try {
    return localStorage.getItem(KLJUC) !== "0";
  } catch {
    return true;
  }
}

export function postaviVecerPrije(da: boolean) {
  try {
    localStorage.setItem(KLJUC, da ? "1" : "0");
  } catch {}
  void presloziVecerPrije();
}

const strana = (smjer: number) => STRANE[Math.round(smjer / 45) % 8].kratko;

/** Tekst obavijesti za dan (ili null ako termin nije barem „Dobro”, osim kad je `uvijek`). */
export function tekstVecerPrije(dan: DanLova, tocke: Tocka[], uvijek = false): { naslov: string; tijelo: string } | null {
  const kandidati = (["jutro", "vecer"] as const).flatMap((dio) => (dan[dio] ? [{ dio, t: dan[dio] as Termin }] : []));
  const naj = kandidati.sort((a, b) => b.t.ocjena - a.t.ocjena)[0];
  if (!naj || (naj.t.ocjena < PRAG && !uvijek)) return null;
  const { t } = naj;
  const ceke = tocke
    .filter((c) => tockaZaVjetar(c) && imaVjetrove(c) && ocjenaVjetra(c, t.vjetarSmjer, t.vjetarBrzina) === "dobar")
    .map((c) => c.naziv);
  const vjetar = `vjetar ${strana(t.vjetarSmjer)} ${Math.round(t.vjetarBrzina)} km/h`;
  const gdje = ceke.length ? `dobar za ${ceke.length === 1 ? "čeku" : "čeke"} ${ceke.slice(0, 2).join(", ")}${ceke.length > 2 ? "…" : ""}` : t.ukratko;
  return {
    naslov: `Sutra ${naj.dio === "jutro" ? "ujutro" : "navečer"}: ${t.oznaka.toLowerCase()} za lov 🦌`,
    tijelo: `${sat(t.od)}–${sat(t.do)} · ${vjetar} · ${gdje}`,
  };
}

/** Administrator dobiva obavijest svake večeri (i kad sutra nije dobro), da vidi radi li sve. */
async function jeAdmin() {
  if (!konfigurirano) return false;
  try {
    const { data } = await sb().rpc("lov_je_admin");
    return data === true;
  } catch {
    return false;
  }
}

/** Sutrašnji dan iz svježe prognoze za lokaciju iz postavki. */
async function danIzPrognoze(pomak: number) {
  const { lat, lng } = db.dohvati().postavke.lokacija;
  const p = await dohvatiPrognozu(lat, lng);
  const cilj = new Date(Date.now() + pomak * 86400e3).toDateString();
  return izgledLova(p.satno, lat, lng, pomak + 2).find((d) => d.datum.toDateString() === cilj);
}

/** Za administratora (gumb u Postavkama): sutrašnja obavijest odmah, za oko dvije minute. */
export async function probaVecerPrije() {
  if (!uAplikaciji()) return false;
  try {
    const dan = await danIzPrognoze(1);
    const t = dan && tekstVecerPrije(dan, db.dohvati().tocke, true);
    if (!t) return false;
    await LocalNotifications.createChannel({ id: KANAL, name: "Večer prije lova", description: "Javi kad je sutra dobar termin za lov", importance: 3 });
    await LocalNotifications.schedule({
      notifications: [
        { id: PRVI_ID + 9, title: t.naslov, body: t.tijelo, schedule: { at: new Date(Date.now() + 120e3), allowWhileIdle: true }, channelId: KANAL, smallIcon: "ic_stat_crolovac", isExactNotification: false },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

export async function presloziVecerPrije() {
  if (!uAplikaciji()) return;
  try {
    await LocalNotifications.cancel({ notifications: Array.from({ length: VECERI }, (_, i) => ({ id: PRVI_ID + i })) });
    if (!vecerPrijeUkljucena()) return;
    // Dopuštenje traži podsjetnik testiranja i Postavke; ovdje se ne pita nanovo.
    if ((await LocalNotifications.checkPermissions()).display !== "granted") return;
    const { lat, lng } = db.dohvati().postavke.lokacija;
    const p = await dohvatiPrognozu(lat, lng);
    const dani = izgledLova(p.satno, lat, lng, VECERI + 1);
    const uvijek = await jeAdmin();
    const sada = new Date();
    const obavijesti = [];
    for (let k = 1; k <= VECERI; k++) {
      const kad = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate() + k - 1, SAT_OBAVIJESTI, 0);
      if (kad.getTime() < Date.now() + 5 * 60e3) continue;
      const dan = dani.find((d) => d.datum.toDateString() === new Date(kad.getTime() + 86400e3).toDateString());
      const t = dan && tekstVecerPrije(dan, db.dohvati().tocke, uvijek);
      if (!t) continue;
      obavijesti.push({
        id: PRVI_ID + k - 1,
        title: t.naslov,
        body: t.tijelo,
        schedule: { at: kad, allowWhileIdle: true },
        channelId: KANAL,
        smallIcon: "ic_stat_crolovac",
        // Bez točnog alarma (dozvola nije u ljusci, a inače dodatak otvara „Alarmi i podsjetnici”).
        isExactNotification: false,
      });
    }
    if (!obavijesti.length) return;
    await LocalNotifications.createChannel({ id: KANAL, name: "Večer prije lova", description: "Javi kad je sutra dobar termin za lov", importance: 3 });
    await LocalNotifications.schedule({ notifications: obavijesti });
  } catch {}
}
