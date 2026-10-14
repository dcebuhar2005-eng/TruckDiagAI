"use client";

import qrcode from "qrcode-generator";
import { useMemo } from "react";

/** QR kod kao SVG (crni moduli na bijelom, s rubom – da ga kamera lako pročita i u tamnoj temi). */
export default function QrKod({ tekst, velicina = 240, className }: { tekst: string; velicina?: number; className?: string }) {
  const { n, put } = useMemo(() => {
    const q = qrcode(0, "M");
    q.addData(tekst);
    q.make();
    const n = q.getModuleCount();
    let put = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) put += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { n, put };
  }, [tekst]);
  return (
    <svg
      viewBox={`0 0 ${n + 8} ${n + 8}`}
      width={velicina}
      height={velicina}
      className={className}
      role="img"
      aria-label="QR kod"
      shapeRendering="crispEdges"
    >
      <rect width={n + 8} height={n + 8} fill="#fff" />
      <path d={put} fill="#000" />
    </svg>
  );
}
