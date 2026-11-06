import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontovi, Zrno, ZLATO, k } from "./Reklama";

const T = "#e8eee4";
const meme: React.CSSProperties = { fontFamily: "Disp", fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.08, paintOrder: "stroke fill", WebkitTextStroke: "12px #000" };

const PITANJA: { p: string; e: string; obrnuto?: boolean }[] = [
  { p: "Jesi li ikad zaboravio gdje TOČNO stoji čeka?", e: "🤔" },
  { p: "Bilježiš odstrel u bilježnicu koja je već pola mokra?", e: "📓💧" },
  { p: "Jesi li sjeo na čeku, a vjetar nosi miris ravno divljači?", e: "💨🐗" },
  { p: "Znaš li NAPAMET kad se otvara lov na srnjaka?", e: "🦌❓", obrnuto: true },
  { p: "Jesi li u skupnom lovu brinuo gdje su ostali lovci?", e: "📍😬" },
  { p: "Ima li kamera slika koje nikad nisi zapisao?", e: "📸🐗" },
];
const DP = 84; // trajanje jednog pitanja (2,8 s)

const Poz: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1f2d21 0%, #0b100c 72%)" }}>
    <Zrno />
  </AbsoluteFill>
);

const Uvod = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 10 } });
  const s2 = spring({ frame: f - 14, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Poz />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 420, paddingLeft: 60, paddingRight: 130 }}>
        <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 40, letterSpacing: 8, color: ZLATO, opacity: k(f, 0, 8) }}>LOVAČKI KVIZ</div>
        <div style={{ ...meme, fontSize: 120, marginTop: 24, transform: `scale(${0.5 + s * 0.5})` }}>
          Treba li TEBI
          <br />
          <span style={{ color: ZLATO }}>CroLovac?</span>
        </div>
        <div style={{ ...meme, fontSize: 64, marginTop: 60, WebkitTextStroke: "9px #000", transform: `scale(${s2})` }}>Broji koliko puta kažeš DA ✋</div>
        <div style={{ fontSize: 260, marginTop: 60, transform: `rotate(${Math.sin(f / 5) * 8}deg)` }}>🦌</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Pitanje: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = PITANJA[i];
  const ul = spring({ frame: f, fps, config: { damping: 13 } });
  const vrijeme = interpolate(f, [8, DP - 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gumb = (tekst: string, boja: string, d: number) => {
    const s = spring({ frame: f - d, fps, config: { damping: 12 } });
    const puls = tekst === "DA" ? 1 + Math.max(0, Math.sin((f - 40) / 4)) * 0.04 * (f > 40 ? 1 : 0) : 1;
    return (
      <div style={{ flex: 1, transform: `scale(${s * puls})`, background: boja, borderRadius: 34, padding: "48px 0", textAlign: "center", fontFamily: "Disp", fontWeight: 900, fontSize: 92, color: "#11160f", boxShadow: "0 18px 40px rgba(0,0,0,.45)" }}>
        {tekst}
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Poz />
      {/* napredak */}
      <div style={{ position: "absolute", top: 210, left: 70, right: 140, display: "flex", gap: 10 }}>
        {PITANJA.map((_, j) => (
          <div key={j} style={{ flex: 1, height: 12, borderRadius: 6, background: j < i ? ZLATO : j === i ? `linear-gradient(90deg, ${ZLATO} ${(1 - vrijeme) * 100}%, rgba(255,255,255,.15) 0)` : "rgba(255,255,255,.15)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 250, left: 70, fontFamily: "Txt", fontWeight: 600, fontSize: 36, color: "#cfd8cc" }}>
        Pitanje {i + 1}/{PITANJA.length}
      </div>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 400, paddingLeft: 60, paddingRight: 130 }}>
        <div style={{ fontSize: 260, transform: `scale(${ul})` }}>{q.e}</div>
        <div style={{ ...meme, fontSize: 86, marginTop: 40, opacity: ul, transform: `translateY(${(1 - ul) * 40}px)` }}>{q.p}</div>
        <div style={{ display: "flex", gap: 30, width: "100%", marginTop: 90 }}>
          {gumb("DA", "#8cbf6e", 10)}
          {gumb("NE", "#e0675b", 14)}
        </div>
        {q.obrnuto && <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 36, color: ZLATO, marginTop: 30, opacity: k(f, 24, 34) }}>(ovdje se broji NE 😏)</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Rezultat = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const red = (od: number, emoji: string, broj: string, tekst: string, boja: string) => {
    const s = spring({ frame: f - od, fps, config: { damping: 13 } });
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 26, background: "rgba(18,25,19,.92)", border: `3px solid ${boja}`, borderRadius: 30, padding: "36px 34px", transform: `translateX(${(1 - s) * -700}px)`, marginBottom: 24 }}>
        <div style={{ fontSize: 110 }}>{emoji}</div>
        <div>
          <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 60, color: boja }}>{broj}</div>
          <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 44, color: T, marginTop: 4 }}>{tekst}</div>
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Poz />
      <AbsoluteFill style={{ paddingTop: 330, paddingLeft: 60, paddingRight: 130 }}>
        <div style={{ ...meme, fontSize: 96, marginBottom: 50 }}>Koliko DA? 👇</div>
        {red(8, "🫡", "0–1 DA", "Legenda. Ali probaj svejedno 😄", "#8cbf6e")}
        {red(20, "👍", "2–3 DA", "CroLovac bi ti dobro došao", ZLATO)}
        {red(32, "🚨", "4–6 DA", "HITNO ti treba CroLovac!", "#e0675b")}
        <div style={{ ...meme, fontSize: 60, marginTop: 40, color: ZLATO, opacity: k(f, 46, 58), WebkitTextStroke: "8px #000" }}>Napiši u komentar svoj rezultat! 💬</div>
      </AbsoluteFill>
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
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 360, paddingRight: 60 }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 170, height: 170, borderRadius: 40, transform: `scale(${s})` }} />
        <div style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 104, color: T, marginTop: 22, opacity: k(f, 5, 15) }}>
          <span style={{ color: ZLATO }}>Cro</span>Lovac
        </div>
        <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 44, color: T, opacity: k(f, 10, 20), textAlign: "center", lineHeight: 1.25 }}>
          Karta · vjetar · dnevnik · lovni kalendar
          <br />
          <span style={{ color: ZLATO }}>Besplatno · crolovac.com</span>
        </div>
        <div style={{ marginTop: 40, background: "#fff", borderRadius: 30, padding: 22, opacity: k(f, 14, 26) }}>
          <Img src={staticFile("qr_tt.svg")} style={{ width: 340, height: 340, display: "block" }} />
        </div>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 46, color: ZLATO, marginTop: 26, opacity: k(f, 22, 34) }}>Dobra kob! 🍀</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const KVIZ_TRAJANJE = 70 + PITANJA.length * DP + 120 + 100;

export const Kviz = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 6, KVIZ_TRAJANJE - 25, KVIZ_TRAJANJE], [0, 0.75, 0.75, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b100c" }}>
      <Fontovi />
      <Audio src={staticFile("glazba_chill.wav")} loop volume={vol} />
      <Sequence durationInFrames={70}>
        <Uvod />
      </Sequence>
      {PITANJA.map((_, i) => (
        <Sequence key={i} from={70 + i * DP} durationInFrames={DP}>
          <Pitanje i={i} />
        </Sequence>
      ))}
      <Sequence from={70 + PITANJA.length * DP} durationInFrames={120}>
        <Rezultat />
      </Sequence>
      <Sequence from={70 + PITANJA.length * DP + 120} durationInFrames={100}>
        <Kraj />
      </Sequence>
    </AbsoluteFill>
  );
};
