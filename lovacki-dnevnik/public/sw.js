/* CroLovac – service worker: rad bez signala.
 *
 * - Ljuska aplikacije (stranice i /_next/static) sprema se pa se aplikacija otvara i bez interneta.
 *   Stranice se dohvaćaju kao HTML (Accept: text/html) – u Android aplikaciji tako dobiju i
 *   nativni most (GPS u pozadini, obavijesti), pa i spremljena kopija radi s njima bez signala.
 * - Sa slabim signalom stranica se ne čeka dulje od nekoliko sekundi – otvara se spremljena kopija.
 *   Kad mreža jednom zakaže, minutu se odmah otvaraju spremljene stranice (bez ponovnog čekanja),
 *   a prijelaz između stranica (RSC) odmah prelazi na spremljenu stranicu.
 * - Pločice karte: najprije iz spremljenih (offline) područja, zatim iz predmemorije
 *   nedavno gledanih pločica, tek onda s mreže.
 */

const LJUSKA = "lov-ljuska-v2";
const STATIKA = "lov-statika-v1";
const OFFLINE = "lov-offline-v1"; // ručno preuzeta područja – brišu se samo na zahtjev
const NEDAVNO = "lov-plocice-v1"; // pasivno, ograničeno na MAKS_NEDAVNIH
const MAKS_NEDAVNIH = 2500;

const STRANICE = ["/", "/lov", "/dnevnik", "/karta", "/lovci", "/lovista", "/dozvole", "/statistika", "/postavke", "/izvori", "/privatnost"];
/** Koliko najdulje čekati mrežu za stranicu prije nego se otvori spremljena kopija. */
const CEKANJE_MS = 2500;
const HTML = { Accept: "text/html,application/xhtml+xml" };

// Poslužitelji pločica koji šalju CORS zaglavlja (spremaju se bez „opaque” kazne za kvotu).
const PLOCICE_CORS = ["server.arcgisonline.com", "services.arcgisonline.com", "clarity.maptiles.arcgis.com"];
const PLOCICE_OSTALO = ["tile.opentopomap.org", "tile-cyclosm.openstreetmap.fr", "geoportal.dgu.hr"];

const jePlocica = (u) => [...PLOCICE_CORS, ...PLOCICE_OSTALO].some((h) => u.hostname === h || u.hostname.endsWith("." + h));

async function spremiLjusku() {
  const c = await caches.open(LJUSKA);
  const s = await caches.open(STATIKA);
  const statika = new Set();
  await Promise.all(
    STRANICE.map(async (p) => {
      try {
        const r = await fetch(p, { cache: "no-store", headers: HTML });
        if (!r.ok) return;
        const html = await r.clone().text();
        await c.put(p, r);
        for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) statika.add(m[0]);
      } catch {}
    }),
  );
  // Uz datoteke koje stranice izravno učitavaju spremaju se i one koje se učitavaju naknadno
  // (karta, obrasci…): njihove adrese stoje u već spremljenom JavaScriptu i CSS-u.
  const vidjeno = new Set();
  let red = [...statika, "/manifest.webmanifest", "/icons/icon-192.png"];
  for (let krug = 0; krug < 6 && red.length; krug++) {
    const novi = new Set();
    await Promise.all(
      red.map(async (u) => {
        if (vidjeno.has(u)) return;
        vidjeno.add(u);
        try {
          let r = await s.match(u);
          if (!r) {
            r = await fetch(u);
            if (!r.ok) return;
            await s.put(u, r.clone());
          }
          if (/\.(js|css)$/.test(u)) {
            const tekst = await r.text();
            for (const m of tekst.matchAll(/static\/(?:chunks|media)\/[A-Za-z0-9_.~\/-]+\.(?:js|css|woff2|png|svg)/g)) novi.add("/_next/" + m[0]);
          }
        } catch {}
      }),
    );
    red = [...novi].filter((u) => !vidjeno.has(u));
  }
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(spremiLjusku());
});

self.addEventListener("activate", (e) => {
  const zadrzi = [LJUSKA, STATIKA, OFFLINE, NEDAVNO, STANJE];
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith("lov-") && !zadrzi.includes(k)) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "osvjezi-ljusku") e.waitUntil(spremiLjusku());
});

let brojac = 0;
async function obreziNedavne() {
  const c = await caches.open(NEDAVNO);
  const kljucevi = await c.keys();
  const visak = kljucevi.length - MAKS_NEDAVNIH;
  for (let i = 0; i < visak; i++) await c.delete(kljucevi[i]);
}

