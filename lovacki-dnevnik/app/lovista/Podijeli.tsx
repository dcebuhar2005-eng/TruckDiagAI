"use client";

import Link from "next/link";
import { useState } from "react";
import Ikona from "@/components/Ikona";
import { Gumb, Ploca, cx, obavijest } from "@/components/ui";
import { TIPOVI_TOCAKA } from "@/lib/katalog";
import { konfigurirano, useDrustvo } from "@/lib/drustvo";
import { datumKratki } from "@/lib/format";
import { napraviPaket, odbaciPrimljeno, posaljiLoviste, prihvatiPrimljeno, usePrimljenaLovista } from "@/lib/dijeljenjeLovista";
import type { Loviste, Tocka } from "@/lib/types";

/** Slanje lovišta (granica i odabrane točke) prijateljima. */
export function PodijeliLoviste({ otvorena, zatvori, l, tocke }: { otvorena: boolean; zatvori: () => void; l: Loviste; tocke: Tocka[] }) {
  const d = useDrustvo();
  const prijatelji = d.prijateljstva.filter((p) => p.status === "prihvaceno");
  const imaGranicu = (l.granica?.length ?? 0) >= 3;
  const [granica, setGranica] = useState(imaGranicu);
  const [odabrane, setOdabrane] = useState<Set<string>>(() => new Set(tocke.map((t) => t.id)));
  const [kome, setKome] = useState<Set<string>>(new Set());
  const [saljem, setSaljem] = useState(false);

  const prebaci = <T,>(s: Set<T>, v: T) => {
    const n = new Set(s);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const posalji = async () => {
    setSaljem(true);
    try {
      await posaljiLoviste([...kome], napraviPaket(l, tocke.filter((t) => odabrane.has(t.id)), granica));
      const imena = prijatelji.filter((p) => kome.has(p.drugi.id)).map((p) => p.drugi.ime.split(" ")[0]);
      obavijest(`Lovište „${l.naziv}” poslano: ${imena.join(", ")}`);
      setKome(new Set());
      zatvori();
    } catch (e) {
      obavijest((e as Error).message, "greska");
    } finally {
      setSaljem(false);
    }
  };

  const nista = !granica && !odabrane.size;
  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Podijeli s lovcem"
      podnaslov="Prijatelj dobije kopiju na svoju kartu. Izlasci, odstrel i bilješke se ne šalju."
      podnozje={
        prijatelji.length > 0 && (
          <Gumb vrsta="primarni" ikona="kvacica" className="w-full" disabled={!kome.size || nista || saljem} onClick={posalji}>
            {saljem ? "Šaljem…" : kome.size ? `Pošalji (${kome.size})` : "Odaberite kome"}
          </Gumb>
        )
      }
    >
      {!konfigurirano || !d.sesija || !prijatelji.length ? (
        <div className="rounded-2xl bg-povrsina-2 p-4 text-[14.5px] text-tekst-2">
          {!d.sesija ? "Za slanje se prijavite u Lovcima i dodajte prijatelja." : "Još nemate prijatelja kojima biste poslali lovište."}
          <Link href="/lovci" className="mt-2 block font-medium text-naglasak">
            Idi na Lovce →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-2 text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Kome</div>
          <div className="flex flex-wrap gap-2">
            {prijatelji.map((p) => {
              const on = kome.has(p.drugi.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setKome(prebaci(kome, p.drugi.id))}
                  aria-pressed={on}
                  className={cx(
                    "rounded-full border px-3.5 py-2 text-[14px]",
                    on ? "border-naglasak bg-naglasak-meki font-medium" : "border-rub bg-povrsina-2",
                  )}
                >
                  {on && "✓ "}
                  {p.drugi.ime}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-5 mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">Što šaljete</span>
        {tocke.length > 1 && (
          <button
            className="text-[13px] font-medium text-naglasak"
            onClick={() => setOdabrane(odabrane.size === tocke.length ? new Set() : new Set(tocke.map((t) => t.id)))}
          >
            {odabrane.size === tocke.length ? "Odznači sve" : "Označi sve"}
          </button>
        )}
      </div>
      <div className="grid gap-1.5">
        {imaGranicu && (
          <Stavka on={granica} promijeni={() => setGranica(!granica)} boja={l.boja} slovo="◇" naziv="Granica lovišta" opis={`${l.granica!.length} točaka granice`} />
        )}
        {tocke.map((t) => (
          <Stavka
            key={t.id}
            on={odabrane.has(t.id)}
            promijeni={() => setOdabrane(prebaci(odabrane, t.id))}
            boja={TIPOVI_TOCAKA[t.tip].boja}
            slovo={TIPOVI_TOCAKA[t.tip].slovo}
            naziv={t.naziv}
            opis={TIPOVI_TOCAKA[t.tip].naziv}
          />
        ))}
        {!imaGranicu && !tocke.length && <p className="text-sm text-tekst-3">U ovom lovištu još nema granice ni točaka.</p>}
      </div>
      <p className="mt-3 text-[12.5px] text-tekst-3">Odznačite što želite zadržati za sebe (npr. svoju čeku).</p>
    </Ploca>
  );
}

function Stavka({ on, promijeni, boja, slovo, naziv, opis }: { on: boolean; promijeni: () => void; boja: string; slovo: string; naziv: string; opis: string }) {
  return (
    <button onClick={promijeni} aria-pressed={on} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-left", on ? "bg-povrsina-2" : "opacity-55")}>
      <span className={cx("grid size-6 shrink-0 place-items-center rounded-md border-2", on ? "border-naglasak bg-naglasak text-[#17130a]" : "border-rub-jaki")}>
        {on && <Ikona ime="kvacica" velicina={14} />}
      </span>
      <span className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-black/75" style={{ background: boja }}>
        {slovo}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px]">{naziv}</span>
        <span className="block text-[11.5px] text-tekst-3">{opis}</span>
      </span>
    </button>
  );
}

/** Lovišta koja su mi prijatelji poslali – dodajem ih na svoju kartu ili odbacujem. */
export function PrimljenaLovista() {
  const { popis, osvjezi } = usePrimljenaLovista();
  const [radim, setRadim] = useState<number | null>(null);
  if (!popis.length) return null;
  return (
    <div className="mb-5 grid gap-2">
      {popis.map((p) => {
        const brojTocaka = p.paket.tocke.length;
        const granica = (p.paket.loviste.granica?.length ?? 0) >= 3;
        return (
          <div key={p.id} className="kartica flex flex-wrap items-center gap-3 border-naglasak/40 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-naglasak-meki text-naglasak">
              <Ikona ime="loviste" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">
                {p.od?.ime ?? "Prijatelj"} vam šalje lovište „{p.naziv}”
              </div>
              <div className="text-[13px] text-tekst-2">
                {[granica && "granica", `${brojTocaka} ${brojTocaka === 1 ? "točka" : brojTocaka < 5 ? "točke" : "točaka"}`].filter(Boolean).join(" + ")} ·{" "}
                {datumKratki(new Date(p.kada).toISOString().slice(0, 10))}
              </div>
            </div>
            <div className="flex gap-2">
              <Gumb
                velicina="sm"
                vrsta="tihi"
                disabled={radim === p.id}
                onClick={() => {
                  setRadim(p.id);
                  odbaciPrimljeno(p.id)
                    .then(osvjezi)
                    .finally(() => setRadim(null));
                }}
              >
                Odbaci
              </Gumb>
              <Gumb
                velicina="sm"
                vrsta="primarni"
                ikona="plus"
                disabled={radim === p.id}
                onClick={() => {
                  setRadim(p.id);
                  prihvatiPrimljeno(p)
                    .then((r) =>
                      obavijest(
                        `Dodano u „${r.loviste.naziv}”: ${r.dodano} ${r.dodano === 1 ? "točka" : "točaka"}${r.preskoceno ? ` (${r.preskoceno} već imate)` : ""}`,
                      ),
                    )
                    .catch(() => obavijest("Dodavanje nije uspjelo", "greska"))
                    .finally(() => (setRadim(null), osvjezi()));
                }}
              >
                Dodaj na moju kartu
              </Gumb>
            </div>
          </div>
        );
      })}
    </div>
  );
}
