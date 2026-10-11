# Izvori, licence i plan za rast

Ovaj dokument navodi sve vanjske izvore koje Lovački dnevnik koristi, uvjete pod kojima ih smije
koristiti i što treba promijeniti ako aplikacija jednog dana postane komercijalna ili je počne
koristiti mnogo ljudi. Isti popis korisnici vide u aplikaciji: **Postavke → Izvori i licence**
(`lib/izvori.ts`).

Stanje opisuje uvjete pružatelja u listopadu 2026. Prije svake veće promjene provjeriti
važeće uvjete na poveznicama, jer se mijenjaju.

## Trenutno stanje (osobna, nekomercijalna upotreba)

| Izvor | Koristi se za | Licenca / uvjeti | Kako aplikacija štedi |
|---|---|---|---|
| Esri World Imagery, Clarity, World Topo, Reference | Satelit, Hibrid, Satelit HD, Topo | Esri uvjeti, atribucija „Esri, Maxar, Earthstar Geographics" | Predmemorija preglednika |
| Mapbox Satellite (opcionalno) | Satelit Pro | Vlastiti ključ `NEXT_PUBLIC_MAPBOX_TOKEN`, atribucija „© Mapbox © Maxar" | Besplatni mjesečni limit |
| DGU ortofoto i TK25 (WMS) | HR ortofoto, HR TK25 | Otvoreni podaci RH, atribucija „© Državna geodetska uprava" | — |
| OpenTopoMap | Reljef | CC-BY-SA, fair use | — |
| CyclOSM (OSM France) | Putevi | ODbL podaci, fair use poslužitelja | — |
| OpenStreetMap preko Overpass API-ja | Sloj šumskih puteva | ODbL, atribucija „© OpenStreetMap", umjerena upotreba | Ćelije 0,05°, najviše 12 po prikazu, IndexedDB predmemorija **14 dana** |
| Open-Meteo | Vjetar i prognoza | CC BY 4.0, besplatno nekomercijalno (< ~10 000 poziva/dan) | Memorija + localStorage **15 min**, zaokruživanje lokacije |
| Supabase (Free) | Prijava, prijatelji, lokacija, kopije | 500 MB baza, 1 GB pohrana, pauza nakon 7 dana neaktivnosti | Kopija jednom mjesečno, stare se brišu |
| Vercel (Hobby) | Objava | **Samo nekomercijalno** | — |

Sve atribucije prikazuju se na karti (dolje desno, na mobitelu iznad navigacije).

## Kada reagirati

Znakovi da je vrijeme za promjene:

- aplikacija se naplaćuje, ima reklame ili je koristi tvrtka/udruga kao uslugu članovima;
- više od ~100 aktivnih korisnika dnevno;
- Overpass ili Open-Meteo vraćaju greške 429 (previše zahtjeva);
- Supabase javlja da se približava limitima ili se projekt često pauzira.

## Plan po koracima

1. **Vercel → Pro** čim je aplikacija komercijalna (Hobby to ne dopušta).
2. **Supabase → Pro**: nema pauziranja, dnevne sigurnosne kopije baze, veći limiti.
3. **Open-Meteo → komercijalni API ključ**; u `lib/vrijeme.ts` promijeniti URL na
   `customer-api.open-meteo.com` i dodati `apikey`.
4. **Esri → ArcGIS Location Platform ključ** (besplatni paket s velikim mjesečnim limitom
   pločica); ključ dodati u URL-ove u `app/karta/KartaPrikaz.tsx` (`?token=...`).
5. **Šumski putevi bez javnog Overpassa**: jednom tjedno izvesti puteve za Hrvatsku
   (`highway=track|path|bridleway|footway|unclassified|service`) iz Geofabrik izvoza
   (croatia-latest.osm.pbf) u vektorske pločice (PMTiles) i posluživati ih sa Supabase Storagea
   ili Cloudflare R2. Sloj u `app/karta/SumskiPutevi.tsx` tada čita pločice umjesto Overpassa.
6. **OpenTopoMap i CyclOSM**: zamijeniti komercijalnim pružateljem s ključem (MapTiler,
   Thunderforest Outdoors) ili vlastitim poslužiteljem pločica.
7. **DGU**: kod velikog prometa postaviti predmemoriju (npr. mapproxy) ispred WMS-a ili
   zatražiti registrirani pristup.

Redoslijed je važan: koraci 1–3 su obavezni čim postoji naplata; ostali kad promet stvarno naraste.
