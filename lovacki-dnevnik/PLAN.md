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
   - **već napravljeno i skriveno do početka naplate** (`lib/pro.ts`, sad vidi samo administrator): novi Pregled (Sada + tijek dana + pločice), „Kad u lov?” za 8 dana (besplatno: danas i sutra), uvoz staza GPX/KML
   - pravilo: dobre nove funkcije ne idu odmah svima – vlasnik odlučuje što je besplatno, a što PRO; popis je u **PRO.md**
3. **CroLovac za lovačka društva** (prijedlog: 99–249 €/god po društvu, ovisno o broju članova)
   - zajednička karta društva (granice, čeke, hranilišta – jedan izvor istine)
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

**❓ Vlasnik još odlučuje:** crveni noćni način, obavijest večer prije, podsjetnik za hranilište, lovostaji, glasovni upis.

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
- [ ] AAB 13: dijagnostika „Nema internetske veze” (greska.html)
- [ ] Opis, slike i video za Play trgovinu
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

## Spremno, čeka „objavi”

- „Kad u lov?” – za sve danas i sutra (8 dana i novi Pregled su PRO, skriveni)
- Sentry i PostHog + prekidač statistike u Postavkama
- Lokacija iz Google karata (link ili koordinate) – na karti (Slojevi → Uvoz) i u svakom polju lokacije
- Uvoz staza iz datoteka GPX/KML – PRO (skriveno)

## Ideje na čekanju (redom)

1. Crveni noćni način (za čeku)
2. Obavijest večer prije („Sutra ujutro odlično za lov”)
3. Podsjetnik za hranilište (obavijest)
4. „Danas smiješ loviti” / lovostaji – tek s provjerenim zakonskim podacima
5. Gumb „Pogledaj video” u pozivu za početni zaslon (čeka TikTok poveznicu)
6. Glasovni upis („Vidio sam dvije srne”) – za rad s rukavicama na čeki
