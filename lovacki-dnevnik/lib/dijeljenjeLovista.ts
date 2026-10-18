"use client";

// Lovište (granica i točke) šalje se prijatelju kao kopija. Primatelj ga jednim dodirom doda na svoju
// kartu: ako već ima lovište istog naziva ili broja, točke se dodaju u njega, a točka koju već ima na
// istom mjestu se ne ponavlja. Izlasci, odstrel i bilješke se nikad ne šalju.

import { useCallback, useEffect, useState } from "react";
import { sb, type Profil } from "./drustvo";
import { udaljenostM } from "./format";
import { db, noviId } from "./store";
import type { Loviste, Tocka } from "./types";

type TockaPaketa = Omit<Tocka, "id" | "createdAt" | "lovisteId">;

export interface PaketLovista {
  v: 1;
  loviste: Omit<Loviste, "id" | "createdAt">;
  tocke: TockaPaketa[];
}

export interface PrimljenoLoviste {
  id: number;
  od: Profil | null;
  naziv: string;
  paket: PaketLovista;
  kada: number;
}

/** Točke na manjoj udaljenosti smatraju se istom točkom. */
const ISTO_MJESTO_M = 15;

export function napraviPaket(l: Loviste, tocke: Tocka[], granica: boolean): PaketLovista {
  const bez = <T extends object>(o: T, kljucevi: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !kljucevi.includes(k)));
  return {
    v: 1,
    loviste: bez(l, granica ? ["id", "createdAt"] : ["id", "createdAt", "granica"]) as PaketLovista["loviste"],
    tocke: tocke.map((t) => bez(t, ["id", "createdAt", "lovisteId"]) as TockaPaketa),
  };
}

export async function posaljiLoviste(primatelji: string[], paket: PaketLovista) {
  const { error } = await sb()
    .from("lov_poslana_lovista")
    .insert(primatelji.map((za) => ({ za, naziv: paket.loviste.naziv, podaci: paket })));
  if (error) throw new Error("Slanje nije uspjelo. Provjerite internet i pokušajte ponovno.");
}

async function dohvatiPrimljena(): Promise<PrimljenoLoviste[]> {
  const k = sb();
  const ja = (await k.auth.getSession()).data.session?.user.id;
  if (!ja) return [];
  const { data, error } = await k.from("lov_poslana_lovista").select("id,od,naziv,podaci,created_at").eq("za", ja).order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  const ids = [...new Set(data.map((r) => r.od as string))];
  const prof = await k.from("lov_profili").select("id,korisnicko_ime,ime,drustvo").in("id", ids);
  const poId = new Map(((prof.data ?? []) as Profil[]).map((p) => [p.id, p]));
  return data.map((r) => ({
    id: r.id as number,
    od: poId.get(r.od as string) ?? null,
    naziv: r.naziv as string,
    paket: r.podaci as PaketLovista,
    kada: Date.parse(r.created_at as string),
  }));
}

export function usePrimljenaLovista() {
  const [popis, setPopis] = useState<PrimljenoLoviste[]>([]);
  const osvjezi = useCallback(() => {
    dohvatiPrimljena()
      .then(setPopis)
      .catch(() => {});
  }, []);
  useEffect(() => {
    let ziv = true;
    dohvatiPrimljena()
      .then((p) => ziv && setPopis(p))
      .catch(() => {});
    return () => {
      ziv = false;
    };
  }, []);
  return { popis, osvjezi };
}

export async function odbaciPrimljeno(id: number) {
  await sb().from("lov_poslana_lovista").delete().eq("id", id);
}

const normaliziraj = (s?: string) => (s ?? "").trim().toLowerCase();

/** Dodaje primljeno lovište na moju kartu. Vraća koliko je novih točaka dodano i u koje lovište. */
export async function prihvatiPrimljeno(p: PrimljenoLoviste) {
  const b = db.dohvati();
  const { loviste: l, tocke } = p.paket;
  const sad = Date.now();
  let cilj = b.lovista.find(
    (x) => (l.broj && normaliziraj(x.broj) === normaliziraj(l.broj)) || normaliziraj(x.naziv) === normaliziraj(l.naziv),
  );
  let lovista = b.lovista;
  if (!cilj) {
    cilj = { ...l, id: noviId(), createdAt: sad };
    lovista = [cilj, ...lovista];
  } else if (!cilj.granica?.length && l.granica?.length) {
    const s = { ...cilj, granica: l.granica, povrsinaHa: cilj.povrsinaHa ?? l.povrsinaHa };
    lovista = lovista.map((x) => (x.id === s.id ? s : x));
    cilj = s;
  }
  const nove: Tocka[] = [];
  for (const t of tocke) {
    const vec = [...b.tocke, ...nove].some((x) => x.tip === t.tip && udaljenostM(x, t) < ISTO_MJESTO_M);
    if (!vec) nove.push({ ...t, id: noviId(), lovisteId: cilj.id, createdAt: sad });
  }
  db.zamijeni({ ...b, lovista, tocke: [...nove, ...b.tocke] });
  await odbaciPrimljeno(p.id).catch(() => {});
  return { dodano: nove.length, preskoceno: tocke.length - nove.length, loviste: cilj };
}
