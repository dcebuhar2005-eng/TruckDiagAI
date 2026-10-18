"use client";

import { useEffect } from "react";
import { zabiljeziGresku } from "@/lib/greske";

/** Stranica se srušila: zapisuje se u dnevnik grešaka, a lovac može pokušati ponovno. */
export default function Greska({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    zabiljeziGresku({ vrsta: "stranica", poruka: error.message, stog: error.stack, podaci: { digest: error.digest } });
  }, [error]);

  return (
    <div className="mx-auto grid min-h-[60dvh] max-w-md place-items-center px-6 text-center">
      <div>
        <h2 className="font-display text-[24px] font-semibold">Nešto je pošlo krivo</h2>
        <p className="mt-2 text-[15px] text-tekst-2">Greška je zabilježena i popravit ćemo je. Vaši podaci su sigurni na uređaju.</p>
        <button onClick={() => unstable_retry()} className="mt-5 rounded-xl bg-naglasak px-5 py-3 font-semibold text-[#17130a]">
          Pokušaj ponovno
        </button>
      </div>
    </div>
  );
}
