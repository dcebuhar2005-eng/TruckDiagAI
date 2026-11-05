import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontovi, Pozadina, Rijeci, Zrno, ZLATO, TEKST, k, ease } from "./Reklama";

type Format = "feed" | "story";
type Varijanta = "vepar" | "jelen";
const UDICE: Record<Varijanta, { slika: string; visina: string; datum: string; temp: string; r1: string; r2: string; zlatne: string[]; fokus: string }> = {
  vepar: { slika: "vepar_kadar.jpg", visina: "112%", datum: "26.10.  02:47", temp: "7 °C", r1: "Vepar je opet došao.", r2: "Jesi li zapisao kad?", zlatne: ["kad?"], fokus: "48% 60%" },
  jelen: { slika: "jelen_kadar.jpg", visina: "105.2%", datum: "24.10.  05:14", temp: "6 °C", r1: "Jelen i košute u 05:14.", r2: "Hoćeš li se sjetiti sutra?", zlatne: ["sutra?"], fokus: "45% 55%" },
};
const SIVO = "#a5b2a2";

/* ---------- Udica ---------- */
const Udica: React.FC<{ fmt: Format; v: Varijanta }> = ({ fmt, v }) => {
  const u = UDICE[v];
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const ul = k(f, 0, 10);
  const zoom = interpolate(f, [0, 66], [1, 1.14]);
  const panelTop = fmt === "feed" ? 120 : 330;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${1.7 + f / 300})` }}>
        <Img src={staticFile(u.slika)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(.4)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,.85) 100%)" }} />
      <div style={{ position: "absolute", top: panelTop, left: 40, right: 40, height: 620, borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.8), 0 0 0 2px rgba(255,255,255,.12)", opacity: ul, transform: `scale(${0.95 + ul * 0.05})` }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: u.fokus }}>
          <Img src={staticFile(u.slika)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u.visina, objectFit: "cover", objectPosition: "top", filter: "contrast(1.2) brightness(1.05)" }} />
        </div>
        <Zrno />
        <div style={{ position: "absolute", top: 26, left: 30, display: "flex", alignItems: "center", gap: 14, fontFamily: "Txt", fontWeight: 600, fontSize: 32, color: "#fff", letterSpacing: 2, textShadow: "0 2px 8px #000" }}>
          <span style={{ width: 20, height: 20, borderRadius: 10, background: "#ff3b30", opacity: Math.floor(f / 10) % 2 ? 0.25 : 1 }} />
          REC · KAMERA 2
        </div>
        <div style={{ position: "absolute", bottom: 24, left: 30, right: 30, display: "flex", justifyContent: "space-between", fontFamily: "Txt", fontWeight: 600, fontSize: 30, color: "#fff", letterSpacing: 2, textShadow: "0 2px 8px #000" }}>
          <span>{u.datum}</span>
          <span>{u.temp}</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: panelTop + 680, left: 0, right: 0 }}>
        <Rijeci tekst={u.r1} od={6} korak={3} style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 100, color: "#fff", lineHeight: 1.05, padding: "0 60px" }} />
        <div style={{ height: 18 }} />
        <Rijeci tekst={u.r2} od={24} korak={3} zlatne={u.zlatne} style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 70, color: TEKST }} />
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: interpolate(f, [0, 2, 8], [0.35, 0.25, 0], { extrapolateRight: "clamp" }) }} />
      {height > 0 && null}
    </AbsoluteFill>
  );
};

/* ---------- Funkcije ---------- */
const STAVKE = [
  { slika: "3-karta.png", oznaka: "KARTA LOVIŠTA", naslov: ["Sve čeke", "na karti."], pod: "Hranilišta, solišta i tragovi – radi i bez signala." },
  { slika: "1-pregled.png", oznaka: "VJETAR", naslov: ["Znaš na koju", "čeku sjesti."], pod: "Vjetar i vrijeme za svaku čeku, prije nego kreneš." },
  { slika: "4-lovci.png", oznaka: "SIGURNOST", naslov: ["Znaš gdje su", "prijatelji."], pod: "Alarm kad je drugi lovac blizu. SOS u jednom dodiru." },
];
const T = 90;

const Telefon: React.FC<{ w: number; children: React.ReactNode; rot: number; y: number; style?: React.CSSProperties }> = ({ w, children, rot, y, style }) => {
  const h = w * 2.06;
  return (
    <div style={{ perspective: 2600, position: "absolute", ...style }}>
      <div style={{ width: w, height: h, borderRadius: w * 0.135, padding: w * 0.032, background: "linear-gradient(145deg,#2f3530,#0d0f0d 40%,#1d211e)", boxShadow: "0 0 0 3px #3a403b, 0 60px 120px rgba(0,0,0,.75), 0 0 140px rgba(232,169,71,.22)", transform: `translateY(${y}px) rotateY(${rot}deg) rotateX(4deg)` }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.105, overflow: "hidden", background: "#000" }}>
          {children}
          <div style={{ position: "absolute", top: w * 0.03, left: "50%", width: w * 0.22, height: w * 0.06, marginLeft: -w * 0.11, borderRadius: 30, background: "#000" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.12) 0%, transparent 35%)" }} />
        </div>
      </div>
    </div>
  );
};

const Funkcije: React.FC<{ fmt: Format }> = ({ fmt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.min(STAVKE.length - 1, Math.floor(f / T));
  const ul = spring({ frame: f, fps, config: { damping: 16 } });
  const lebdi = Math.sin(f / 28) * 8;
  const feed = fmt === "feed";
  const w = feed ? 520 : 600;
  const ekrani = STAVKE.map((e, j) => {
    const lok = f - j * T;
    if (lok < -2 || lok > T + 16) return null;
    const p = k(lok, 0, 14);
    return (
      <div key={j} style={{ position: "absolute", inset: 0, transform: `translateX(${j === 0 ? 0 : (1 - p) * 100}%)` }}>
        <Img src={staticFile(e.slika)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transform: `scale(${interpolate(lok, [0, T], [1, 1.04])})`, transformOrigin: "50% 0%" }} />
      </div>
    );
  });
  const tekstovi = STAVKE.map((e, j) => {
    const lok = f - j * T;
    if (lok < 0 || lok > T) return null;
    const a = k(lok, 3, 16);
    const b = k(lok, T - 10, T);
    return (
      <div key={j} style={{ position: "absolute", opacity: a * (1 - b), ...(feed ? { left: 70, top: 300, width: 440 } : { left: 60, right: 60, top: 290, textAlign: "center" as const }) }}>
        <div style={{ display: "inline-block", fontFamily: "Txt", fontWeight: 600, fontSize: 28, letterSpacing: 5, color: "#1b1407", background: ZLATO, borderRadius: 999, padding: "8px 20px", marginBottom: 26 }}>{e.oznaka}</div>
        {e.naslov.map((r, n) => (
          <div key={n} style={{ fontFamily: "Disp", fontWeight: 900, fontSize: feed ? 72 : 96, lineHeight: 1.04, whiteSpace: "nowrap", color: n === 1 ? ZLATO : TEKST, transform: `translateY(${(1 - k(lok, 3 + n * 4, 18 + n * 4)) * 40}px)`, opacity: k(lok, 3 + n * 4, 18 + n * 4) }}>
            {r}
          </div>
        ))}
        <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: feed ? 34 : 40, color: SIVO, marginTop: 26, lineHeight: 1.35, opacity: k(lok, 12, 26) }}>{e.pod}</div>
      </div>
    );
  });
  return (
    <AbsoluteFill>
      <Pozadina />
      {feed ? (
        <Telefon w={w} rot={interpolate(f, [0, 270], [-18, -8])} y={(1 - ul) * 900 + lebdi} style={{ right: 10, top: 150 }}>
          {ekrani}
        </Telefon>
      ) : (
        <Telefon w={w} rot={interpolate(f, [0, 270], [-10, 8])} y={(1 - ul) * 900 + lebdi} style={{ left: (1080 - w) / 2, top: 700 }}>
          {ekrani}
        </Telefon>
      )}
      {feed && <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,16,12,.95) 0%, rgba(11,16,12,.75) 42%, transparent 58%)" }} />}
      {tekstovi}
      <div style={{ position: "absolute", ...(feed ? { left: 70, bottom: 90 } : { left: 0, right: 0, top: 230, justifyContent: "center" }), display: "flex", gap: 12 }}>
        {STAVKE.map((_, j) => (
          <div key={j} style={{ width: j === i ? 54 : 14, height: 14, borderRadius: 7, background: j === i ? ZLATO : "rgba(232,238,228,.25)" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Poziv ---------- */
const GooglePlay: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ transform: `scale(${s})`, display: "inline-flex", alignItems: "center", gap: 24, background: "#000", border: "2px solid #5f6368", borderRadius: 26, padding: "22px 48px" }}>
    <svg width="64" height="70" viewBox="0 0 30 33">
      <path d="M1.2.6 17 16.5 1.2 32.4C.6 32 .3 31.4.3 30.6V2.4c0-.8.3-1.4.9-1.8Z" fill="#00d7fe" />
      <path d="M22.3 21.8 17 16.5l5.3-5.3 6.4 3.6c1.8 1 1.8 2.7 0 3.7l-6.4 3.3Z" fill="#ffce00" />
      <path d="M22.3 21.8 17 16.5 1.2 32.4c.6.5 1.5.6 2.6 0l18.5-10.6Z" fill="#ff3a44" />
      <path d="M22.3 11.2 3.8.7C2.7.1 1.8.1 1.2.6L17 16.5l5.3-5.3Z" fill="#00f076" />
    </svg>
    <div style={{ textAlign: "left", color: "#fff" }}>
      <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 26, letterSpacing: 1 }}>PREUZMI NA</div>
      <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 54, lineHeight: 1 }}>Google Play</div>
    </div>
  </div>
);

const Poziv: React.FC<{ fmt: Format }> = ({ fmt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ikona = spring({ frame: f, fps, config: { damping: 13 } });
  const gumb = spring({ frame: f - 22, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Pozadina sjaj={1.3} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: fmt === "story" ? 120 : 0 }}>
        <div style={{ position: "relative", transform: `scale(${ikona})` }}>
          <div style={{ position: "absolute", inset: -70, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,169,71,.45), transparent 65%)" }} />
          <Img src={staticFile("icon-512.png")} style={{ position: "relative", width: 200, height: 200, borderRadius: 48, boxShadow: "0 24px 60px rgba(0,0,0,.6)" }} />
        </div>
        <div style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 104, color: TEKST, marginTop: 34, opacity: k(f, 6, 18) }}>
          <span style={{ color: ZLATO }}>Cro</span>Lovac
        </div>
        <Rijeci tekst="Besplatno za sve lovce." od={14} korak={3} zlatne={["Besplatno"]} style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 68, color: TEKST, marginTop: 6 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 34, opacity: k(f, 30, 44), fontFamily: "Txt", fontWeight: 600, fontSize: 38, color: SIVO }}>
          🦌 Već <b style={{ color: TEKST }}>450+ lovaca</b> u Hrvatskoj
        </div>
        <div style={{ marginTop: 50 }}>
          <GooglePlay s={Math.max(0, gumb)} />
        </div>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 44, color: SIVO, marginTop: 40, opacity: k(f, 50, 64) }}>Lovu mir!</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Potez = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 12], [-120, 120], { extrapolateRight: "clamp", easing: ease });
  return <AbsoluteFill style={{ background: `linear-gradient(100deg, transparent ${x + 35}%, rgba(232,169,71,.35) ${x + 50}%, transparent ${x + 65}%)` }} />;
};

export const Meta: React.FC<{ fmt: Format; v?: Varijanta }> = ({ fmt, v = "vepar" }) => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 8, 420, 450], [0, 0.9, 0.9, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#0b100c" }}>
      <Fontovi />
      <Audio src={staticFile("glazba_chill.wav")} loop volume={vol} />
      <Sequence durationInFrames={66}><Udica fmt={fmt} v={v} /></Sequence>
      <Sequence from={63} durationInFrames={273}><Funkcije fmt={fmt} /></Sequence>
      <Sequence from={333} durationInFrames={117}><Poziv fmt={fmt} /></Sequence>
      {[63, 333].map((t) => <Sequence key={t} from={t - 4} durationInFrames={14}><Potez /></Sequence>)}
    </AbsoluteFill>
  );
};

/** Statična slika za feed (4:5). */
export const MetaSlika = () => (
  <AbsoluteFill style={{ background: "#0b100c" }}>
    <Fontovi />
    <Pozadina />
    <Telefon w={500} rot={-14} y={0} style={{ right: -30, top: 190 }}>
      <Img src={staticFile("3-karta.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    </Telefon>
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,16,12,.92) 0%, rgba(11,16,12,.6) 45%, transparent 62%)" }} />
    <div style={{ position: "absolute", left: 70, top: 110, width: 520 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 96, height: 96, borderRadius: 24 }} />
        <div style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 64, color: TEKST }}><span style={{ color: ZLATO }}>Cro</span>Lovac</div>
      </div>
      <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 92, lineHeight: 1.0, color: TEKST, marginTop: 70 }}>
        Cijelo lovište<br /><span style={{ color: ZLATO }}>u džepu.</span>
      </div>
      <div style={{ display: "grid", gap: 22, marginTop: 50, fontFamily: "Txt", fontWeight: 600, fontSize: 33, color: TEKST }}>
        {["Čeke i hranilišta na karti", "Vjetar za svaku čeku", "Dnevnik lova i odstrela", "Alarm kad je lovac blizu"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 22, background: "rgba(232,169,71,.16)", color: ZLATO, fontSize: 26 }}>✓</span>
            {t}
          </div>
        ))}
      </div>
    </div>
    <div style={{ position: "absolute", left: 70, bottom: 90 }}>
      <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 34, color: SIVO, marginBottom: 26 }}>
        🦌 Već <b style={{ color: TEKST }}>450+ lovaca</b>
      </div>
      <GooglePlay s={1} />
    </div>
    <div style={{ position: "absolute", right: 60, bottom: 60, background: ZLATO, color: "#1b1407", fontFamily: "Disp", fontWeight: 900, fontSize: 40, borderRadius: 999, padding: "16px 34px", transform: "rotate(-4deg)", boxShadow: "0 16px 40px rgba(0,0,0,.5)" }}>
      BESPLATNO
    </div>
  </AbsoluteFill>
);
