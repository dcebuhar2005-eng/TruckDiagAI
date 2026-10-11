# Huntora – lovački dnevnik

Evidencija izlazaka, odstrela, lovišta i dozvola – na hrvatskom. Zasebna Next.js aplikacija unutar ovog repozitorija.

## Mogućnosti

- **Pregled** – trenutno vrijeme i vjetar (Open-Meteo), satna prognoza vjetra, tlak i trend, izlazak/zalazak Sunca, zora i sumrak, faza Mjeseca, solunarna razdoblja s ocjenom aktivnosti divljači, statistika tekuće lovne godine (1. 4. – 31. 3.) i upozorenja za dokumente.
- **Dnevnik** – izlasci (vrijeme, lovište, čeka, način lova, vjetar, opažena divljač, ocjena) i odstrel (vrsta, spol, dob, masa, CIC, markica, oružje, kalibar, udaljenost, GPS, fotografija), pretraga i filtar po lovištu.
- **Karta** – satelitska, topografska i obična podloga; granice lovišta (crtanje dodirom, automatski izračun površine), čeke/hranilišta/solišta/kamere…, mjesta odstrela, **zona mirisa** niz vjetar s klizačem za sljedeća 24 sata, mjerenje udaljenosti i GPS lokacija.
- **Lovišta** – kartice s obrisom granice, točke, povijest izlazaka i odstrela po lovištu.
- **Dozvole** – lovačka iskaznica, dozvole za lov, oružni list, osiguranje; rokovi valjanosti i iskorištenost kvota.
- **Statistika** – po lovnim godinama: mjeseci, vrste, doba dana, ruža vjetrova, uspješnost po načinu lova, trofeji; izvoz u CSV i ispis.
- **Lovci** – prijatelji (pretraga po imenu ili @korisničkom imenu, zahtjevi) i „U lovu sam”: dijeljenje lokacije s prijateljima na ograničeno vrijeme, prikaz na karti s krugom od 300 m i upozorenje kad je prijatelj bliže od 600 m.
- **Automatska sigurnosna kopija** – za prijavljene korisnike jednom mjesečno u privatni Supabase Storage; kopije starije od 30 dana brišu se same.
- **Postavke** – profil, zadana lokacija, tamna/svijetla tema, izvoz/uvoz sigurnosne kopije (JSON s fotografijama).

Dnevnik se čuva isključivo na uređaju (localStorage, fotografije u IndexedDB-u). Za prijatelje se na poslužitelj (Supabase) šalju samo profil, prijateljstva i lokacija dok je korisnik sam dijeli.

## Pokretanje

```bash
cd lovacki-dnevnik
npm install
npm run dev
```

Za Vercel postavite **Root Directory** na `lovacki-dnevnik`.

## Postavljanje prijatelja (Supabase)

1. U Supabase projektu otvorite **SQL Editor**, zalijepite sadržaj `supabase/lov_shema.sql` i kliknite **Run**. Skripta se smije pokrenuti više puta.
2. Na Vercelu u projektu ove aplikacije dodajte varijable okoline (Production i Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Ponovno objavite (Redeploy).
4. Ako je u Supabaseu uključena potvrda e-maila, dodajte adresu aplikacije u **Authentication → URL Configuration → Redirect URLs** (npr. `https://hunt-jade.vercel.app/**`).

Pristup podacima štite pravila (RLS): lokaciju vide samo prihvaćeni prijatelji i samo dok dijeljenje nije isteklo.
Web-aplikacija osvježava lokaciju dok je otvorena; nakon zatvaranja prijatelji vide zadnju poznatu poziciju s vremenom.

## Izvori i licence

Svi vanjski izvori (karte, vrijeme, OpenStreetMap, Supabase, Vercel), njihovi uvjeti i plan za slučaj
rasta ili komercijalne upotrebe opisani su u [IZVORI.md](IZVORI.md). Korisnici isti popis vide u
aplikaciji pod **Postavke → Izvori i licence**.
