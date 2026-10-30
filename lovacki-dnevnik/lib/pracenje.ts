"use client";

// Dojave rušenja (Sentry) i anonimna statistika korištenja (PostHog) – oba na poslužiteljima u EU.
// Ne šalje se sadržaj dnevnika, lokacija, e-mail ni ime: samo koje stranice i funkcije se koriste
// (npr. „dodan izlazak”) i tehnički opis greške. Korisnik statistiku može isključiti u Postavkama.
// Biblioteke se učitavaju tek kad je aplikacija u miru, da ne usporavaju prvo otvaranje.

import type { PostHog } from "posthog-js";
import { uAplikaciji } from "./nativno";

const SENTRY_DSN = "https://cbfe3cfa037a8683bf700d1a4a24e894@o4512295445790720.ingest.de.sentry.io/4512295561330768";
const POSTHOG_KLJUC = "phc_nMe5XUMWSAnhyHXpkSTrfaiwXQvc3saQ8RP4NvcKikrJ";
const KLJUC_ISKLJUCENO = "lovacki-dnevnik:bez-statistike";
const KLJUC_IZVOR = "lovacki-dnevnik:izvor";

type Svojstva = Record<string, string | number | boolean | undefined>;

let ph: PostHog | null = null;
let sentry: typeof import("@sentry/browser") | null = null;
let pokrenuto = false;
const naCekanju: [string, Svojstva | undefined][] = [];
let korisnik: string | null | undefined;

let izvor: Svojstva = {};

/**
 * Odakle je korisnik prvi put došao: utm_* iz poveznice ili QR koda oglasa (Facebook, Instagram, TikTok…).
 * Čita se odmah pri otvaranju (prije nego što aplikacija promijeni adresu) i pamti se samo prvi dolazak.
 */
function izvorDolaska(): Svojstva {
  try {
    const q = new URLSearchParams(location.search);
    const utm = (k: string) => q.get(`utm_${k}`)?.slice(0, 60) || undefined;
    if (utm("source") && !localStorage.getItem(KLJUC_IZVOR))
      localStorage.setItem(KLJUC_IZVOR, JSON.stringify({ izvor: utm("source"), medij: utm("medium"), kampanja: utm("campaign"), oglas: utm("content") }));
    return JSON.parse(localStorage.getItem(KLJUC_IZVOR) ?? "{}");
  } catch {
    return {};
  }
}

/** Na razvojnom računalu i u testovima ništa se ne šalje. */
const lokalno = () => /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname);

export function statistikaUkljucena() {
  try {
    return localStorage.getItem(KLJUC_ISKLJUCENO) !== "1";
  } catch {
    return true;
  }
}

export function postaviStatistiku(ukljuceno: boolean) {
  try {
    if (ukljuceno) localStorage.removeItem(KLJUC_ISKLJUCENO);
    else localStorage.setItem(KLJUC_ISKLJUCENO, "1");
  } catch {}
  if (!ph) return;
  if (ukljuceno) ph.opt_in_capturing();
  else ph.opt_out_capturing();
}

export function pokreniPracenje() {
  if (pokrenuto || typeof window === "undefined") return;
  izvor = izvorDolaska();
  if (lokalno()) return;
  pokrenuto = true;
  const ucitaj = async () => {
    const [s, p] = await Promise.all([import("@sentry/browser"), import("posthog-js")]);
    s.init({
      dsn: SENTRY_DSN,
      release: process.env.NEXT_PUBLIC_VERZIJA,
      environment: uAplikaciji() ? "android" : "web",
      // Bez osobnih podataka: ni kolačića, zaglavlja, sadržaja zahtjeva ni parametara adrese.
      dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
      tracesSampleRate: 0,
      // Bez signala u lovištu mrežne greške su očekivane.
      ignoreErrors: [/Failed to fetch/, /Load failed/, /NetworkError/, /Nema internetske veze/, /aborted/i, /ResizeObserver loop/],
      beforeSend: (e) => (navigator.onLine ? e : null),
    });
    sentry = s;
    const posthog = p.default;
    posthog.init(POSTHOG_KLJUC, {
      api_host: "https://eu.i.posthog.com",
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: "history_change",
      autocapture: false,
      capture_dead_clicks: false,
      disable_session_recording: true,
      capture_exceptions: false,
      persistence: "localStorage",
      person_profiles: "identified_only",
      opt_out_capturing_by_default: !statistikaUkljucena(),
      // Adrese bez parametara: npr. /karta?fokus=45.3,14.7 otkrila bi položaj čeke.
      before_send: (e) => {
        if (!e) return e;
        for (const k of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer", "$prev_pageview_pathname"]) {
          const v = e.properties?.[k];
          if (typeof v === "string") e.properties[k] = v.split(/[?#]/)[0];
        }
        if (e.$set_once) for (const k of ["$initial_current_url", "$initial_referrer"]) {
          const v = e.$set_once[k];
          if (typeof v === "string") e.$set_once[k] = v.split(/[?#]/)[0];
        }
        return e;
      },
    });
    posthog.register({ platforma: uAplikaciji() ? "android" : "web", verzija: process.env.NEXT_PUBLIC_VERZIJA, ...izvor });
    ph = posthog;
    if (korisnik !== undefined) identificiraj(korisnik);
    for (const [ime, sv] of naCekanju.splice(0)) posthog.capture(ime, sv);
  };
  const kad = () => void ucitaj().catch(() => {});
  if ("requestIdleCallback" in window) requestIdleCallback(kad, { timeout: 6000 });
  else setTimeout(kad, 2000);
}

/** Događaj korištenja, npr. dogadaj("izlazak_dodan"). Bez osobnih podataka u svojstvima! */
export function dogadaj(ime: string, svojstva?: Svojstva) {
  if (typeof window === "undefined") return;
  if (ph) ph.capture(ime, svojstva);
  else if (pokrenuto && naCekanju.length < 30) naCekanju.push([ime, svojstva]);
}

/** Prijavljeni korisnik po internom ID-u (bez e-maila i imena), da se vidi tko se vraća. */
export function identificiraj(id: string | null) {
  korisnik = id;
  if (sentry) sentry.setUser(id ? { id } : null);
  if (!ph) return;
  if (id) {
    if (ph.get_distinct_id() !== id) ph.identify(id, undefined, izvor.izvor ? { prvi_izvor: izvor.izvor, prva_kampanja: izvor.kampanja } : undefined);
  } else ph.reset();
}

/** Ručno prijavljena greška (npr. iz granice greške stranice). */
export function prijaviIznimku(g: unknown) {
  sentry?.captureException(g);
}
