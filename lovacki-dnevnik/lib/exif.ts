// Datum i sat snimanja iz JPEG slike (EXIF). Lovačke kamere ga uglavnom upisuju u DateTimeOriginal,
// pa dolazak divljači ne treba ručno upisivati. Čita se samo početak datoteke.

/** {datum: GGGG-MM-DD, vrijeme: HH:MM} ili undefined ako slika nema EXIF datum. */
export async function datumSnimanja(datoteka: File): Promise<{ datum: string; vrijeme: string } | undefined> {
  try {
    const v = new DataView(await datoteka.slice(0, 256 * 1024).arrayBuffer());
    if (v.getUint16(0) !== 0xffd8) return;
    let o = 2;
    while (o + 4 < v.byteLength) {
      const oznaka = v.getUint16(o);
      const duljina = v.getUint16(o + 2);
      // APP1 s „Exif\0\0”
      if (oznaka === 0xffe1 && v.getUint32(o + 4) === 0x45786966) return izTiffa(v, o + 10);
      if ((oznaka & 0xff00) !== 0xff00) return;
      o += 2 + duljina;
    }
  } catch {}
}

function izTiffa(v: DataView, t: number) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (o: number) => v.getUint16(o, le);
  const u32 = (o: number) => v.getUint32(o, le);
  /** Vrijednost oznake u IFD-u: pomak (za podIFD) ili tekst (ASCII). */
  const trazi = (ifd: number, tag: number) => {
    const n = u16(t + ifd);
    for (let i = 0; i < n; i++) {
      const e = t + ifd + 2 + i * 12;
      if (u16(e) !== tag) continue;
      if (u16(e + 2) === 4) return u32(e + 8);
      const broj = u32(e + 4);
      const poc = broj > 4 ? t + u32(e + 8) : e + 8;
      let s = "";
      for (let k = 0; k < broj - 1; k++) s += String.fromCharCode(v.getUint8(poc + k));
      return s;
    }
  };
  const ifd0 = u32(t + 4);
  const exif = trazi(ifd0, 0x8769);
  const tekst = (typeof exif === "number" ? trazi(exif, 0x9003) : undefined) ?? trazi(ifd0, 0x0132);
  const m = typeof tekst === "string" ? tekst.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/) : null;
  if (!m || m[1] === "0000") return;
  return { datum: `${m[1]}-${m[2]}-${m[3]}`, vrijeme: `${m[4]}:${m[5]}` };
}
