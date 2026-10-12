/* CroLovac – service worker: rad bez signala.
 *
 * - Ljuska aplikacije (stranice i /_next/static) sprema se pa se aplikacija otvara i bez interneta.
 * - Pločice karte: najprije iz spremljenih (offline) područja, zatim iz predmemorije
 *   nedavno gledanih pločica, tek onda s mreže.
 */

const LJUSKA = "lov-ljuska-v1";
const STATIKA = "lov-statika-v1";
const OFFLINE = "lov-offline-v1"; // ručno preuzeta područja – brišu se samo na zahtjev
const NEDAVNO = "lov-plocice-v1"; // pasivno, ograničeno na MAKS_NEDAVNIH
const MAKS_NEDAVNIH = 2500;

const STRANICE = ["/", "/dnevnik", "/karta", "/lovci", "/lovista", "/dozvole", "/statistika", "/postavke", "/izvori"];

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
        const r = await fetch(p, { cache: "no-store" });
        if (!r.ok) return;
        const html = await r.clone().text();
        await c.put(p, r);
        for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) statika.add(m[0]);
      } catch {}
    }),
  );
  await Promise.all(
    [...statika, "/manifest.webmanifest", "/icons/icon-192.png"].map(async (u) => {
      try {
        if (await s.match(u)) return;
        const r = await fetch(u);
        if (r.ok) await s.put(u, r);
      } catch {}
    }),
  );
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(spremiLjusku());
});

self.addEventListener("activate", (e) => {
  const zadrzi = [LJUSKA, STATIKA, OFFLINE, NEDAVNO];
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

async function stranica(e, u) {
  const c = await caches.open(LJUSKA);
  try {
    const r = await fetch(e.request);
    if (r.ok && !u.search) e.waitUntil(c.put(u.pathname, r.clone()));
    return r;
  } catch {
    return (await c.match(u.pathname)) || (await c.match("/")) || Response.error();
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
