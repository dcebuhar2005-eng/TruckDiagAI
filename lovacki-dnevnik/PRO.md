# CroLovac PRO – popis funkcija

Ovdje se pamti što je **PRO** (plaćeni paket), a što ostaje **besplatno**. O svakoj novoj funkciji odlučuje vlasnik:
prije objave nove funkcije uvijek pitati ide li svima ili u PRO.

Prijedlog cijene: **2,99 €/mj ili 19,99 €/god**. Testeri i rani korisnici (značka **Osnivač**) dobivaju PRO **besplatno zauvijek** – obećano.

## ✅ Napravljeno i skriveno (čeka početak naplate)

Zasad ih **ne vidi nitko, ni administrator** (vlasnik 24. 10. 2026.): `PRO_PRIKAZ = false` u `lib/pro.ts`. Kad krene naplata, staviti `true` (tada vidi administrator, pa pretplatnici).

| Funkcija | Bez PRO-a vidi se |
|---|---|
| **Novi Pregled** – kartica „Sada” (kad krenuti, na koju čeku), tijek dana, pločice (vjetar, tjedan, plan odstrela, Mjesec, hranilište) | stari Pregled (Aktivnost divljači, Svjetlo danas) |
| **„Kad u lov?” za 8 dana** + najbolji termin u tjednu | samo danas i sutra |
| **Uvoz staza GPX/KML** (planinarske staze, šumski putovi) na kartu | ništa – sloj i gumb su skriveni |
| **Dolazak divljači – izračun** (vlasnik 28. 10.): kad koja divljač najčešće dolazi („najčešće 23–01 h”), na koju hranu najviše dolazi, na karti „voli kukuruz u zrnu”; kasnije prema vjetru i Mjesecu | samo upis i popis dolazaka, „zadnji dolazak” |

## 📝 Planirano za PRO (još nije napravljeno)

- **Crveni noćni način** za čeku (vlasnik 25. 10. 2026.: PRO)
- **Zajednička karta** (vlasnik 25. 10. 2026.: PRO / paket za društva) – čeke, oznake i granice dijeljene s grupom ili društvom; promjene odmah vide svi
- Karte bez signala za cijelo lovište (veća područja)
- HD satelit
- Neograničene fotografije
- Izvoz za evidenciju (PDF / Excel)
- Napredna statistika sezone i prognoza aktivnosti divljači
- **Obavijesti lovnog kalendara** (vlasnik 4. 11. 2026.: PRO) – „sutra se otvara lov na srnjaka”, „za 7 dana se zatvara košuta”; odabir vrsta za koje stižu obavijesti
- **Lovni kalendar + kvote** (vlasnik 4. 11. 2026.: PRO) – uz vrstu prikaz odstrelnog lista, npr. „srna: otvoreno, iskorišteno 2 od 4”
- **Podsjetnik na istek dokumenata** (vlasnik 4. 11. 2026.: PRO) – lovačka iskaznica, osiguranje, dozvola za oružje: datum isteka i obavijest prije

## ❓ Ideje – vlasnik još odlučuje (besplatno ili PRO)

- Podsjetnik za hranilište (obavijest)
- „Danas smiješ loviti” / lovostaji (tek s provjerenim zakonskim podacima)
- Glasovni upis opažanja

## 🆓 Besplatno zauvijek (osnova)

Jednokratno slanje lovišta (granica + odabrane čeke i točke) prijatelju, dnevnik izlazaka i odstrela, karta s točkama i granicama (i crtanje prstom), vjetar i čeke za vjetar, lovci uživo i alarm
blizine, tragovi divljači, dozvole i kvote, statistika, **lokacija iz Google karata**, „Kad u lov?” za danas i sutra, kartica „Prvi koraci” za nove korisnike, **obavijest večer prije** (Android, 20:00, vlasnik 25. 10.), **SOS – hitna pomoć** (112, koordinate, slanje lokacije, uzbuna prijatelja; vlasnik 25. 10.), „Što je novo” nakon objave, **vrsta hrane na prihrani** (ponuđeno ili upisano, npr. kukuruz u zrnu; vlasnik 28. 10.), **Dolazak divljači – upis** (kartica na Pregledu, karta, točka: gdje, divljač, komada, datum, sat, kamera/uživo, hrana; popis zapisanih i „zadnji dolazak”; vlasnik 28. 10.), **slika s kamere uz dolazak** (datum i sat se preuzmu iz slike; vlasnik 28. 10.), **povremene obavijesti** umjesto podsjetnika za testiranje (Android, vlasnik 30. 10.), **popis objekata na karti** (točke, tragovi, odstrel; pretraga, filtri, udaljenost, vjetar; vlasnik 31. 10.), **značka „Osnivač”** za prve testere (uz ime na Lovcima, kod prijatelja, u pretrazi i na QR kodu; jednokratna zahvala; popis u `lib/osnivaci.ts`; vlasnik 2. 11.), **sličice vrsta točaka** umjesto slova (karta, popisi, legenda; vlasnik 3. 11.), **lovni kalendar / lovostaj** (Hrvatska po Pravilniku o lovostaju NN 94/2019; danas se smije loviti, godišnji pregled, detalj vrste; BiH – Federacija i Republika Srpska, Srbija dodani 5. 11.; vlasnik 4. 11.), **animacije u aplikaciji** (LottieFiles, Lottie Simple License – kvačica, konfete, jelen, GPS, prazno, SOS; vlasnik 4. 11.), **„Postavite svoje lovište”** za nove korisnike (prvi koraci na vrhu Pregleda s napretkom; vlasnik 5. 11.), **odstrel iz izlaska** (kvačica u izlasku → upis odstrela povezan s izlaskom; vlasnik 5. 11.).

## Kad krene naplata

1. U `lib/pro.ts` dodati pretplatnike (Google Play Billing / Stripe) i Osnivače.
2. Objaviti PRO kao novost – sve iz tablice „Napravljeno i skriveno” odjednom.
