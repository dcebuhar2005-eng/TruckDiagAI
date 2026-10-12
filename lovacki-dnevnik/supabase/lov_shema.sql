-- Lovački dnevnik: prijatelji i dijeljenje lokacije.
-- Pokrenuti jednom u Supabase → SQL Editor. Skripta je sigurna za ponovno pokretanje.

-- Profili lovaca (javno vidljivi prijavljenim korisnicima radi pretrage po korisničkom imenu).
create table if not exists public.lov_profili (
  id uuid primary key references auth.users (id) on delete cascade,
  korisnicko_ime text not null unique check (korisnicko_ime ~ '^[a-z0-9_.]{3,24}$'),
  ime text not null check (char_length(ime) between 1 and 60),
  drustvo text check (char_length(drustvo) <= 80),
  created_at timestamptz not null default now()
);

alter table public.lov_profili enable row level security;

drop policy if exists "lov_profili_citanje" on public.lov_profili;
create policy "lov_profili_citanje" on public.lov_profili
  for select to authenticated using (true);

drop policy if exists "lov_profili_unos" on public.lov_profili;
create policy "lov_profili_unos" on public.lov_profili
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "lov_profili_izmjena" on public.lov_profili;
create policy "lov_profili_izmjena" on public.lov_profili
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Prijateljstva: zahtjev (ceka) koji primatelj prihvaća.
create table if not exists public.lov_prijateljstva (
  id bigint generated always as identity primary key,
  od uuid not null references public.lov_profili (id) on delete cascade,
  za uuid not null references public.lov_profili (id) on delete cascade,
  status text not null default 'ceka' check (status in ('ceka', 'prihvaceno')),
  created_at timestamptz not null default now(),
  unique (od, za),
  check (od <> za)
);

alter table public.lov_prijateljstva enable row level security;

drop policy if exists "lov_prijateljstva_citanje" on public.lov_prijateljstva;
create policy "lov_prijateljstva_citanje" on public.lov_prijateljstva
  for select to authenticated using (auth.uid() in (od, za));

drop policy if exists "lov_prijateljstva_zahtjev" on public.lov_prijateljstva;
create policy "lov_prijateljstva_zahtjev" on public.lov_prijateljstva
  for insert to authenticated with check (od = auth.uid() and status = 'ceka');

drop policy if exists "lov_prijateljstva_prihvat" on public.lov_prijateljstva;
create policy "lov_prijateljstva_prihvat" on public.lov_prijateljstva
  for update to authenticated using (za = auth.uid()) with check (za = auth.uid() and status = 'prihvaceno');

drop policy if exists "lov_prijateljstva_brisanje" on public.lov_prijateljstva;
create policy "lov_prijateljstva_brisanje" on public.lov_prijateljstva
  for delete to authenticated using (auth.uid() in (od, za));

-- Pomoćna funkcija u privatnoj shemi (nije izložena preko API-ja).
create schema if not exists lov_privatno;
grant usage on schema lov_privatno to authenticated;

create or replace function lov_privatno.su_prijatelji(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lov_prijateljstva
    where status = 'prihvaceno'
      and ((od = a and za = b) or (od = b and za = a))
  );
$$;

revoke execute on function lov_privatno.su_prijatelji(uuid, uuid) from public, anon;
grant execute on function lov_privatno.su_prijatelji(uuid, uuid) to authenticated;

