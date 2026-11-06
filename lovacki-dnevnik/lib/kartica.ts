"use client";

// Kartica lova: slika 1080×1350 (Instagram/Facebook omjer 4:5) nakon odstrela – za WhatsApp, Facebook…
// U Android aplikaciji dijeli se kroz nativne dodatke Share + Filesystem (od verzije s tim dodacima);
// u pregledniku i na iPhoneu kroz Web Share; inače se slika preuzme.

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { datumDugi } from "./format";
import { nazivSpola } from "./katalog";
import type { Odstrel } from "./types";

const S = 1080;
const V = 1350;
const ZLATO = "#e8a947";

function slika(src: string) {
  return new Promise<HTMLImageElement>((ok, ne) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = ne;
    i.src = src;
  });
}

function obitelj(varijabla: string, rezerva: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varijabla).trim();
  return v ? `${v}, ${rezerva}` : rezerva;
}

/** Nacrta karticu i vrati PNG. `foto` je URL fotografije odstrela (ili prazno). */
export async function nacrtajKarticu(o: Odstrel, foto: string | undefined, lovisteNaziv?: string): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = S;
  c.height = V;
  const g = c.getContext("2d")!;
  const serif = obitelj("--font-fraunces", "Georgia, serif");
  const sans = obitelj("--font-geist", "system-ui, sans-serif");
  await Promise.all([document.fonts.load(`600 96px ${serif}`), document.fonts.load(`500 40px ${sans}`)]).catch(() => {});

  // Pozadina: fotografija (cover) ili tamna šuma.
  g.fillStyle = "#0b100c";
  g.fillRect(0, 0, S, V);
  if (foto) {
    try {
      const i = await slika(foto);
      const k = Math.max(S / i.width, V / i.height);
      const w = i.width * k;
      const h = i.height * k;
      g.drawImage(i, (S - w) / 2, (V - h) / 2, w, h);
    } catch {}
  } else {
    const r = g.createRadialGradient(S / 2, V * 0.35, 50, S / 2, V * 0.35, V * 0.8);
    r.addColorStop(0, "#26331f");
    r.addColorStop(1, "#0b100c");
    g.fillStyle = r;
    g.fillRect(0, 0, S, V);
    g.font = `260px ${sans}`;
    g.textAlign = "center";
    g.fillText(o.vrsta === "Divlja svinja" ? "🐗" : "🦌", S / 2, V * 0.42);
  }

  // Zatamnjenje gore i dolje da se tekst čita.
  const gore = g.createLinearGradient(0, 0, 0, 260);
  gore.addColorStop(0, "rgba(0,0,0,.6)");
  gore.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gore;
  g.fillRect(0, 0, S, 260);
  const dolje = g.createLinearGradient(0, V * 0.5, 0, V);
  dolje.addColorStop(0, "rgba(0,0,0,0)");
  dolje.addColorStop(0.55, "rgba(0,0,0,.72)");
  dolje.addColorStop(1, "rgba(0,0,0,.92)");
  g.fillStyle = dolje;
  g.fillRect(0, V * 0.5, S, V * 0.5);

  // Znak CroLovca gore lijevo.
  try {
    const ik = await slika("/icons/icon-192.png");
    g.save();
    g.beginPath();
    g.roundRect(56, 56, 88, 88, 22);
    g.clip();
    g.drawImage(ik, 56, 56, 88, 88);
    g.restore();
  } catch {}
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.font = `600 46px ${serif}`;
  g.fillStyle = ZLATO;
  g.fillText("Cro", 164, 100);
  const cro = g.measureText("Cro").width;
  g.fillStyle = "#f3efe6";
  g.fillText("Lovac", 164 + cro, 100);

  // Tekst dolje.
  g.textBaseline = "alphabetic";
  let y = V - 330;
  g.font = `500 38px ${sans}`;
  g.fillStyle = ZLATO;
  g.fillText(`${nazivSpola(o.vrsta, o.spol).toUpperCase()}`, 72, y);
  y += 96;
  g.font = `600 92px ${serif}`;
  g.fillStyle = "#ffffff";
  g.fillText(o.vrsta, 72, y, S - 144);
  y += 64;
  const crte = [datumDugi(o.datum), o.masa ? `${o.masa.toLocaleString("hr-HR")} kg` : "", lovisteNaziv ?? ""].filter(Boolean).join("  ·  ");
  g.font = `400 36px ${sans}`;
  g.fillStyle = "rgba(255,255,255,.82)";
  g.fillText(crte, 72, y, S - 144);
  y += 92;
  g.font = `italic 600 54px ${serif}`;
  g.fillStyle = ZLATO;
  g.fillText("Dobra kob! 🍀", 72, y);
  g.textAlign = "right";
  g.font = `500 30px ${sans}`;
  g.fillStyle = "rgba(255,255,255,.65)";
  g.fillText("crolovac.com", S - 72, y);

  return new Promise((ok, ne) => c.toBlob((b) => (b ? ok(b) : ne(new Error("Slika nije napravljena"))), "image/png"));
}

const uBase64 = (b: Blob) =>
  new Promise<string>((ok, ne) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = ne;
    r.readAsDataURL(b);
  });

/** Može li se kartica podijeliti na ovom uređaju (Android aplikacija treba novu verziju s dodacima). */
export function moguDijeliti() {
  if (Capacitor.isNativePlatform()) return Capacitor.isPluginAvailable("Share") && Capacitor.isPluginAvailable("Filesystem");
  return true;
}

/** Podijeli karticu; vraća false ako je korisnik odustao. */
export async function podijeliKarticu(b: Blob, ime: string, tekst: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const f = await Filesystem.writeFile({ path: ime, data: await uBase64(b), directory: Directory.Cache });
    try {
      await Share.share({ title: "CroLovac", text: tekst, files: [f.uri], dialogTitle: "Podijeli kartu lova" });
      return true;
    } catch {
      return false;
    }
  }
  const datoteka = new File([b], ime, { type: "image/png" });
  if (navigator.canShare?.({ files: [datoteka] })) {
    try {
      await navigator.share({ files: [datoteka], text: tekst });
      return true;
    } catch {
      return false;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = ime;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
