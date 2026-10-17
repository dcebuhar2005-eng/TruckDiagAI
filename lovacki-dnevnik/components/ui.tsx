"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Ikona, { type ImeIkone } from "./Ikona";

export const opruga = { type: "spring", stiffness: 560, damping: 38, mass: 0.8 } as const;
export const mekaOpruga = { type: "spring", stiffness: 260, damping: 30 } as const;

export function cx(...k: (string | false | null | undefined)[]) {
  return k.filter(Boolean).join(" ");
}

/* ---------------- Gumb ---------------- */

type VrstaGumba = "primarni" | "sekundarni" | "tihi" | "opasni";

export function Gumb({
  vrsta = "sekundarni",
  ikona,
  children,
  className,
  velicina = "md",
  ...props
}: {
  vrsta?: VrstaGumba;
  ikona?: ImeIkone;
  velicina?: "sm" | "md" | "lg";
  children?: ReactNode;
} & HTMLMotionProps<"button">) {
  const stilovi: Record<VrstaGumba, string> = {
    primarni:
      "bg-naglasak text-[#17130a] shadow-[0_8px_24px_-10px_var(--naglasak)] hover:brightness-110",
    sekundarni: "bg-povrsina-2 text-tekst border border-rub hover:bg-povrsina-3",
    tihi: "text-tekst-2 hover:text-tekst hover:bg-povrsina-2",
    opasni: "bg-opasnost-meka text-opasnost hover:bg-opasnost hover:text-white",
  };
  const vel = {
    sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[10px]",
    md: "h-11 px-4 text-[14.5px] gap-2 rounded-xl",
    lg: "h-13 px-6 text-[15.5px] gap-2.5 rounded-2xl",
  }[velicina];
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={opruga}
      className={cx(
        "inline-flex items-center justify-center font-medium transition-[background,color,filter] duration-200 select-none disabled:opacity-40 disabled:pointer-events-none",
        stilovi[vrsta],
        vel,
        className,
      )}
      {...props}
    >
      {ikona && <Ikona ime={ikona} velicina={velicina === "sm" ? 15 : 18} />}
      {children}
    </motion.button>
  );
}

export function IkonaGumb({
  ikona,
  oznaka,
  className,
  ...props
}: { ikona: ImeIkone; oznaka: string } & HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.04 }}
      transition={opruga}
      aria-label={oznaka}
      title={oznaka}
      className={cx(
        "grid place-items-center size-10 rounded-xl text-tekst-2 hover:text-tekst bg-povrsina-2 border border-rub",
        className,
      )}
      {...props}
    >
      <Ikona ime={ikona} velicina={18} />
    </motion.button>
  );
}

/* ---------------- Polja ---------------- */

export function Polje({
  oznaka,
  pomoc,
  children,
  className,
}: {
  oznaka: string;
  pomoc?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-medium tracking-wide text-tekst-2 uppercase">
        {oznaka}
      </span>
      {children}
      {pomoc && <span className="mt-1 block text-xs text-tekst-3">{pomoc}</span>}
    </label>
  );
}

