"use client";

import { useEffect, useRef } from "react";

/** Lottie animacije iz /public/animacije (LottieFiles, Lottie Simple License – vidi Izvori i licence). */
export type ImeAnimacije = "spremljeno" | "konfete" | "jelen-linije" | "jelen-hod" | "lokacija" | "prazno" | "upozorenje";

type Lottie = typeof import("lottie-web").default;
let lottie: Promise<Lottie> | null = null;
const ucitajLottie = () => (lottie ??= import("lottie-web/build/player/lottie_light").then((m) => (m.default ?? m) as unknown as Lottie));
const podaci = new Map<string, Promise<unknown>>();
const ucitajPodatke = (ime: string) => {
  if (!podaci.has(ime)) podaci.set(ime, fetch(`/animacije/${ime}.json`).then((r) => r.json()));
  return podaci.get(ime)!;
};

export default function Animacija({
  ime,
  ponavljaj = true,
  className,
  gotovo,
  brzina = 1,
}: {
  ime: ImeAnimacije;
  ponavljaj?: boolean;
  className?: string;
  gotovo?: () => void;
  brzina?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const gotovoRef = useRef(gotovo);
  useEffect(() => {
    gotovoRef.current = gotovo;
  }, [gotovo]);

  useEffect(() => {
    let ziv = true;
    let anim: { destroy: () => void } | null = null;
    const smanji = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Promise.all([ucitajLottie(), ucitajPodatke(ime)])
      .then(([l, data]) => {
        if (!ziv || !ref.current) return;
        const a = l.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: ponavljaj && !smanji,
          autoplay: !smanji,
          animationData: structuredClone(data),
        });
        a.setSpeed(brzina);
        if (smanji) {
          a.goToAndStop(a.totalFrames - 1, true);
          setTimeout(() => gotovoRef.current?.(), 600);
        } else a.addEventListener("complete", () => gotovoRef.current?.());
        anim = a;
      })
      .catch(() => gotovoRef.current?.());
    return () => {
      ziv = false;
      anim?.destroy();
    };
  }, [ime, ponavljaj, brzina]);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
