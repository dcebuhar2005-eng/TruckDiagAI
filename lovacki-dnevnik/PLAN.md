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
- **Obavijest „CroLovac na Google Playu”** (2. 11.): samo Android u pregledniku (`components/PlayObavijest.tsx`); Kasnije = za 3 dana, najviše 3 puta; poveznica s referrer utm_source=crolovac_web.
- **Zaboravljena lozinka** (2. 11.): poveznica e-poštom (Supabase SMTP preko Resenda, noreply@crolovac.com, DNS na Vercelu), prozor „Nova lozinka” (`components/NovaLozinka.tsx`), poruka za isteklu poveznicu. Supabase: Site URL https://hunt-jade.vercel.app, Redirect URLs https://hunt-jade.vercel.app/**.
- **Uređivanje dolaska divljači** (1. 11., besplatno): olovka uz zapisani dolazak – naknadno dodaj/promijeni sliku s kamere ili ispravi podatke.
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

- **Značka „Osnivač”** (2. 11., besplatno) – testeri s popisa `lib/osnivaci.ts` (id profila) dobiju zlatnu značku 🦌 uz ime i jednokratnu zahvalu. Novi tester = dodati id i objaviti.
- **Preciznija lokacija** (3. 11., besplatno, popravak nakon recenzije „lokacija nije precizna”) – `lib/gps.ts`: čeka satelitski GPS (cilj ±12 m, najviše 20 s) umjesto prve grube lokacije; upozorenje ako je uključena samo „približna lokacija”; dijeljenje s prijateljima ne šalje staru/grublju lokaciju preko precizne.
- **Čestitka sv. Huberta** (3. 11., besplatno) – `components/SvHubert.tsx`: svake godine 3. studenoga jednom ploča s čestitkom; „Što je novo” čeka dok je otvorena druga ploča.
- **Pozdrav:** u aplikaciji, objavama i reklamama piše se **„Dobra kob!”** (ne „Lovu mir”) – vlasnik 3. 11.
- **Sličice točaka** (3. 11., besplatno) – `lib/ikoneTocaka.ts` + `components/ZnakTocke.tsx`: umjesto slova (Č, H, S…) sličice; vlasnik odabrao zasjedu = tronožac, solište = stup s krovićem, hranilište = bačva na nogama. Prijelaz s jednom divljači i dalje nosi slovo divljači.
- **Lovni kalendar** (4. 11., besplatno) – `lib/lovostaj.ts` (podaci po državama; HR = Pravilnik o lovostaju NN 94/2019, provjereno 4. 11. 2026.), stranica `/kalendar` (Danas / Cijela godina, detalj vrste), ulaz: široka pločica u „Više” (NOVO) i kartica „Danas se smije loviti” na Pregledu. BiH (Federacija: Pravilnik 2008.; Republika Srpska: Naredba, Sl. glasnik RS 105/2024) i Srbija (Pravilnik, Sl. glasnik RS 9/2012 … 6/2026) dodani 5. 11. – besplatno; lovne sezone upisane kako piše u propisu (`S(...)` računa lovostaj), napomene po dijelu vrste. Srbija: grlica i poljska jarebica privremeno zabranjene do 2027. – provjeriti tada. Jednom godišnje provjeriti izmjene pravilnika.
- **Animacije (LottieFiles)** (4. 11., besplatno) – `components/Animacija.tsx` (lottie-web light, poštuje „smanji pokrete”), datoteke u `public/animacije/` (prebojane u boje CroLovca), `components/Slavlje.tsx` (`slavi("spremljeno"|"konfete")`). Licenca: Lottie Simple License – komercijalno i reklame dopušteno; navedeno u Izvori i licence (`lib/izvori.ts`) s autorima.
- **Profi prijelazi** (4. 11., besplatno) – dubina iza ploče (stranica se smanji i zaobli), utiskivanje gumba pod prstom, mala traka s naslovom pri listanju (`Naslov` u `components/ui.tsx`), haptika `dodir()` u `lib/nativno.ts` (spremanje, kartice, SOS).
- **Prvi koraci 2.0** (5. 11., besplatno) – „Postavite svoje lovište” na vrhu Pregleda za korisnike bez izlazaka/odstrela: račun ✓ → lovište → čeka → prijatelj iz LD-a → izlazak, traka napretka, PostHog `prvi_koraci_prikazani/korak/sakriveni`. Cilj: ~190 korisnika koji su ušli, a ništa nisu upisali.
- **Odstrel iz izlaska** (5. 11., besplatno, prijedlog vlasnika nakon vlastitog odstrela) – u Novi izlazak odjeljak „Odstrel”: kvačica „Imao sam odstrel” → nakon spremanja otvara se Upiši odstrel s izlazakId, datumom, satom (kraj čekanja), lovištem i mjestom; postojeći povezani odstrel prikazan u izlasku. Fotografije u izlasku više ne pišu „Fotografije odstrela”.
- **Odstrel uživo + fotke iz lova** (5. 11., besplatno) – u Kreni u lov gumb „Odstrel” (Upiši + fotke) otvara upis odstrela povezan s lovom; u njemu „Fotografije iz ovog lova” (kopija, ne dijeli se s izlaskom) – dodir dodaje fotku odstrelu.
- **Videi na serveru** (5. 11.): TikTok videi su kopirani u Metricool i maknuti; `public/mreze/` drži samo videe za idući dan, stari se brišu u sljedećoj objavi (Metricool ih već kopira).
- **Kalendar pamti državu** (6. 11., besplatno): odabir se pamti (`lovacki-dnevnik:kalendar-drzava`), za nove se pogađa po vremenskoj zoni i jeziku (Sarajevo + srpski → RS, Sarajevo → FBiH, Beograd → Srbija); kartica na Pregledu prati odabranu državu.
- **Molba za ocjenu na Google Playu** (6. 11., besplatno, samo Android aplikacija): nakon 3. izlaska, „Kasnije” → za 14 dana, najviše 2 puta (`components/OcjenaPlay.tsx`).
- **Stradala divljač** (6. 11., besplatno, prijedlog kolege): neobavezno (Postavke → „Bilježim stradalu divljač”); kolekcija `stradanja` u dnevniku (sinkronizira se kao i ostalo, bez promjene baze), `components/urednici/StradanjeUrednik.tsx`, `lib/stradanja.ts` (uzroci), sloj na karti, kartica u statistici. Bez zapisnika i izvoza – dodati ako se pokaže potreba.
- **Kalkulator trofeja** (6. 11.; PRO – vlasnik 6. 11., skriven dok PRO nije uključen): `lib/cic.ts` (srnjak, jelen obični, vepar; formule s CIC mjernih listova, provjereno na službenom primjeru jelena 201,33), `components/KalkulatorTrofeja.tsx`, gumb „Izračunaj” u upisu odstrela, medalja u detalju odstrela.
- **Admin: pretraga korisnika** (6. 11.): po imenu, @korisniku, e-mailu i društvu, bez obzira na kvačice.
- **Facebook bez linkova u opisu** (vlasnik 5. 11.): u tekstu Facebook objave nema linkova; link ide u prvi komentar.
- **QR po mreži** (vlasnik 5. 11.): svaki video ima QR za svoju mrežu (TikTok / Facebook / Instagram). Frendovi videi u imenu nose mrežu i idu samo na nju.
- **Dnevna automatika videa** (vlasnik 5. 11., doslovno: „Da, pokreni dnevne videe i objave bez pitanja”): svaku večer Claude sam napravi videe za sutra (Remotion u `video/`), stavi ih na server (jedna od 2 objave tog dana) i zakaže u Metricoolu: TikTok 10:00 / 12:00 / 18:00, Facebook + Instagram Reel 18:00. Ne pita za svaku objavu; vlasniku pošalje kratku potvrdu.
- **Glazba u videima** (vlasnik 5. 11.): ubuduće **chill** glazba (glazba_chill), ne „napeto”/„veselo”.
