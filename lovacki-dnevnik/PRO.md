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

## 📝 Planirano za PRO (još nije napravljeno)

- Karte bez signala za cijelo lovište (veća područja)
- HD satelit
- Neograničene fotografije
- Izvoz za evidenciju (PDF / Excel)
- Napredna statistika sezone i prognoza aktivnosti divljači

## ❓ Ideje – vlasnik još odlučuje (besplatno ili PRO)

- Crveni noćni način (za čeku)
- Obavijest večer prije („Sutra ujutro odlično za lov”)
- Podsjetnik za hranilište (obavijest)
- „Danas smiješ loviti” / lovostaji (tek s provjerenim zakonskim podacima)
- Glasovni upis opažanja

## 🆓 Besplatno zauvijek (osnova)

Dnevnik izlazaka i odstrela, karta s točkama i granicama (i crtanje prstom), vjetar i čeke za vjetar, lovci uživo i alarm
blizine, tragovi divljači, dozvole i kvote, statistika, **lokacija iz Google karata**, „Kad u lov?” za danas i sutra.

## Kad krene naplata

1. U `lib/pro.ts` dodati pretplatnike (Google Play Billing / Stripe) i Osnivače.
2. Objaviti PRO kao novost – sve iz tablice „Napravljeno i skriveno” odjednom.
