import type { TipTocke } from "@/lib/types";
import { IKONE_TOCAKA } from "@/lib/ikoneTocaka";

/** Sličica vrste točke (za obojeni krug/kvadrat u popisima). */
export default function ZnakTocke({ tip, velicina = 18 }: { tip: TipTocke; velicina?: number }) {
  return (
    <svg
      width={velicina}
      height={velicina}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: IKONE_TOCAKA[tip] }}
    />
  );
}
