"use client";

import { TIPOVI_TOCAKA } from "@/lib/katalog";
import type { TipTocke } from "@/lib/types";

// Uzorci odgovaraju stilovima u SumskiPutevi.tsx (obrub + linija).
const PUTEVI: { naziv: string; opis: string; boja: string; obrub: string; debljina: number; crtice?: string }[] = [
  { naziv: "Makadam / servisna cesta", opis: "Prohodno autom", boja: "#fff4d6", obrub: "#2a2116", debljina: 3.6 },
  { naziv: "Dobra šumska cesta", opis: "Tvrda podloga, terenac", boja: "#ffd27a", obrub: "#2a1c0c", debljina: 3.4 },
  { naziv: "Šumska vlaka", opis: "Zemlja/šljunak, po suhom", boja: "#f5b84a", obrub: "#2a1c0c", debljina: 2.8, crtice: "9 6" },
  { naziv: "Loša vlaka", opis: "Traktor ili pješice", boja: "#f5b84a", obrub: "#2a1c0c", debljina: 2.8, crtice: "5 5" },
  { naziv: "Staza", opis: "Samo pješice", boja: "#ffffff", obrub: "#1c1c1c", debljina: 2, crtice: "2 5" },
];

function UzorakLinije({ boja, obrub, debljina, crtice }: { boja: string; obrub: string; debljina: number; crtice?: string }) {
  return (
    <svg width="46" height="16" viewBox="0 0 46 16" className="shrink-0 overflow-visible rounded bg-[#3d4a35]">
      <line x1="4" y1="8" x2="42" y2="8" stroke={obrub} strokeOpacity="0.75" strokeWidth={debljina + 2.4} strokeLinecap="round" />
      <line x1="4" y1="8" x2="42" y2="8" stroke={boja} strokeWidth={debljina} strokeLinecap="round" strokeDasharray={crtice} />
    </svg>
  );
}

function Stavka({ uzorak, naziv, opis }: { uzorak: React.ReactNode; naziv: string; opis?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="grid w-[46px] shrink-0 place-items-center">{uzorak}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] leading-tight">{naziv}</div>
        {opis && <div className="text-[11.5px] text-white/50">{opis}</div>}
      </div>
    </div>
  );
}

export default function Legenda() {
  const tocke: TipTocke[] = ["ceka", "zasjeda", "hraniliste", "soliste", "kamera", "kaljuziste", "pojiliste"];
  return (
    <div className="max-h-[60dvh] overflow-y-auto pr-1">
      <div className="mb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Putevi</div>
      {PUTEVI.map((p) => (
        <Stavka key={p.naziv} naziv={p.naziv} opis={p.opis} uzorak={<UzorakLinije {...p} />} />
      ))}

      <div className="mt-3 mb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Oznake</div>
      <Stavka
        naziv="Granica lovišta"
        uzorak={
          <svg width="46" height="16" viewBox="0 0 46 16">
            <rect x="3" y="3" width="40" height="10" rx="2" fill="#e8a947" fillOpacity="0.15" stroke="#e8a947" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        }
      />
      {[
        { naziv: "Zona mirisa – dobar vjetar", opis: "Vjetar puše s jedne od strana koje ste označili za čeku", boja: "#6fbf73" },
        { naziv: "Zona mirisa – loš vjetar", opis: "Miris ide prema divljači; crvena = loše, žuta = rubno ili nije određeno", boja: "#e0574f" },
      ].map((z) => (
        <Stavka
          key={z.naziv}
          naziv={z.naziv}
          opis={z.opis}
          uzorak={
            <svg width="46" height="18" viewBox="0 0 46 18">
              <path d="M4 9 L42 2 L42 16 Z" fill={z.boja} fillOpacity="0.3" stroke={z.boja} strokeOpacity="0.7" />
            </svg>
          }
        />
      ))}
      <Stavka
        naziv="Prijatelj u lovu"
        opis="Krug od 300 m oko njega"
        uzorak={
          <svg width="46" height="22" viewBox="0 0 46 22">
            <circle cx="23" cy="11" r="10" fill="#f26b1d" fillOpacity="0.12" stroke="#f26b1d" strokeDasharray="3 3" />
            <circle cx="23" cy="11" r="5" fill="#f26b1d" stroke="#fff" strokeWidth="1.5" />
          </svg>
        }
      />
      <Stavka
        naziv="Vaša lokacija"
        uzorak={
          <svg width="46" height="18" viewBox="0 0 46 18">
            <circle cx="23" cy="9" r="5.5" fill="#4ea1ff" stroke="#fff" strokeWidth="2" />
          </svg>
        }
      />
      <Stavka
        naziv="Mjesto odstrela"
        uzorak={
          <svg width="46" height="18" viewBox="0 0 46 18">
            <circle cx="23" cy="9" r="6" fill="#c98500" stroke="#fff" strokeWidth="2" />
            <circle cx="23" cy="9" r="2" fill="#111" />
          </svg>
        }
      />

      <div className="mt-3 mb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Točke u lovištu</div>
      <div className="grid grid-cols-2 gap-x-2">
        {tocke.map((t) => (
          <div key={t} className="flex items-center gap-2 py-1 text-[13px]">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-black/75"
              style={{ background: TIPOVI_TOCAKA[t].boja }}
            >
              {TIPOVI_TOCAKA[t].slovo}
            </span>
            {TIPOVI_TOCAKA[t].naziv}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-white/45">
        Putevi su iz OpenStreetMapa i mogu biti nepotpuni. Stanje puta provjerite na terenu.
      </p>
    </div>
  );
}
