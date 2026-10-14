"use client";

// Pravila privatnosti (javna stranica – otvara se i bez prijave; poveznica je i u Google Playu).

import type { ReactNode } from "react";
import { Naslov } from "@/components/ui";

const KONTAKT = "crolovacapp@gmail.com";

function Odjeljak({ id, naslov, children }: { id?: string; naslov: string; children: ReactNode }) {
  return (
    <section id={id} className="kartica scroll-mt-6 p-5">
      <h2 className="font-display text-[19px] leading-snug font-semibold">{naslov}</h2>
      <div className="mt-2 grid gap-2 text-[14.5px] leading-relaxed text-tekst-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-tekst">
        {children}
      </div>
    </section>
  );
}

export default function Privatnost() {
  return (
    <div className="mx-auto max-w-3xl">
      <Naslov
        natpis="CroLovac"
        naslov="Pravila privatnosti"
        opis="Koje podatke CroLovac koristi, zašto, gdje se čuvaju i kako ih obrisati. Vrijedi za web aplikaciju (hunt-jade.vercel.app) i Android aplikaciju CroLovac."
      />
      <div className="grid gap-4">
        <Odjeljak naslov="Tko smo">
          <p>
            CroLovac je lovački dnevnik koji razvija i održava nezavisni razvojni programer iz Hrvatske (voditelj obrade
            podataka). Za sva pitanja o podacima pišite na <a className="text-naglasak" href={`mailto:${KONTAKT}`}>{KONTAKT}</a>.
          </p>
        </Odjeljak>

        <Odjeljak naslov="Koje podatke prikupljamo">
          <ul>
            <li>
              <strong>Račun:</strong> e-mail adresa i lozinka (lozinka se čuva samo kao kriptografski sažetak), te korisničko ime,
              ime i lovačko društvo ako ih upišete.
            </li>
            <li>
              <strong>Dnevnik:</strong> ono što sami upišete – izlasci, odstrel, opažanja, lovišta, čeke, bilješke, fotografije i
              GPS trag izlaska. Sprema se na vaš uređaj i u vaš privatni zapis na poslužitelju kako bi bio dostupan na svakom
              uređaju na kojem se prijavite.
            </li>
            <li>
              <strong>Lokacija:</strong> koristi se samo dok je <strong>lov u tijeku</strong> (za GPS trag) ili dok
              <strong> sami uključite dijeljenje lokacije</strong> s prijateljima (za kartu prijatelja i alarm blizine).
            </li>
            <li>
              <strong>Prijatelji:</strong> popis prijatelja i zahtjeva za prijateljstvo.
            </li>
            <li>
              <strong>Mišljenje:</strong> ocjena i tekst ako odgovorite na pitanje o aplikaciji.
            </li>
            <li>
              <strong>Tehnički podaci:</strong> verzija aplikacije, vrsta uređaja (npr. „Android · Play aplikacija”) i vrijeme
              zadnjeg korištenja – za otklanjanje grešaka i obavijest o novoj verziji.
            </li>
          </ul>
          <p>Ne prikupljamo kontakte, poruke, podatke o plaćanju ni oglasni identifikator. Nema oglasa ni praćenja za oglase.</p>
        </Odjeljak>

        <Odjeljak naslov="Lokacija u Android aplikaciji">
          <p>
            Kad pokrenete <strong>Kreni u lov</strong>, aplikacija zatraži dopuštenje za lokaciju i bilježi trag i dok je zaslon
            ugašen ili je mobitel u džepu. Za to vrijeme u traci obavijesti stoji <strong>„CroLovac · lov u tijeku”</strong>.
          </p>
          <p>
            Kad završite lov (i ne dijelite lokaciju), praćenje se zaustavlja, obavijest nestaje i aplikacija više ne koristi
            lokaciju. Aplikacija ne traži pristup lokaciji „uvijek” i ne prati vas kad nije pokrenut lov ili dijeljenje.
          </p>
          <p>
            GPS trag ostaje u vašem privatnom dnevniku. Prijateljima se šalje samo vaša trenutna pozicija i samo dok je dijeljenje
            uključeno; kad ga isključite ili istekne, pozicija se briše s poslužitelja.
          </p>
        </Odjeljak>

        <Odjeljak naslov="Tko vidi vaše podatke">
          <ul>
            <li>Dnevnik, trag i fotografije vidite <strong>samo vi</strong> (pristup je zaštićen na razini baze podataka).</li>
            <li>Prijatelji koje ste prihvatili vide vaše ime, korisničko ime i – samo dok dijelite – vašu poziciju.</li>
            <li>Administrator aplikacije vidi e-mail, datum registracije i zadnje prijave, verziju aplikacije i mišljenja, radi podrške.</li>
            <li>Podatke ne prodajemo i ne dajemo trećim stranama za oglašavanje.</li>
          </ul>
        </Odjeljak>

        <Odjeljak naslov="Gdje se podaci čuvaju">
          <ul>
            <li>
              <strong>Supabase</strong> (baza podataka, prijava i spremište fotografija) – poslužitelji u Europskoj uniji
              (Frankfurt, Njemačka).
            </li>
            <li>
              <strong>Vercel</strong> – posluživanje aplikacije. Pri otvaranju stranice poslužitelj tehnički vidi IP adresu, kao i
              svaka web stranica.
            </li>
            <li>
              Karte (Esri, Mapbox, DGU, OpenTopoMap, OpenStreetMap) i vremenska prognoza (Open-Meteo) dobivaju samo područje karte
              ili koordinate za koje se traži prikaz ili prognoza, bez vašeg imena i e-maila.
            </li>
          </ul>
          <p>Prijenos je šifriran (HTTPS).</p>
        </Odjeljak>

        <Odjeljak naslov="Koliko dugo">
          <p>
            Podaci se čuvaju dok imate račun. Pozicija za dijeljenje briše se kad dijeljenje završi. Automatske sigurnosne kopije
            dnevnika čuvaju se ograničeno (starije se same brišu). Nakon brisanja računa brišu se svi podaci povezani s njim.
          </p>
        </Odjeljak>

        <Odjeljak id="brisanje" naslov="Brisanje računa i podataka">
          <p>
            Brisanje računa možete zatražiti e-mailom na <a className="text-naglasak" href={`mailto:${KONTAKT}?subject=Brisanje%20računa%20CroLovac`}>{KONTAKT}</a>{" "}
            s adrese na koju je račun registriran (naslov: „Brisanje računa”). Račun i svi podaci – dnevnik, trag, fotografije,
            kopije, prijatelji, lokacija i mišljenja – brišu se u roku od 30 dana, a potvrdu dobivate e-mailom.
          </p>
          <p>Na isti način možete zatražiti kopiju svojih podataka ili ispravak.</p>
        </Odjeljak>

        <Odjeljak naslov="Vaša prava">
          <p>
            Prema Općoj uredbi o zaštiti podataka (GDPR) imate pravo na pristup, ispravak, brisanje i prenosivost podataka te
            pravo na prigovor. Ako smatrate da su vam prava povrijeđena, možete se obratiti Agenciji za zaštitu osobnih podataka
            (azop.hr).
          </p>
        </Odjeljak>

        <Odjeljak naslov="Djeca">
          <p>CroLovac je namijenjen odraslim lovcima i nije namijenjen djeci mlađoj od 16 godina.</p>
        </Odjeljak>

        <Odjeljak naslov="Promjene">
          <p>O važnim promjenama ovih pravila obavijestit ćemo vas u aplikaciji. Zadnja izmjena: 14. listopada 2026.</p>
        </Odjeljak>
      </div>
    </div>
  );
}
