# Lovački dnevnik

Evidencija izlazaka, odstrela, lovišta i dozvola – na hrvatskom. Zasebna Next.js aplikacija unutar ovog repozitorija.

## Mogućnosti

- **Pregled** – trenutno vrijeme i vjetar (Open-Meteo), satna prognoza vjetra, tlak i trend, izlazak/zalazak Sunca, zora i sumrak, faza Mjeseca, solunarna razdoblja s ocjenom aktivnosti divljači, statistika tekuće lovne godine (1. 4. – 31. 3.) i upozorenja za dokumente.
- **Dnevnik** – izlasci (vrijeme, lovište, čeka, način lova, vjetar, opažena divljač, ocjena) i odstrel (vrsta, spol, dob, masa, CIC, markica, oružje, kalibar, udaljenost, GPS, fotografija), pretraga i filtar po lovištu.
- **Karta** – satelitska, topografska i obična podloga; granice lovišta (crtanje dodirom, automatski izračun površine), čeke/hranilišta/solišta/kamere…, mjesta odstrela, **zona mirisa** niz vjetar s klizačem za sljedeća 24 sata, mjerenje udaljenosti i GPS lokacija.
- **Lovišta** – kartice s obrisom granice, točke, povijest izlazaka i odstrela po lovištu.
- **Dozvole** – lovačka iskaznica, dozvole za lov, oružni list, osiguranje; rokovi valjanosti i iskorištenost kvota.
- **Statistika** – po lovnim godinama: mjeseci, vrste, doba dana, ruža vjetrova, uspješnost po načinu lova, trofeji; izvoz u CSV i ispis.
- **Postavke** – profil, zadana lokacija, tamna/svijetla tema, izvoz/uvoz sigurnosne kopije (JSON s fotografijama).

Podaci se čuvaju isključivo na uređaju (localStorage, fotografije u IndexedDB-u).

## Pokretanje

```bash
cd lovacki-dnevnik
npm install
npm run dev
```

Za Vercel postavite **Root Directory** na `lovacki-dnevnik`.
