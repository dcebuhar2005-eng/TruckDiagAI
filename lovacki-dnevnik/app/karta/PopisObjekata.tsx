"use client";

import { useMemo, useState } from "react";
import Ikona from "@/components/Ikona";
import { Ploca, Segmenti, cx } from "@/components/ui";
import { poRedu } from "@/components/Dolasci";
import { TIPOVI_TOCAKA, bojaVrste, divljacTraga, nazivSpola, opisVrsteTocke, znakTraga } from "@/lib/katalog";
import { datumKratki, metri, sat, udaljenostM } from "@/lib/format";
import { danaOd, opisDana, zadnjeDopune } from "@/lib/upiti";
import { OCJENE, imaTip, imaVjetrove, ocjenaVjetra, sljedeciDobar, tockaZaVjetar } from "@/lib/vjetarCeke";
import type { Baza, TipTocke } from "@/lib/types";
import type { SatnaPrognoza } from "@/lib/vrijeme";

type Kartica = "tocke" | "tragovi" | "odstrel";
export type OdabirPopisa = { tip: "tocka"; id: string } | { tip: "odstrel"; id: string } | { tip: "trag"; id: string; k: number };

/** Popis svih objekata na karti (točke, tragovi, odstrel) s pretragom; dodir pomakne kartu na objekt. */
export default function PopisObjekata({
  baza,
  otvorena,
  zatvori,
  odaberi,
  pozicija,
  smjer,
  brzina,
  satno,
}: {
  baza: Baza;
  otvorena: boolean;
  zatvori: () => void;
  odaberi: (o: OdabirPopisa, lat: number, lng: number) => void;
  pozicija?: { lat: number; lng: number } | null;
  smjer?: number;
  brzina?: number;
  satno: SatnaPrognoza[];
}) {
  const [kartica, setKartica] = useState<Kartica>("tocke");
  const [trazi, setTrazi] = useState("");
  const [vrsta, setVrsta] = useState<TipTocke | null>(null);
  const [sada] = useState(() => Date.now());
  const q = trazi.trim().toLowerCase();
  const udalj = (o: { lat: number; lng: number }) => (pozicija ? udaljenostM(pozicija, o) : null);

  const tragovi = useMemo(
    () =>
      baza.izlasci
        .flatMap((i) => (i.tragovi ?? []).map((t, k) => ({ i, t, k })))
        .filter((x) => x.t.lat != null && x.t.lng != null)
        .sort((a, b) => `${b.i.datum} ${b.t.vrijeme ?? ""}`.localeCompare(`${a.i.datum} ${a.t.vrijeme ?? ""}`)),
    [baza.izlasci],
  );
  const odstrel = useMemo(
    () => baza.odstrel.filter((o) => o.lat != null && o.lng != null && !o.tudji).sort((a, b) => `${b.datum} ${b.vrijeme}`.localeCompare(`${a.datum} ${a.vrijeme}`)),
    [baza.odstrel],
  );
  const dopune = useMemo(() => zadnjeDopune(baza), [baza]);

  const vrste = [...new Set(baza.tocke.map((t) => t.tip))];
  const tocke = baza.tocke.filter(
    (t) => (!vrsta || t.tip === vrsta || t.dodatno?.includes(vrsta)) && (!q || `${t.naziv} ${opisVrsteTocke(t)}`.toLowerCase().includes(q)),
  );
  // Grupe po lovištu; najbliže (ili abecedno) prvo.
  const grupe = [...new Set(tocke.map((t) => t.lovisteId ?? ""))]
    .map((id) => {
      const u = tocke.filter((t) => (t.lovisteId ?? "") === id).sort((a, b) => (udalj(a) ?? 0) - (udalj(b) ?? 0) || a.naziv.localeCompare(b.naziv, "hr"));
      return { id, naziv: baza.lovista.find((l) => l.id === id)?.naziv ?? "Bez lovišta", u, min: Math.min(...u.map((t) => udalj(t) ?? Infinity)) };
    })
    .sort((a, b) => a.min - b.min || a.naziv.localeCompare(b.naziv, "hr"));

  const tragoviF = tragovi.filter(({ t }) => !q || `${divljacTraga(t.divljac).naziv} ${znakTraga(t.znak)}`.toLowerCase().includes(q));
  const odstrelF = odstrel.filter((o) => !q || `${o.vrsta} ${nazivSpola(o.vrsta, o.spol)} ${o.markica ?? ""}`.toLowerCase().includes(q));

  const Udaljenost = ({ o }: { o: { lat: number; lng: number } }) => {
    const m = udalj(o);
    return m != null ? <span className="brojke shrink-0 text-[12.5px] text-tekst-3">{metri(m)}</span> : null;
  };

  return (
    <Ploca
      otvorena={otvorena}
      zatvori={zatvori}
      naslov="Na karti"
      podnaslov={`${baza.tocke.length} točaka · ${tragovi.length} tragova · ${odstrel.length} odstrela`}
      sirina={480}
    >
      <div className="grid gap-3 pb-2">
        <Segmenti
          vrijednost={kartica}
          promjena={(v) => setKartica(v)}
          opcije={[
            { vrijednost: "tocke", oznaka: "Točke", broj: baza.tocke.length },
            { vrijednost: "tragovi", oznaka: "Tragovi", broj: tragovi.length },
            { vrijednost: "odstrel", oznaka: "Odstrel", broj: odstrel.length },
          ]}
        />
        <div className="relative">
          <Ikona ime="pretraga" velicina={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tekst-3" />
          <input className="unos pl-10" placeholder="Traži po imenu…" value={trazi} onChange={(e) => setTrazi(e.target.value)} aria-label="Traži" />
        </div>

        {kartica === "tocke" && (
          <>
            {vrste.length > 1 && (
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                {[null, ...vrste].map((v) => (
                  <button
                    key={v ?? "sve"}
                    type="button"
                    onClick={() => setVrsta(v)}
                    className={cx(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px]",
                      vrsta === v ? "border-naglasak bg-naglasak-meki text-tekst" : "border-rub text-tekst-2",
                    )}
                  >
                    {v && <span className="size-2 rounded-full" style={{ background: TIPOVI_TOCAKA[v].boja }} />}
                    {v ? `${TIPOVI_TOCAKA[v].naziv} ${baza.tocke.filter((t) => t.tip === v || t.dodatno?.includes(v)).length}` : "Sve"}
                  </button>
                ))}
              </div>
            )}
            {grupe.map((g) => (
              <div key={g.id} className="grid gap-1.5">
                <div className="mt-1 text-[11.5px] font-semibold tracking-[0.12em] text-tekst-3 uppercase">{g.naziv}</div>
                {g.u.map((t) => {
                  const dopuna = dopune.get(t.id);
                  const zadnji = t.dolasci?.length ? poRedu(t.dolasci)[0] : undefined;
                  let opis: React.ReactNode = opisVrsteTocke(t);
                  if (tockaZaVjetar(t)) {
                    if (!imaVjetrove(t)) opis = <span className="text-tekst-3">Dobri vjetrovi nisu upisani</span>;
                    else {
                      const o = ocjenaVjetra(t, smjer, brzina);
                      const sl = o !== "dobar" ? sljedeciDobar(t, satno, sada) : null;
                      opis = (
                        <span style={{ color: OCJENE[o].boja }}>
                          ● {OCJENE[o].naziv}
                          {sl ? ` · dobar od ${sat(sl.od)}` : ""}
                        </span>
                      );
                    }
                  } else if (imaTip(t, "hraniliste") || imaTip(t, "soliste") || imaTip(t, "pojiliste")) {
                    const n = dopuna ? danaOd(dopuna.datum) : null;
                    opis = dopuna ? (
                      <span className={n! > 14 ? "text-opasnost" : undefined}>
                        Dopuna {opisDana(n!)}
                        {dopuna.hrana ? ` · ${dopuna.hrana.toLowerCase()}` : ""}
                      </span>
                    ) : (
                      <span className="text-opasnost">Nije dopunjeno</span>
                    );
                  }
                  if (zadnji && (t.tip === "kamera" || !tockaZaVjetar(t)))
                    opis = `${zadnji.vrsta} · ${datumKratki(zadnji.datum)} u ${zadnji.vrijeme}`;
                  return (
                    <button
                      key={t.id}
                      onClick={() => odaberi({ tip: "tocka", id: t.id }, t.lat, t.lng)}
                      className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3 py-2.5 text-left hover:bg-povrsina-3"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-black/75" style={{ background: TIPOVI_TOCAKA[t.tip].boja }}>
                        {TIPOVI_TOCAKA[t.tip].slovo}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium">{t.naziv}</span>
                        <span className="block truncate text-[12.5px] text-tekst-2">{opis}</span>
                      </span>
                      <Udaljenost o={t} />
                    </button>
                  );
                })}
              </div>
            ))}
            {!tocke.length && <Prazno tekst={baza.tocke.length ? "Ništa ne odgovara pretrazi." : "Još nema točaka – dodajte čeku ili hranilište na karti."} />}
          </>
        )}

        {kartica === "tragovi" &&
          (tragoviF.length ? (
            <div className="grid gap-1.5">
              {tragoviF.map(({ i, t, k }) => {
                const d = divljacTraga(t.divljac);
                return (
                  <button
                    key={`${i.id}-${k}`}
                    onClick={() => odaberi({ tip: "trag", id: i.id, k }, t.lat!, t.lng!)}
                    className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3 py-2.5 text-left hover:bg-povrsina-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `${d.boja}33`, color: d.boja }}>
                      <Ikona ime="trag" velicina={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">
                        {znakTraga(t.znak)} · {d.naziv.toLowerCase()}
                      </span>
                      <span className="block truncate text-[12.5px] text-tekst-2">
                        {datumKratki(i.datum)}
                        {t.vrijeme ? ` u ${t.vrijeme}` : ""}
                        {t.svjez != null && (t.svjez ? " · svjež" : " · star")}
                      </span>
                    </span>
                    <Udaljenost o={{ lat: t.lat!, lng: t.lng! }} />
                  </button>
                );
              })}
            </div>
          ) : (
            <Prazno tekst={tragovi.length ? "Ništa ne odgovara pretrazi." : "Još nema tragova s lokacijom – zabilježite ih u lovu."} />
          ))}

        {kartica === "odstrel" &&
          (odstrelF.length ? (
            <div className="grid gap-1.5">
              {odstrelF.map((o) => (
                <button
                  key={o.id}
                  onClick={() => odaberi({ tip: "odstrel", id: o.id }, o.lat!, o.lng!)}
                  className="flex items-center gap-3 rounded-xl bg-povrsina-2 px-3 py-2.5 text-left hover:bg-povrsina-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `${bojaVrste(o.vrsta)}33`, color: bojaVrste(o.vrsta) }}>
                    <Ikona ime="meta" velicina={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium">
                      {o.vrsta} · {nazivSpola(o.vrsta, o.spol)}
                    </span>
                    <span className="block truncate text-[12.5px] text-tekst-2">
                      {datumKratki(o.datum)} u {o.vrijeme}
                      {o.masa ? ` · ${o.masa} kg` : ""}
                    </span>
                  </span>
                  <Udaljenost o={{ lat: o.lat!, lng: o.lng! }} />
                </button>
              ))}
            </div>
          ) : (
            <Prazno tekst={odstrel.length ? "Ništa ne odgovara pretrazi." : "Još nema odstrela s lokacijom."} />
          ))}
      </div>
    </Ploca>
  );
}

function Prazno({ tekst }: { tekst: string }) {
  return <p className="rounded-xl bg-povrsina-2 p-4 text-center text-[14px] text-tekst-3">{tekst}</p>;
}