-- Zadnja poznata lokacija dok korisnik dijeli ("U lovu sam"). Vidljiva samo prihvaćenim prijateljima i samo do isteka.
create table if not exists public.lov_lokacije (
  korisnik uuid primary key references public.lov_profili (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  tocnost real,
  azurirano timestamptz not null default now(),
  aktivno_do timestamptz not null
);

alter table public.lov_lokacije enable row level security;

drop policy if exists "lov_lokacije_citanje" on public.lov_lokacije;
create policy "lov_lokacije_citanje" on public.lov_lokacije
  for select to authenticated using (
    korisnik = auth.uid()
    or (aktivno_do > now() and lov_privatno.su_prijatelji(auth.uid(), korisnik))
  );

drop policy if exists "lov_lokacije_unos" on public.lov_lokacije;
create policy "lov_lokacije_unos" on public.lov_lokacije
  for insert to authenticated with check (korisnik = auth.uid());

drop policy if exists "lov_lokacije_izmjena" on public.lov_lokacije;
create policy "lov_lokacije_izmjena" on public.lov_lokacije
  for update to authenticated using (korisnik = auth.uid()) with check (korisnik = auth.uid());

drop policy if exists "lov_lokacije_brisanje" on public.lov_lokacije;
create policy "lov_lokacije_brisanje" on public.lov_lokacije
  for delete to authenticated using (korisnik = auth.uid());

-- Automatske sigurnosne kopije dnevnika: privatni spremnik, svaki korisnik samo u svojoj mapi (<uid>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lov-kopije', 'lov-kopije', false, 52428800, array['application/json'])
on conflict (id) do nothing;

drop policy if exists "lov_kopije_citanje" on storage.objects;
create policy "lov_kopije_citanje" on storage.objects for select to authenticated
  using (bucket_id = 'lov-kopije' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "lov_kopije_unos" on storage.objects;
create policy "lov_kopije_unos" on storage.objects for insert to authenticated
  with check (bucket_id = 'lov-kopije' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "lov_kopije_brisanje" on storage.objects;
create policy "lov_kopije_brisanje" on storage.objects for delete to authenticated
  using (bucket_id = 'lov-kopije' and (storage.foldername(name))[1] = auth.uid()::text);

-- Dnevnik svakog korisnika (sinkronizacija između uređaja). Vidi ga samo vlasnik.
create table if not exists public.lov_dnevnici (
  korisnik uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  podaci jsonb not null,
  azurirano timestamptz not null default now()
);
alter table public.lov_dnevnici enable row level security;
drop policy if exists "lov_dnevnici_citanje" on public.lov_dnevnici;
create policy "lov_dnevnici_citanje" on public.lov_dnevnici for select to authenticated using (korisnik = (select auth.uid()));
drop policy if exists "lov_dnevnici_unos" on public.lov_dnevnici;
create policy "lov_dnevnici_unos" on public.lov_dnevnici for insert to authenticated with check (korisnik = (select auth.uid()));
drop policy if exists "lov_dnevnici_izmjena" on public.lov_dnevnici;
create policy "lov_dnevnici_izmjena" on public.lov_dnevnici for update to authenticated using (korisnik = (select auth.uid())) with check (korisnik = (select auth.uid()));
drop policy if exists "lov_dnevnici_brisanje" on public.lov_dnevnici;
create policy "lov_dnevnici_brisanje" on public.lov_dnevnici for delete to authenticated using (korisnik = (select auth.uid()));
revoke all on public.lov_dnevnici from anon;
grant select, insert, update, delete on public.lov_dnevnici to authenticated;

-- Povijest verzija dnevnika (zaštita od slučajnog prepisivanja): najviše jedna verzija u 10 minuta,
-- a čuva se posljednjih 20 po korisniku (kružni spremnik: redni broj % 20 određuje mjesto).
create table if not exists public.lov_dnevnici_povijest (
  id bigint generated always as identity primary key,
  korisnik uuid not null references auth.users (id) on delete cascade,
  podaci jsonb not null,
  azurirano timestamptz not null,
  spremljeno timestamptz not null default now(),
  redni bigint not null default 1,
  slot int not null default 1
);
create index if not exists lov_dnevnici_povijest_korisnik on public.lov_dnevnici_povijest (korisnik, spremljeno desc);
create unique index if not exists lov_dnevnici_povijest_slot on public.lov_dnevnici_povijest (korisnik, slot);
alter table public.lov_dnevnici_povijest enable row level security;
drop policy if exists "lov_povijest_citanje" on public.lov_dnevnici_povijest;
create policy "lov_povijest_citanje" on public.lov_dnevnici_povijest for select to authenticated using (korisnik = (select auth.uid()));
grant select on public.lov_dnevnici_povijest to authenticated;

create or replace function lov_privatno.sacuvaj_verziju() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sljedeci bigint;
begin
  if exists (
    select 1 from public.lov_dnevnici_povijest p
    where p.korisnik = old.korisnik and p.spremljeno > now() - interval '10 minutes'
  ) then
    return new;
  end if;
  select coalesce(max(p.redni), 0) + 1 into sljedeci from public.lov_dnevnici_povijest p where p.korisnik = old.korisnik;
  insert into public.lov_dnevnici_povijest as p (korisnik, podaci, azurirano, spremljeno, redni, slot)
  values (old.korisnik, old.podaci, old.azurirano, now(), sljedeci, (sljedeci % 20)::int)
  on conflict (korisnik, slot) do update
    set podaci = excluded.podaci, azurirano = excluded.azurirano, spremljeno = excluded.spremljeno, redni = excluded.redni;
  return new;
end $$;
drop trigger if exists lov_dnevnici_verzija on public.lov_dnevnici;
create trigger lov_dnevnici_verzija before update on public.lov_dnevnici
  for each row when (old.podaci is distinct from new.podaci) execute function lov_privatno.sacuvaj_verziju();

-- Fotografije u oblaku (privatno, mapa po korisniku; brisanje iz aplikacije ne briše kopiju u oblaku).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lov-fotografije', 'lov-fotografije', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "lov_foto_citanje" on storage.objects;
create policy "lov_foto_citanje" on storage.objects for select to authenticated
  using (bucket_id = 'lov-fotografije' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "lov_foto_unos" on storage.objects;
create policy "lov_foto_unos" on storage.objects for insert to authenticated
  with check (bucket_id = 'lov-fotografije' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Administracija: statistika samo za administratore (popis u privatnoj shemi, dodaje se ručno).
create table if not exists lov_privatno.admini (korisnik uuid primary key references auth.users (id) on delete cascade);
-- insert into lov_privatno.admini (korisnik) values ('<uuid administratora>');
-- Funkcije public.lov_je_admin() i public.lov_admin_statistika() (security definer, provjeravaju lov_privatno.admini)
-- primijenjene su migracijom „lov_admin”; vraćaju samo brojke, ne sadržaj dnevnika.

-- Mišljenja korisnika (pitanje u aplikaciji nakon sat vremena korištenja).
-- Korisnik smije samo upisati svoj odgovor; čita ih samo administrator preko lov_admin_misljenja().
create table if not exists public.lov_misljenja (
  id bigint generated always as identity primary key,
  korisnik uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ocjena smallint not null check (ocjena in (-1, 1)),
  tekst text check (char_length(tekst) <= 2000),
  verzija text check (char_length(verzija) <= 40),
  stvoreno timestamptz not null default now()
);
create index if not exists lov_misljenja_stvoreno on public.lov_misljenja (stvoreno desc);
alter table public.lov_misljenja enable row level security;
create policy "lov_misljenja_unos" on public.lov_misljenja for insert to authenticated with check (korisnik = (select auth.uid()));
revoke all on public.lov_misljenja from anon;
revoke all on public.lov_misljenja from authenticated;
grant insert (ocjena, tekst, verzija) on public.lov_misljenja to authenticated;

create or replace function public.lov_admin_misljenja()
returns table (id bigint, ocjena smallint, tekst text, verzija text, stvoreno timestamptz, email text, ime text, korisnicko_ime text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from lov_privatno.admini a where a.korisnik = (select auth.uid())) then
    raise exception 'Nema pristupa' using errcode = '42501';
  end if;
  return query
    select m.id, m.ocjena, m.tekst, m.verzija, m.stvoreno, u.email::text, p.ime, p.korisnicko_ime
    from public.lov_misljenja m
    join auth.users u on u.id = m.korisnik
    left join public.lov_profili p on p.id = m.korisnik
    order by m.stvoreno desc
    limit 500;
end $$;
revoke all on function public.lov_admin_misljenja() from public, anon;
grant execute on function public.lov_admin_misljenja() to authenticated;
