import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontovi, Zrno, ZLATO, k } from "./Reklama";

const T = "#e8eee4";
// Meme tekst: bijeli, debeli, s crnim obrubom (sigurna zona TikToka: y 250–1450, x < 960)
const meme: React.CSSProperties = { fontFamily: "Disp", fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.08, paintOrder: "stroke fill", WebkitTextStroke: "14px #000", letterSpacing: -0.5 };

const Poz: React.FC<{ boja?: string }> = ({ boja = "#0d130e" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #1d2a1f 0%, ${boja} 70%)` }}>
    <Zrno />
  </AbsoluteFill>
);

const Ulaz: React.FC<{ od?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ od = 0, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - od, fps, config: { damping: 11, mass: 0.7 } });
  return <div style={{ transform: `scale(${0.6 + s * 0.4}) rotate(${(1 - s) * -4}deg)`, opacity: Math.min(1, s * 1.6), ...style }}>{children}</div>;
};

/** Tekst gore + veliki emoji. */
const Scena: React.FC<{ tekst: string; emoji?: string; mali?: string; od?: number }> = ({ tekst, emoji, mali }) => (
  <AbsoluteFill>
    <Poz />
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, paddingLeft: 70, paddingRight: 130 }}>
      <Ulaz>
        <div style={{ ...meme, fontSize: 82 }}>{tekst}</div>
      </Ulaz>
      {mali && (
        <Ulaz od={10}>
          <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 44, color: "#cfd8cc", textAlign: "center", marginTop: 26 }}>{mali}</div>
        </Ulaz>
      )}
      {emoji && (
        <Ulaz od={8} style={{ marginTop: 60 }}>
          <div style={{ fontSize: 240, lineHeight: 1 }}>{emoji}</div>
        </Ulaz>
      )}
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Chat mjehurići (odgovori u grupi). */
const Chat: React.FC<{ naslov: string; poruke: [string, string][] }> = ({ naslov, poruke }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Poz />
      <AbsoluteFill style={{ paddingTop: 260, paddingLeft: 60, paddingRight: 130 }}>
        <div style={{ ...meme, fontSize: 64, marginBottom: 40 }}>{naslov}</div>
        {poruke.map(([ime, txt], i) => {
          const p = k(f, 12 + i * 14, 24 + i * 14);
          return (
            <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, marginBottom: 22, maxWidth: 760, alignSelf: "flex-start" }}>
              <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 26, color: ["#8cbf6e", "#7aa7d6", "#e0a63a", "#e07a4f"][i % 4], margin: "0 0 6px 18px" }}>{ime}</div>
              <div style={{ display: "inline-block", background: "#202c22", borderRadius: "28px 28px 28px 8px", padding: "20px 28px", fontFamily: "Txt", fontWeight: 500, fontSize: 40, color: T }}>{txt}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Ekran aplikacije u mobitelu, s natpisom gore i zumom na dio. */
const Ekran: React.FC<{ slika: string; natpis: string; zum?: [number, number, number]; oznaka?: { x: number; y: number; w: number; h: number } }> = ({ slika, natpis, zum = [1, 50, 30], oznaka }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ul = spring({ frame: f, fps, config: { damping: 15 } });
  const z = interpolate(f, [10, 45], [1, zum[0]], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = 600;
  const h = w * (2340 / 1080);
  return (
    <AbsoluteFill>
      <Poz />
      <div style={{ position: "absolute", top: 230, left: 60, right: 130 }}>
        <div style={{ ...meme, fontSize: 64 }}>{natpis}</div>
      </div>
      <div style={{ position: "absolute", left: (1080 - 120 - w) / 2, top: 470, width: w, height: 1000, transform: `translateY(${(1 - ul) * 900}px)` }}>
        <div style={{ width: w, height: h, borderRadius: 70, padding: 16, background: "linear-gradient(145deg,#2f3530,#0d0f0d 40%,#1d211e)", boxShadow: "0 0 0 3px #3a403b, 0 50px 100px rgba(0,0,0,.7), 0 0 120px rgba(232,169,71,.22)" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 56, overflow: "hidden" }}>
            <Img src={staticFile(slika)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transform: `scale(${z})`, transformOrigin: `${zum[1]}% ${zum[2]}%` }} />
            {oznaka && (
              <div
                style={{
                  position: "absolute",
                  left: `${oznaka.x}%`,
                  top: `${oznaka.y}%`,
                  width: `${oznaka.w}%`,
                  height: `${oznaka.h}%`,
                  border: `6px solid ${ZLATO}`,
                  borderRadius: 26,
                  boxShadow: "0 0 30px rgba(232,169,71,.8)",
                  opacity: k(f, 40, 50) * (0.75 + 0.25 * Math.sin(f / 4)),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Split: prije / sada. */
const Split: React.FC<{ gore: [string, string, string]; dolje: [string, string, string] }> = ({ gore, dolje }) => {
  const f = useCurrentFrame();
  const a = k(f, 0, 10);
  const b = k(f, 30, 42);
  const Blok = ({ d, p, boja }: { d: [string, string, string]; p: number; boja: string }) => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 36, padding: "0 130px 0 70px", opacity: p, transform: `translateX(${(1 - p) * -80}px)`, background: boja }}>
      <div style={{ fontSize: 190 }}>{d[1]}</div>
      <div>
        <div style={{ ...meme, fontSize: 76, textAlign: "left", WebkitTextStroke: "10px #000" }}>{d[0]}</div>
        <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 38, color: "#d6ddd2", marginTop: 14 }}>{d[2]}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ flexDirection: "column", background: "#0d130e", paddingTop: 220, paddingBottom: 420 }}>
      <Blok d={gore} p={a} boja="linear-gradient(90deg, rgba(120,90,60,.25), transparent)" />
      <div style={{ height: 6, background: ZLATO, margin: "0 130px 0 70px", opacity: b }} />
      <Blok d={dolje} p={b} boja="linear-gradient(90deg, rgba(232,169,71,.18), transparent)" />
    </AbsoluteFill>
  );
};