export function Segmenti<T extends string>({
  opcije,
  vrijednost,
  promjena,
  className,
}: {
  opcije: { vrijednost: T; oznaka: string; broj?: number }[];
  vrijednost: T;
  promjena: (v: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cx(
        "relative flex rounded-2xl bg-povrsina-2 p-1 border border-rub skriven-klizac overflow-x-auto",
        className,
      )}
    >
      {opcije.map((o) => {
        const aktivna = o.vrijednost === vrijednost;
        return (
          <button
            key={o.vrijednost}
            type="button"
            onClick={() => promjena(o.vrijednost)}
            className={cx(
              "relative flex-1 whitespace-nowrap px-3.5 py-2 text-[13.5px] font-medium rounded-xl transition-colors duration-200",
              aktivna ? "text-tekst" : "text-tekst-3 hover:text-tekst-2",
            )}
          >
            {aktivna && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={opruga}
                className="absolute inset-0 rounded-xl bg-povrsina shadow-meka border border-rub"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.oznaka}
              {o.broj != null && (
                <span
                  className={cx(
                    "brojke rounded-full px-1.5 text-[11px] leading-[18px]",
                    aktivna ? "bg-naglasak-meki text-naglasak" : "bg-povrsina-3 text-tekst-3",
                  )}
                >
                  {o.broj}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Cipovi({
  opcije,
  odabrano,
  promjena,
}: {
  opcije: { vrijednost: string; oznaka: string; boja?: string }[];
  odabrano: string;
  promjena: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcije.map((o) => {
        const a = o.vrijednost === odabrano;
        return (
          <motion.button
            type="button"
            key={o.vrijednost}
            whileTap={{ scale: 0.94 }}
            onClick={() => promjena(o.vrijednost)}
            className={cx(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors",
              a
                ? "border-naglasak bg-naglasak-meki text-tekst"
                : "border-rub bg-povrsina-2 text-tekst-2 hover:border-rub-jaki",
            )}
          >
            {o.boja && <span className="size-2 rounded-full" style={{ background: o.boja }} />}
            {o.oznaka}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ---------------- Ploča (bottom sheet / dijalog) ---------------- */

const prazno = () => () => {};
function useKlijent() {
  return useSyncExternalStore(prazno, () => true, () => false);
}

function useDesktop() {
  return useSyncExternalStore(
    (f) => {
      const m = window.matchMedia("(min-width: 768px)");
      m.addEventListener("change", f);
      return () => m.removeEventListener("change", f);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
}

/*
 * Zaključavanje pomicanja stranice dok je ploča otvorena. Broji se koliko je ploča otvoreno
 * (potvrda preko obrasca), pa se pomicanje vraća tek kad se zatvori zadnja – prije je
 * redoslijed zatvaranja znao ostaviti stranicu zaključanu.
 */
let otvorenihPloca = 0;
const postaviZakljucavanje = () => {
  document.body.style.overflow = otvorenihPloca > 0 ? "hidden" : "";
};
if (typeof window !== "undefined") {
  // Sigurnost: kod povratka u aplikaciju bez otvorene ploče stranica se uvijek može pomicati.
  const provjeri = () => {
    if (document.visibilityState !== "visible") return;
    if (!document.querySelector('[role="dialog"][aria-modal]')) otvorenihPloca = 0;
    postaviZakljucavanje();
  };
  document.addEventListener("visibilitychange", provjeri);
  window.addEventListener("pageshow", provjeri);
}

export function Ploca({
  otvorena,
  zatvori,
  naslov,
  podnaslov,
  children,
  podnozje,
  sirina = 560,
}: {
  otvorena: boolean;
  zatvori: () => void;
  naslov: ReactNode;
  podnaslov?: ReactNode;
  children: ReactNode;
  podnozje?: ReactNode;
  sirina?: number;
}) {
  const klijent = useKlijent();
  const desktop = useDesktop();
  const kontrole = useDragControls();
  const y = useMotionValue(0);
  const prozirnost = useTransform(y, [0, 400], [1, 0]);
  // Ako animacija zatvaranja zapne (npr. povlačenje i zatvaranje u istom dodiru na nekim
  // Android mobitelima), ploča se nakon kratkog vremena ipak ukloni – inače ostane „mrtva”
  // preko aplikacije i ne reagira ni na X ni na tipku natrag.
  const [ugasena, setUgasena] = useState(!otvorena);
  if (otvorena && ugasena) setUgasena(false);
  useEffect(() => {
    if (otvorena) return;
    y.stop();
    const t = setTimeout(() => setUgasena(true), 700);
    return () => clearTimeout(t);
  }, [otvorena, y]);

  useEffect(() => {
    if (!otvorena) return;
    otvorenihPloca++;
    postaviZakljucavanje();
    return () => {
      otvorenihPloca = Math.max(0, otvorenihPloca - 1);
      postaviZakljucavanje();
    };
  }, [otvorena]);

  useEffect(() => {
    if (!otvorena) return;
    const tipka = (e: KeyboardEvent) => e.key === "Escape" && zatvori();
    window.addEventListener("keydown", tipka);
    return () => window.removeEventListener("keydown", tipka);
  }, [otvorena, zatvori]);

  if (!klijent || ugasena) return null;

  return createPortal(
    <AnimatePresence>
      {otvorena && (
        <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={desktop ? undefined : { opacity: prozirnost }}
            onClick={zatvori}
          />
          <motion.div
            role="dialog"
            aria-modal
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] md:rounded-[28px] border border-rub bg-povrsina shadow-jaka"
            style={{ maxWidth: desktop ? sirina : undefined, y: desktop ? undefined : y }}
            initial={desktop ? { opacity: 0, scale: 0.94, y: 16 } : { y: "100%" }}
            animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { opacity: 0, scale: 0.96, y: 10 } : { y: "100%" }}
            transition={mekaOpruga}
            drag={desktop ? false : "y"}
            dragListener={false}
            dragControls={kontrole}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onDragEnd={(_, i) => {
              if (i.offset.y > 120 || i.velocity.y > 600) zatvori();
              else animate(y, 0, opruga);
            }}
          >
            <div
              className="shrink-0 touch-none cursor-grab active:cursor-grabbing px-5 pt-3 pb-3 md:pt-5"
              // Povlačenje prema dolje samo za zaglavlje, ne kad se dodirne gumb (X).
              onPointerDown={(e) => !desktop && !(e.target as HTMLElement).closest("button") && kontrole.start(e)}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-rub-jaki md:hidden" />
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[22px] leading-tight font-semibold tracking-tight">
                    {naslov}
                  </h2>
                  {podnaslov && <p className="mt-0.5 text-sm text-tekst-2">{podnaslov}</p>}
                </div>
                <IkonaGumb ikona="x" oznaka="Zatvori" onClick={zatvori} className="shrink-0" />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
            {podnozje && (
              <div className="shrink-0 border-t border-rub bg-povrsina px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {podnozje}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------------- Ostalo ---------------- */

export function Naslov({
  natpis,
  naslov,
  opis,
  akcija,
}: {
  natpis?: string;
  naslov: string;
  opis?: ReactNode;
  akcija?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-wrap items-end gap-4"
    >
      <div className="min-w-0 flex-1">
        {natpis && (
          <div className="mb-1 text-[12px] font-semibold tracking-[0.16em] text-naglasak uppercase">
            {natpis}
          </div>
        )}
        <h1 className="font-display text-[30px] md:text-[38px] leading-[1.05] font-semibold tracking-tight">
          {naslov}
        </h1>
        {opis && <p className="mt-2 max-w-2xl text-[15px] text-tekst-2">{opis}</p>}
      </div>
      {akcija}
    </motion.div>
  );
}

export function PraznoStanje({
  ikona,
  naslov,
  opis,
  akcija,
}: {
  ikona: ImeIkone;
  naslov: string;
  opis: string;
  akcija?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={mekaOpruga}
      className="kartica flex flex-col items-center px-6 py-12 text-center"
    >
      <div className="relative mb-4 grid size-16 place-items-center rounded-2xl bg-naglasak-meki text-naglasak">
        <Ikona ime={ikona} velicina={28} />
      </div>
      <h3 className="font-display text-xl font-semibold">{naslov}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-tekst-2">{opis}</p>
      {akcija && <div className="mt-5">{akcija}</div>}
    </motion.div>
  );
}

export function Znacka({
  children,
  boja,
  className,
}: {
  children: ReactNode;
  boja?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border border-rub bg-povrsina-2 px-2.5 py-0.5 text-[12px] font-medium text-tekst-2",
        className,
      )}
    >
      {boja && <span className="size-1.5 rounded-full" style={{ background: boja }} />}
      {children}
    </span>
  );
}

export function Brojac({ vrijednost, decimale = 0 }: { vrijednost: number; decimale?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prethodna = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kontrola = animate(prethodna.current, vrijednost, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = v.toLocaleString("hr-HR", {
          maximumFractionDigits: decimale,
          minimumFractionDigits: decimale,
        });
      },
    });
    prethodna.current = vrijednost;
    return () => kontrola.stop();
  }, [vrijednost, decimale]);
  return (
    <span ref={ref} className="brojke">
      {(0).toFixed(decimale)}
    </span>
  );
}

export const roditeljListe = {
  skriveno: {},
  vidljivo: { transition: { staggerChildren: 0.025, delayChildren: 0 } },
};

export const djeteListe = {
  skriveno: { opacity: 0, y: 10 },
  vidljivo: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ---------------- Obavijesti ---------------- */

interface Obavijest {
  id: number;
  tekst: string;
  vrsta: "uspjeh" | "info" | "greska";
  akcija?: { oznaka: string; radnja: () => void };
}

let obavijesti: Obavijest[] = [];
const pretplatnici = new Set<() => void>();
const emitiraj = () => pretplatnici.forEach((f) => f());

export function obavijesti_(
  tekst: string,
  vrsta: Obavijest["vrsta"] = "uspjeh",
  akcija?: Obavijest["akcija"],
) {
  const id = Date.now() + Math.random();
  obavijesti = [...obavijesti, { id, tekst, vrsta, akcija }].slice(-3);
  emitiraj();
  setTimeout(() => {
    obavijesti = obavijesti.filter((o) => o.id !== id);
    emitiraj();
  }, akcija ? 5500 : 3200);
}

export { obavijesti_ as obavijest };

export function Obavijesti() {
  const lista = useSyncExternalStore(
    (f) => {
      pretplatnici.add(f);
      return () => pretplatnici.delete(f);
    },
    () => obavijesti,
    () => obavijesti,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[3000] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {lista.map((o) => (
          <motion.div
            key={o.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.94, transition: { duration: 0.18 } }}
            transition={opruga}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-rub-jaki bg-povrsina/95 py-2.5 pr-2.5 pl-3.5 text-sm shadow-jaka backdrop-blur-xl"
          >
            <span
              className={cx(
                "grid size-6 place-items-center rounded-full",
                o.vrsta === "uspjeh" && "bg-mahovina-meka text-mahovina",
                o.vrsta === "info" && "bg-naglasak-meki text-naglasak",
                o.vrsta === "greska" && "bg-opasnost-meka text-opasnost",
              )}
            >
              <Ikona
                ime={o.vrsta === "greska" ? "upozorenje" : o.vrsta === "info" ? "sat" : "kvacica"}
                velicina={14}
                debljina={2.4}
              />
            </span>
            <span className="pr-1">{o.tekst}</span>
            {o.akcija && (
              <button
                onClick={() => {
                  o.akcija!.radnja();
                  obavijesti = obavijesti.filter((x) => x.id !== o.id);
                  emitiraj();
                }}
                className="rounded-lg bg-povrsina-3 px-2.5 py-1 text-[13px] font-semibold text-naglasak"
              >
                {o.akcija.oznaka}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Potvrda ---------------- */

export function usePotvrda() {
  const [stanje, setStanje] = useState<{
    naslov: string;
    opis: string;
    potvrdi: () => void;
    gumb?: { oznaka: string; ikona: ImeIkone; vrsta: VrstaGumba };
  } | null>(null);
  const element = (
    <Ploca
      otvorena={!!stanje}
      zatvori={() => setStanje(null)}
      naslov={stanje?.naslov ?? ""}
      sirina={420}
      podnozje={
        <div className="flex gap-2">
          <Gumb className="flex-1" onClick={() => setStanje(null)}>
            Odustani
          </Gumb>
          <Gumb
            vrsta={stanje?.gumb?.vrsta ?? "opasni"}
            ikona={stanje?.gumb?.ikona ?? "smece"}
            className="flex-1"
            onClick={() => {
              stanje?.potvrdi();
              setStanje(null);
            }}
          >
            {stanje?.gumb?.oznaka ?? "Obriši"}
          </Gumb>
        </div>
      }
    >
      <p className="text-[15px] text-tekst-2">{stanje?.opis}</p>
    </Ploca>
  );
  return {
    pitaj: (naslov: string, opis: string, potvrdi: () => void, gumb?: { oznaka: string; ikona: ImeIkone; vrsta: VrstaGumba }) =>
      setStanje({ naslov, opis, potvrdi, gumb }),
    element,
  };
}
