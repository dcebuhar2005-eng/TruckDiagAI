# CroLovac – plan razvoja i poslovanja

Živi dokument: ovdje je smjer projekta, stanje i sljedeći koraci. Ažurira se nakon svake veće promjene.

## Vizija

**Najbolji lovački dnevnik i alat za lovačka društva u Hrvatskoj** – zatim regija (BiH, Srbija, Slovenija).
Osnovna aplikacija ostaje **besplatna i bez reklama**. Zarada dolazi od onih kojima donosi najviše vrijednosti:
lovačkih društava i lovaca koji žele napredne mogućnosti.

## Stanje (20. 10. 2026.)

| Pokazatelj | Vrijednost |
|---|---|
| Registrirani korisnici | 199 (123 nova u zadnjih 7 dana) |
| Aktivni danas/jučer | 76 (38 % svih – izvrsno) |
| Aktivni u 7 dana | 108 |
| Korisnici s upisanim izlascima | 71 |
| Upisano izlazaka / odstrela | 257 / 168 |
| Android aplikacija (test na Google Playu) | 16 korisnika, 12 testera u nizu (cilj 14 dana) |
| Mišljenja | 4/4 pozitivna |

Tehnika: Next.js na Vercelu (hunt-jade.vercel.app), Supabase (EU, Frankfurt), Android ljuska (Capacitor) `com.crolovac.app`.

## Poslovni model

1. **CroLovac (besplatno, zauvijek)** – dnevnik, odstrel, karta, vjetar, lovci uživo, tragovi, statistika.
2. **CroLovac PRO – lovac** (prijedlog: 2,99 €/mj ili 19,99 €/god)
   - karte bez signala za cijelo lovište, HD satelit, neograničene fotografije
   - izvoz za evidenciju (PDF/Excel), napredna statistika i prognoza aktivnosti divljači
   - **testeri i rani korisnici: PRO besplatno zauvijek (značka Osnivač)** – obećano, mora se poštovati
   - **već napravljeno i skriveno do početka naplate** (`lib/pro.ts`, `PRO_PRIKAZ = false` – zasad ne vidi nitko, ni administrator): novi Pregled (Sada + tijek dana + pločice), „Kad u lov?” za 8 dana (besplatno: danas i sutra), uvoz staza GPX/KML
   - pravilo: dobre nove funkcije ne idu odmah svima – vlasnik odlučuje što je besplatno, a što PRO; popis je u **PRO.md**
3. **CroLovac za lovačka društva** (prijedlog: 99–249 €/god po društvu, ovisno o broju članova)
   - zajednička karta društva (granice, čeke, hranilišta – jedan izvor istine) – **odluka vlasnika 25. 10.: PRO** (jednokratno slanje lovišta ostaje besplatno)
   - organizacija skupnog lova: stajališta, raspored, tko je gdje, sigurnost
   - evidencija odstrela društva i plan odstrela (za lovnika/tajnika), izvoz za godišnje izvješće
   - obavijesti članovima
   Ovo je najveći potencijal: jedna odluka društva = 20–80 korisnika odjednom.
4. **Partnerstva** (kasnije): lovačke trgovine, oprema, osiguranje – samo ako je korisno lovcima.

Bez reklama u aplikaciji (obećanje korisnicima).

## PRO paket – što čuvamo za plaćanje (UVIJEK PROVJERI OVDJE)

Pravilo: nova funkcija ne ide svima dok vlasnik ne odluči je li besplatna ili PRO. Odluku upiši ovdje (i u PRO.md).
Cijena (prijedlog): 2,99 €/mj ili 19,99 €/god. Osnivači (testeri) – PRO besplatno zauvijek.

**✅ Napravljeno i skriveno** (vidi samo administrator, `lib/pro.ts`):
- Novi Pregled – kartica „Sada”, tijek dana, pločice (bez PRO-a: stari Pregled)
- „Kad u lov?” za 8 dana + najbolji termin u tjednu (bez PRO-a: danas i sutra)
- Uvoz staza GPX/KML na kartu (bez PRO-a: skriveno)

**📝 Planirano za PRO:** karte bez signala za cijelo lovište, HD satelit, neograničene fotografije, izvoz PDF/Excel,
napredna statistika sezone i prognoza aktivnosti divljači.

**❓ Vlasnik još odlučuje:** podsjetnik za hranilište, lovostaji, glasovni upis. (Odlučeno 25. 10.: crveni noćni način = PRO, obavijest večer prije = besplatno.)

