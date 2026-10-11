"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Razdoblje, SuncevaVremena } from "@/lib/astro";
import { sat } from "@/lib/format";
import { cx } from "./ui";

export function FazaMjeseca({ faza, velicina = 56 }: { faza: number; velicina?: number }) {
  const r = 40;
  const c = 50;
  const rx = Math.abs(Math.cos(2 * Math.PI * faza)) * r;
  let d: string;
  if (faza <= 0.5) {
    const sweep = faza < 0.25 ? 0 : 1;
    d = `M${c},${c - r} A${r},${r} 0 0 1 ${c},${c + r} A${rx},${r} 0 0 ${sweep} ${c},${c - r}Z`;
  } else {
    const sweep = faza < 0.75 ? 0 : 1;
    d = `M${c},${c - r} A${r},${r} 0 0 0 ${c},${c + r} A${rx},${r} 0 0 ${sweep} ${c},${c - r}Z`;
  }
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={velicina}
      height={velicina}
      initial={{ rotate: -30, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 14 }}
    >
      <defs>
        <radialGradient id="mj" cx="40%" cy="35%">
          <stop offset="0" stopColor="#fbf3dc" />
          <stop offset="1" stopColor="#d9cba4" />
        </radialGradient>
        <filter id="sjaj">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle cx={c} cy={c} r={r} fill="var(--povrsina-3)" />
      <path d={d} fill="#f6e7b8" opacity="0.5" filter="url(#sjaj)" />
      <path d={d} fill="url(#mj)" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--rub-jaki)" />
    </motion.svg>
  );
}

function useSada(interval = 60000) {
  const [sada, setSada] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSada(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return sada;
}

/** Vremenska traka dana: zora, izlazak, zalazak, sumrak i solunarna razdoblja. */
export function TrakaDana({
  sv,
  razdoblja,
  datum,
}: {
  sv: SuncevaVremena;
  razdoblja: Razdoblje[];
  datum: Date;
}) {
  const sada = useSada();
  const pocetak = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate()).getTime();
  const pos = (d?: Date | null) => (d ? ((d.getTime() - pocetak) / 864e5) * 100 : 0);
  const sadaPos = pos(new Date(sada));
  const danas = sadaPos >= 0 && sadaPos <= 100;

  return (
    <div>
      <div className="relative h-14 overflow-hidden rounded-2xl border border-rub bg-[#0a0f1a]">
        {/* Nebo: noć → sumrak → dan */}
        <div
          className="absolute inset-y-0"
          style={{
            left: `${pos(sv.zora)}%`,
            width: `${pos(sv.sumrak) - pos(sv.zora)}%`,
            background: `linear-gradient(90deg, #3b3a5a, #e7a65b ${((pos(sv.izlazak) - pos(sv.zora)) / (pos(sv.sumrak) - pos(sv.zora))) * 100}%, #8bb8d8 30%, #8bb8d8 70%, #e7905b ${((pos(sv.zalazak) - pos(sv.zora)) / (pos(sv.sumrak) - pos(sv.zora))) * 100}%, #3b3a5a)`,
            opacity: 0.85,
          }}
        />
        {razdoblja.map((r, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
            title={`${r.povod}: ${sat(r.od)}–${sat(r.do)}`}
            className={cx(
              "absolute bottom-0 origin-bottom rounded-t-md",
              r.vrsta === "glavno" ? "h-5 bg-[#f0b75a]" : "h-3 bg-[#f0b75a]/60",
            )}
            style={{ left: `${Math.max(0, pos(r.od))}%`, width: `${Math.min(100, pos(r.do)) - Math.max(0, pos(r.od))}%` }}
          />
        ))}
        {danas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, left: `${sadaPos}%` }}
            className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_white]"
          >
            <div className="absolute -top-0.5 -left-[5px] size-3 rounded-full border-2 border-white bg-[#0a0f1a]" />
          </motion.div>
        )}
      </div>
      <div className="brojke mt-2 flex justify-between text-[11px] text-tekst-3">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{String(h).padStart(2, "0")}h</span>
        ))}
      </div>
    </div>
  );
}