const Slika: React.FC<{ slika: string; tekst: string; dolje?: string }> = ({ slika, tekst, dolje }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.6 + f / 300})` }}>
        <Img src={staticFile(slika)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(.4)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 560, left: 30, right: 30, height: 620, borderRadius: 30, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.8)" }}>
        <Img src={staticFile(slika)} style={{ width: "100%", height: "112%", objectFit: "cover", objectPosition: "top", transform: `scale(${1 + f / 400})` }} />
        <div style={{ position: "absolute", top: 22, left: 26, fontFamily: "Txt", fontWeight: 600, fontSize: 32, color: "#fff", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: "#ff3b30", opacity: Math.floor(f / 10) % 2 ? 0.25 : 1 }} /> REC
        </div>
      </div>
      <div style={{ position: "absolute", top: 260, left: 60, right: 130 }}>
        <Ulaz>
          <div style={{ ...meme, fontSize: 70 }}>{tekst}</div>
        </Ulaz>
      </div>
      {dolje && (
        <div style={{ position: "absolute", top: 1230, left: 60, right: 130 }}>
          <Ulaz od={25}>
            <div style={{ ...meme, fontSize: 64, color: ZLATO }}>{dolje}</div>
          </Ulaz>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Kraj = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Poz />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, paddingRight: 60 }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 170, height: 170, borderRadius: 40, transform: `scale(${s})`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} />
        <div style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 104, color: T, marginTop: 24, opacity: k(f, 5, 15) }}>
          <span style={{ color: ZLATO }}>Cro</span>Lovac
        </div>
        <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 48, color: T, opacity: k(f, 10, 20), marginTop: 4 }}>Besplatno · crolovac.com</div>
        <div style={{ marginTop: 44, background: "#fff", borderRadius: 30, padding: 22, opacity: k(f, 14, 26), transform: `scale(${0.9 + k(f, 14, 26) * 0.1})` }}>
          <Img src={staticFile("qr_tt.svg")} style={{ width: 300, height: 300, display: "block" }} />
        </div>
        <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 34, color: "#cfd8cc", marginTop: 18, opacity: k(f, 18, 30) }}>Skeniraj i preuzmi 👆</div>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 46, color: ZLATO, marginTop: 24, opacity: k(f, 24, 36) }}>Dobra kob! 🍀</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

type Dio = { d: number; el: React.ReactNode };
const Niz: React.FC<{ dijelovi: Dio[] }> = ({ dijelovi }) => {
  const f = useCurrentFrame();
  let t = 0;
  const ukupno = dijelovi.reduce((a, x) => a + x.d, 0);
  const vol = interpolate(f, [0, 6, ukupno - 20, ukupno], [0, 0.8, 0.8, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0d130e" }}>
      <Fontovi />
      <Audio src={staticFile("glazba_chill.wav")} loop volume={vol} />
      {dijelovi.map((x, i) => {
        const od = t;
        t += x.d;
        return (
          <Sequence key={i} from={od} durationInFrames={x.d}>
            {x.el}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const MEMEOVI: Record<string, Dio[]> = {
  srnjak: [
    { d: 105, el: <Chat naslov="Kad u lovačkoj grupi pitaš kad se otvara srnjak:" poruke={[["Joža", "1. 5. sigurno"], ["Stipe", "15. 4. ili tak nekak"], ["Predsjednik LD", "pitaj na skupštini"], ["Mladi", "nikad za tebe 😂"]]} /> },
    { d: 90, el: <Ekran slika="m_kal_srna.png" natpis="Ja s CroLovcem: 😎" zum={[1.25, 30, 55]} oznaka={{ x: 4, y: 59, w: 92, h: 16 }} /> },
    { d: 90, el: <Kraj /> },
  ],
  kolega: [
    { d: 75, el: <Scena tekst="Kolega: „Ma nisam ja na tvojoj čeki, kunem se”" emoji="😇" /> },
    { d: 90, el: <Ekran slika="3-karta.png" natpis="CroLovac uživo: 🤨" zum={[1.6, 63, 30]} /> },
    { d: 50, el: <Scena tekst="Uhvaćen." emoji="📸" /> },
    { d: 90, el: <Kraj /> },
  ],
  nekad: [
    { d: 130, el: <Split gore={["Lovac 1995.", "📓", "bilježnica, olovka, „gdje sam ono stavio čeku?”"]} dolje={["Lovac 2026.", "📱", "čeke, vjetar, odstrel – sve u CroLovcu"]} /> },
    { d: 85, el: <Ekran slika="2-dnevnik.png" natpis="Dnevnik koji se ne zagubi u autu 😅" /> },
    { d: 90, el: <Kraj /> },
  ],
  vjetar: [
    { d: 75, el: <Scena tekst="3 sata na čeki, a vjetar nosi miris ravno divljači" emoji="💨🐗" /> },
    { d: 55, el: <Scena tekst="Divljač:" emoji="👋😂" mali="„vidimo se drugi put”" /> },
    { d: 90, el: <Ekran slika="ik_popis.png" natpis="CroLovac ti kaže PRIJE nego kreneš:" zum={[1.5, 40, 38]} oznaka={{ x: 2, y: 34, w: 96, h: 9 }} /> },
    { d: 90, el: <Kraj /> },
  ],
  vepar: [
    { d: 90, el: <Slika slika="vepar_kadar.jpg" tekst="Vepar na kameri u 02:47…" dolje="…a ja spavam 😴" /> },
    { d: 60, el: <Scena tekst="Sutra navečer:" emoji="🕵️‍♂️" mali="točno znam kad doći" /> },
    { d: 85, el: <Ekran slika="2-dnevnik.png" natpis="Zapiši dolazak divljači u CroLovac 📸" /> },
    { d: 90, el: <Kraj /> },
  ],
};

export const Meme: React.FC<{ ime: string }> = ({ ime }) => <Niz dijelovi={MEMEOVI[ime]} />;
export const trajanje = (ime: string) => MEMEOVI[ime].reduce((a, x) => a + x.d, 0);