async function plocica(e, u) {
  const iz = (await caches.match(e.request.url, { cacheName: OFFLINE })) || (await caches.match(e.request.url, { cacheName: NEDAVNO }));
  if (iz) return iz;
  const cors = PLOCICE_CORS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  try {
    const r = cors ? await fetch(e.request.url, { mode: "cors", credentials: "omit" }) : await fetch(e.request);
    if (cors && r.ok) {
      const kopija = r.clone();
      e.waitUntil(
        caches.open(NEDAVNO).then(async (c) => {
          await c.put(e.request.url, kopija);
          if (++brojac % 100 === 0) await obreziNedavne();
        }),
      );
    }
    return r;
  } catch (greska) {
    if (cors) {
      try {
        return await fetch(e.request);
      } catch {}
    }
    throw greska;
  }
}

// Slaba mreža: nakon neuspjelog ili presporog zahtjeva minutu se ne čeka mreža.
// Pamti se i u predmemoriji jer preglednik service worker gasi kad miruje.
let slabaDo = 0;
const STANJE = "lov-stanje-v1";
const KLJUC_SLABA = "/__slaba-mreza";
const ucitajSlabu = caches
  .open(STANJE)
  .then((c) => c.match(KLJUC_SLABA))
  .then((r) => (r ? r.text() : "0"))
  .then((t) => (slabaDo = Math.max(slabaDo, Number(t) || 0)))
  .catch(() => {});
const zapamtiSlabu = () => caches.open(STANJE).then((c) => c.put(KLJUC_SLABA, new Response(String(slabaDo)))).catch(() => {});
const slabaMreza = async () => {
  await ucitajSlabu;
  return self.navigator.onLine === false || Date.now() < slabaDo;
};
const mrezaJeSlaba = () => {
  slabaDo = Date.now() + 60_000;
  zapamtiSlabu();
};
const mrezaRadi = () => {
  if (!slabaDo) return;
  slabaDo = 0;
  zapamtiSlabu();
};

async function stranica(e, u) {
  const c = await caches.open(LJUSKA);
  const spremljena = (await c.match(u.pathname)) || (await c.match("/"));
  const mreza = fetch(e.request).then((r) => {
    mrezaRadi();
    if (r.ok && !u.search) e.waitUntil(c.put(u.pathname, r.clone()));
    return r;
  });
  if (!spremljena) return mreza.catch(() => Response.error());
  mreza.catch(mrezaJeSlaba);
  if (await slabaMreza()) {
    e.waitUntil(mreza.catch(() => {}));
    return spremljena;
  }
  // Mreža ima prednost, ali bez signala ili sa slabim signalom otvara se spremljena kopija.
  const istek = new Promise((ok) => setTimeout(() => ok(null), CEKANJE_MS));
  const r = await Promise.race([mreza.catch(() => null), istek]);
  if (r) return r;
  mrezaJeSlaba();
  e.waitUntil(mreza.catch(() => {}));
  return spremljena;
}

/** Podaci za prijelaz između stranica (Next.js RSC). Bez mreže greška odmah – aplikacija tada
 *  otvara stranicu ispočetka, a nju service worker poslužuje iz spremljenih. */
async function prijelaz(e) {
  if (await slabaMreza()) return Response.error();
  const prekid = new AbortController();
  const t = setTimeout(() => prekid.abort(), CEKANJE_MS);
  try {
    const r = await fetch(e.request, { signal: prekid.signal });
    mrezaRadi();
    return r;
  } catch {
    mrezaJeSlaba();
    return Response.error();
  } finally {
    clearTimeout(t);
  }
}

async function statika(e) {
  const c = await caches.open(STATIKA);
  const iz = await c.match(e.request.url);
  if (iz) return iz;
  const r = await fetch(e.request);
  if (r.ok) e.waitUntil(c.put(e.request.url, r.clone()));
  return r;
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  // Samo slike koje crta karta; preuzimanje područja (fetch iz aplikacije) ide izravno na mrežu.
  if (jePlocica(u)) return e.request.destination === "image" ? e.respondWith(plocica(e, u)) : undefined;
  if (u.origin !== self.location.origin) return;
  if (u.pathname.startsWith("/_next/static/")) return e.respondWith(statika(e));
  if (e.request.mode === "navigate") return e.respondWith(stranica(e, u));
  if (e.request.headers.get("RSC") === "1" || u.searchParams.has("_rsc")) return e.respondWith(prijelaz(e));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    (async () => {
      const prozori = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (prozori[0]) return prozori[0].focus();
      return self.clients.openWindow("/lovci");
    })(),
  );
});
