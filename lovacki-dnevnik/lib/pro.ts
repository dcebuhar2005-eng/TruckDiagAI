"use client";

// CroLovac PRO: funkcije koje se čuvaju za plaćeni paket (novi Pregled, „Kad u lov?” za 8 dana, uvoz staza).
// Dok naplata ne postoji, PRO vidi samo administrator (za isprobavanje); ostali ih uopće ne vide.
// Kad krene naplata, ovdje se dodaju pretplatnici i Osnivači (testeri – PRO besplatno zauvijek).

import { useEffect, useSyncExternalStore } from "react";
import { konfigurirano, sb, useDrustvo } from "./drustvo";

let stanje: { za: string | null; pro: boolean } = { za: null, pro: false };
const slusaci = new Set<() => void>();
const postavi = (s: typeof stanje) => {
  stanje = s;
  slusaci.forEach((f) => f());
};

function provjeri(id: string) {
  if (stanje.za === id) return;
  postavi({ za: id, pro: false });
  sb()
    .rpc("lov_je_admin")
    .then(({ data }) => stanje.za === id && postavi({ za: id, pro: data === true }));
}

/** Ima li prijavljeni korisnik PRO funkcije. */
export function usePro() {
  const id = useDrustvo().sesija?.user.id ?? null;
  useEffect(() => {
    if (id && konfigurirano) provjeri(id);
  }, [id]);
  const s = useSyncExternalStore(
    (f) => {
      slusaci.add(f);
      return () => slusaci.delete(f);
    },
    () => stanje,
    () => stanje,
  );
  return Boolean(id) && s.za === id && s.pro;
}
