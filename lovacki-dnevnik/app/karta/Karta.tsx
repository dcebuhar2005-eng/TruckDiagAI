"use client";

import dynamic from "next/dynamic";

const KartaPrikaz = dynamic(() => import("./KartaPrikaz"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-povrsina-2">
      <div className="flex flex-col items-center gap-3 text-tekst-3">
        <div className="size-10 animate-spin rounded-full border-2 border-rub-jaki border-t-naglasak" />
        <span className="text-sm">Učitavam kartu…</span>
      </div>
    </div>
  ),
});

export default function Karta() {
  return <KartaPrikaz />;
}
