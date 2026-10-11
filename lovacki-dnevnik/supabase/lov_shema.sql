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
