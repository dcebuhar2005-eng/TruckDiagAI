"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { pokreniDrustvo } from "@/lib/drustvo";
import { useBaza } from "@/lib/store";
import Navigacija from "./Navigacija";
import Uvod from "./Uvod";
import Urednici from "./urednici/Urednici";
import { Obavijesti } from "./ui";

export default function Ljuska({ children }: { children: ReactNode }) {
  const baza = useBaza();
  const tema = baza?.postavke.tema;

  useEffect(() => {
    pokreniDrustvo();
  }, []);

  useEffect(() => {
    if (!tema) return;
    const primijeni = () => {
      const t =
        tema === "auto"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "tamna"
            : "svijetla"
          : tema;
      document.documentElement.dataset.tema = t;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", t === "tamna" ? "#0b100c" : "#f2f0e8");
    };
    primijeni();
    if (tema !== "auto") return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    m.addEventListener("change", primijeni);
    return () => m.removeEventListener("change", primijeni);
  }, [tema]);

  return (
    <>
      <Navigacija />
      <main className="relative z-10 min-h-dvh lg:pl-[248px]">{children}</main>
      <AnimatePresence>{baza && !baza.postavke.dovrsenUvod && <Uvod key="uvod" />}</AnimatePresence>
      <Urednici />
      <Obavijesti />
    </>
  );
}