**🆓 Besplatno zauvijek:** dnevnik i odstrel, karta s točkama i granicama (i crtanje prstom), vjetar i čeke, lovci uživo i
alarm blizine, tragovi, dozvole i kvote, statistika, lokacija iz Google karata, „Kad u lov?” za danas i sutra.

## Što treba prije prvog eura (pravno i tehnički)

- [ ] **Obrt ili d.o.o.** i razgovor s knjigovođom (porezi na prihod iz Google Playa / Stripea)
- [ ] **Vercel Pro** (Hobby paket nije dopušten za komercijalnu upotrebu)
- [ ] **Supabase Pro** (bez pauziranja, sigurnosne kopije baze)
- [ ] **ArcGIS ključ** za satelitske snimke (komercijalna upotreba)
- [ ] Uvjeti korištenja + ažurirana pravila privatnosti (plaćanje, PRO)
- [ ] Naplata: Google Play Billing (Android), Stripe (web, društva)

Procijenjeni fiksni trošak: ~50–70 €/mj. Pokriva ga npr. 3 društva ili ~30 PRO korisnika godišnje.

## Plan po fazama

### Faza 1 – Google Play (do ~2. 11. 2026.)
- [ ] 14 dana testiranja s 12+ testera (u tijeku, dan 3)
- [x] AAB 1.0.14 (s greska.html) potpisan i poslan vlasniku za zatvoreno testiranje (25. 10.)
- [x] Opis i slike za Play trgovinu (25. 10.; slike u scratchpad/objave/play)
- [ ] Prijava za produkciju na Google Playu
- [ ] TikTok/video upute za dodavanje na početni zaslon (gumb u aplikaciji čeka poveznicu)

### Faza 2 – Rast (studeni)
- [ ] Cilj: **500 registriranih, 200 aktivnih tjedno**
- [ ] Plaćeni oglasi FB/IG (30–50 €), videi s pravim snimkama
- [ ] Županijski savezi i LD-ovi (poruka za tajnike, letak s QR kodom)
- [x] Mjerenje: PostHog i Sentry ugrađeni (čeka objavu) – zatim lijevak: registracija → prvi izlazak → povratak

### Faza 3 – Lovačka društva (zima 2026./27.)
- [ ] Uloge u društvu (član, lovnik, tajnik)
- [ ] Zajednička karta društva
- [ ] Skupni lov: stajališta i raspored, sigurnosni prikaz
- [ ] Odstrel društva + plan odstrela + izvoz
- [ ] 3 pilot-društva besplatno, zatim naplata

### Faza 4 – PRO i iPhone (proljeće 2027.)
- [ ] PRO paket i naplata
- [ ] iPhone aplikacija (App Store)
- [ ] Regija: BiH, Srbija, Slovenija (jezik, katalog divljači, lovne godine)

## Alati (spojeni s Claudeom)

| Alat | Za što |
|---|---|
| Supabase | baza, prijava, fotografije, statistika korisnika |
| Vercel | objava aplikacije (hunt-jade.vercel.app) |
| Sentry (EU) | dojave rušenja kod korisnika – projekt `crolovac` |
| PostHog (EU) | anonimna statistika: stranice, prijave, izlasci, odstrel, lov (bez lokacije i sadržaja dnevnika) |
| Google Drive | mapa **CroLovac**: „Snimke iz lova (ubaci ovdje)” i „Gotove reklame” |
| Metricool | zakazivanje objava na Facebook, Instagram i TikTok (crolovac.app) |
| Context7 | aktualne upute za Next.js, Supabase, Leaflet… |
| Exa | istraživanje (lovostaji, LD-ovi, konkurencija) |

Kasnije: Stripe (naplata, kad postoji obrt), Gmail i Google Sheets (ponude društvima), Supermetrics (plaćene reklame).

## Pravila rada

- Objava (PR → main → Vercel) samo na „**objavi**”, najviše 2 puta dnevno; nakon objave provjera verzije uživo.
- Svaka promjena se testira (build + provjera na simuliranom mobitelu) prije spremanja.
- Google Play „Sigurnost podataka” mora navesti dojave rušenja i analitiku (Sentry, PostHog) prije sljedeće verzije u Play trgovini.
- Prijave testera: greška = 3 boda, prijedlog = 2 boda (`lov_privatno.bodovi`); bodove potvrđuje vlasnik.
- Svaki tester dobije odgovor na svoju prijavu.
- Objave na mrežama: točno 5 hashtagova po objavi.
- Administratori (`lov_privatno.admini`): cebuhardominik@gmail.com (vlasnik), matijacrlj@gmail.com (dodan 26. 10. na zahtjev vlasnika).
- **Uz svaku objavu dodati unos na vrh `lib/novosti.ts`** („Što je novo” – korisnik ga vidi jednom; samo besplatne stvari).

