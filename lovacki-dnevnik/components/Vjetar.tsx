"use client";

import { motion } from "framer-motion";

/** Kompas sa strelicom koja pokazuje kamo vjetar nosi miris (niz vjetar). */
export function StrelicaVjetra({ smjer, velicina = 64 }: { smjer?: number; velicina?: number }) {
  const ima = smjer != null;
  return (
    <div className="relative shrink-0" style={{ width: velicina, height: velicina }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 text-tekst-3">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={i}
            x1="50"
            y1="6"
            x2="50"
            y2={i % 4 === 0 ? 13 : 9}
            stroke="currentColor"
            strokeWidth={i % 4 === 0 ? 2 : 1}
            strokeOpacity={i % 4 === 0 ? 0.8 : 0.4}
            transform={`rotate(${i * 22.5} 50 50)`}
          />
        ))}
        <text x="50" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
          S
        </text>
      </svg>
      {ima && (
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 text-naglasak"
          initial={{ rotate: (smjer + 180) % 360 - 90, opacity: 0 }}
          animate={{ rotate: (smjer + 180) % 360, opacity: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 12 }}
        >
          <path d="M50 22 L60 52 L50 46 L40 52 Z" fill="currentColor" />
          <line x1="50" y1="46" x2="50" y2="76" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </motion.svg>
      )}
    </div>
  );
}