## Objavljeno 23. 10. 2026. (verzija 609938727b44)

- „Kad u lov?” za danas i sutra, lokacija iz Google karata, Sentry i PostHog, mišljenje se ne ponavlja,
  dnevni podsjetnik testerima (Android, 18:30). PRO funkcije su u kodu, ali skrivene.
- ✅ Google Play → Sigurnost podataka: dodani Crash logs, Diagnostics (obavezno) i App interactions (može se isključiti), sve samo za analitiku (25. 10.).

## Objavljeno 25. 10. 2026.

- Kartica „Prvi koraci” na Pregledu (novi korisnici: lovište → čeka → prvi izlazak). Razlog: 12 od 21 novog korisnika
  (24.–25. 10.) nije dodalo ništa.
- Dnevnik: traka Izlasci/Odstrel ispod statusne trake (iPhone); ploča više ne pomiče stranicu iza sebe.
- PRO zasad ne vidi nitko, ni administrator (`PRO_PRIKAZ = false`).

## Objavljeno 25. 10. 2026. (večer)

- **SOS – hitna pomoć** (besplatno): 112, koordinate (decimalno i DMS), slanje lokacije porukom, uzbuna prijatelja
  (stupac `lov_lokacije.sos`). Plutajući gumb dok je lov u tijeku ili dijelim lokaciju; u izborniku Više.
- „Što je novo” nakon svake objave (`lib/novosti.ts`).
- Ideja za idući AAB: gumb SOS u obavijesti „lov u tijeku”.
- **Prihrana – vrsta hrane** (besplatno, 28. 10.): u izlasku uz prihranu odabir (kukuruz u zrnu, klip, ječam…) ili vlastiti upis; prikaz u detaljima, na karti i u statistici (kg po hrani).
- **Dolazak divljači** (28. 10.): upis besplatan – kartica „Dolazak divljači” na Pregledu (zadnja 3 + „Zapiši”), gumb „Dolazak” na karti i u Uredi točku; odabir mjesta, divljač, komada, datum, sat, kamera/uživo, hrana (predloži se zadnja prihrana). PRO: „najčešće 23–01 h” i „najviše dolazi na…”.
- **Popis objekata na karti** (31. 10., besplatno): gumb „Popis objekata” na karti (`app/karta/PopisObjekata.tsx`) – kartice Točke/Tragovi/Odstrel, pretraga, filtri po vrsti, grupirano po lovištu, udaljenost, vjetar čeka, zadnja dopuna, zadnji dolazak; dodir → karta na objekt.
- **Povremene obavijesti** (30. 10., besplatno): podsjetnici za testiranje završili 30. 10.; od 31. 10. lagane obavijesti 2, 4, 7, 10, 14, 21 i 28 dana nakon zadnjeg otvaranja u 18:30 (kanal `povremeno`, isti id 7100+), isključive u Postavkama. Uređaji koji aplikaciju ne otvore zadrže stare podsjetnike dok je ne otvore.
- **Izvor dolaska** (30. 10.): utm_* iz oglasa/QR kodova pamti se u `lib/pracenje.ts` (izvor, kampanja; `prvi_izvor` na osobi).
- **Slika s kamere uz dolazak** (28. 10.): „Dodaj sliku s kamere” – datum i sat iz EXIF-a (`lib/exif.ts`), sličica u popisu i na Pregledu, povećanje dodirom; video samo kao slika zaslona.

## Ideje na čekanju (redom)

- **iPhone obavijesti (web push)** – na iPhoneu zasad nema zakazanih obavijesti (web aplikacija). Vlasnik 25. 10.: **još ne kretati**, kasnije.

1. Crveni noćni način (za čeku) – **PRO** (vlasnik 25. 10.)
2. Obavijest večer prije („Sutra ujutro odlično za lov”) – **besplatno, napravljeno** (čeka objavu)
3. Podsjetnik za hranilište (obavijest)
4. „Danas smiješ loviti” / lovostaji – tek s provjerenim zakonskim podacima
5. Gumb „Pogledaj video” u pozivu za početni zaslon (čeka TikTok poveznicu)
6. Glasovni upis („Vidio sam dvije srne”) – za rad s rukavicama na čeki
