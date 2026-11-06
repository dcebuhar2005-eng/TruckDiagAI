import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";

export const ZLATO = "#e8a947";
export const POZ = "#0b100c";
export const TEKST = "#e8eee4";

export const Fontovi = () => (
  <style>{`
@font-face{font-family:Disp;src:url(${staticFile("InterDisplay-Black.otf")});font-weight:900}
@font-face{font-family:Disp;src:url(${staticFile("InterDisplay-Bold.otf")});font-weight:700}
@font-face{font-family:Txt;src:url(${staticFile("Inter-SemiBold.otf")});font-weight:600}
@font-face{font-family:Txt;src:url(${staticFile("Inter-Medium.otf")});font-weight:500}
@font-face{font-family:Serif;src:url(${staticFile("fr-lat.woff2")});font-weight:100 900}
`}</style>
);

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const k = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Pozadina: tamna šuma, zlatni sjaj koji polako putuje, vinjeta, zrno. */
export const Pozadina: React.FC<{ sjaj?: number }> = ({ sjaj = 1 }) => {
  const f = useCurrentFrame();
  const x = 50 + Math.sin(f / 70) * 18;
  const y = 38 + Math.cos(f / 90) * 10;
  return (
    <AbsoluteFill style={{ background: POZ }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, rgba(232,169,71,${0.22 * sjaj}) 0%, rgba(232,169,71,0) 45%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(79,122,58,.28), transparent 55%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.65) 100%)" }} />
      <Zrno />
    </AbsoluteFill>
  );
};

export const Zrno = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07,
        mixBlendMode: "overlay",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='${f % 7}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
      }}
    />
  );
};

/** Riječ po riječ: svaka izlazi odozdo s blagim zamućenjem. */
export const Rijeci: React.FC<{ tekst: string; od: number; korak?: number; style?: React.CSSProperties; zlatne?: string[] }> = ({ tekst, od, korak = 4, style, zlatne = [] }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.28em", ...style }}>
      {tekst.split(" ").map((r, i) => {
        const p = k(f, od + i * korak, od + i * korak + 14);
        return (
          <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 8}px)`, color: zlatne.includes(r) ? ZLATO : undefined }}>
            {r}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- 1. UDICA: noćna kamera ---------- */
const Udica = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 78], [1.0, 1.12]);
  const bljesak = interpolate(f, [0, 3, 10], [1, 0.6, 0], { extrapolateRight: "clamp" });
  const ul = k(f, 0, 12);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* zamućena pozadina iz iste snimke */}
      <AbsoluteFill style={{ transform: `scale(${1.6 + f / 400})` }}>
        <Img src={staticFile("vepar_kadar.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "45% 40%", filter: "blur(40px) brightness(.45)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,.8) 100%)" }} />
      {/* ekran kamere */}
      <div style={{ position: "absolute", top: 330, left: 40, right: 40, height: 1000 * 0.62, borderRadius: 36, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.8), 0 0 0 2px rgba(255,255,255,.12)", opacity: ul, transform: `scale(${0.94 + ul * 0.06})` }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "48% 60%" }}>
          <Img src={staticFile("vepar_kadar.jpg")} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${(560 / 500) * 100}%`, objectFit: "cover", objectPosition: "top", filter: "contrast(1.2) brightness(1.05)" }} />
        </div>
        <Zrno />
        <div style={{ position: "absolute", top: 28, left: 32, display: "flex", alignItems: "center", gap: 14, fontFamily: "Txt", fontWeight: 600, fontSize: 34, color: "#fff", letterSpacing: 2, textShadow: "0 2px 8px #000" }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: "#ff3b30", opacity: Math.floor(f / 12) % 2 ? 0.25 : 1 }} />
          REC · KAMERA 2
        </div>
        <div style={{ position: "absolute", bottom: 26, left: 32, right: 32, display: "flex", justifyContent: "space-between", fontFamily: "Txt", fontWeight: 600, fontSize: 32, color: "#fff", letterSpacing: 2, textShadow: "0 2px 8px #000" }}>
          <span>26.10.  02:47</span>
          <span>7 °C</span>
        </div>
        {/* okvir za fokus */}
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", width: 60, height: 60, left: x ? undefined : "26%", right: x ? "22%" : undefined, top: y ? undefined : "34%", bottom: y ? "16%" : undefined, borderColor: ZLATO, borderStyle: "solid", borderWidth: `${y ? 0 : 5}px ${x ? 5 : 0}px ${y ? 5 : 0}px ${x ? 0 : 5}px`, opacity: k(f, 14, 24) }} />
        ))}
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 }}>
        <Rijeci tekst="Vepar je opet došao." od={10} style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 104, color: "#fff", lineHeight: 1.05, padding: "0 60px" }} />
        <div style={{ height: 24 }} />
        <Rijeci tekst="Jesi li zapisao kad?" od={36} zlatne={["kad?"]} style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 72, color: TEKST }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: bljesak * 0.35 }} />
    </AbsoluteFill>
  );
};

/* ---------- 2. PROBLEM ---------- */
const Problem = () => {
  const f = useCurrentFrame();
  const stvari = ["Bilježnica.", "Poruke u grupi.", "Pamćenje."];
  const sve = k(f, 58, 72);
  return (
    <AbsoluteFill>
      <Pozadina sjaj={0.5} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 34 }}>
        {stvari.map((s, i) => {
          const ul = k(f, i * 9, i * 9 + 12);
          const crta = k(f, 30 + i * 6, 42 + i * 6);
          return (
            <div key={s} style={{ position: "relative", fontFamily: "Disp", fontWeight: 700, fontSize: 92, color: TEKST, opacity: ul * (1 - crta * 0.6) * (1 - sve), transform: `translateX(${(1 - ul) * -60}px)` }}>
              {s}
              <div style={{ position: "absolute", left: -10, right: -10, top: "54%", height: 10, borderRadius: 5, background: "#d9534f", transform: `scaleX(${crta})`, transformOrigin: "left" }} />
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 120, color: TEKST, opacity: sve, transform: `scale(${0.9 + sve * 0.1})`, textAlign: "center", lineHeight: 1.05 }}>
          Postoji<br />
          <span style={{ color: ZLATO, fontStyle: "italic" }}>bolji način.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 3. LOGO ---------- */
const Logo = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14, mass: 0.8 } });
  const prsten = k(f, 0, 30);
  const ime = "CroLovac";
  return (
    <AbsoluteFill>
      <Pozadina sjaj={1.3} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", width: 380, height: 380, transform: `scale(${s})` }}>
          <div style={{ position: "absolute", inset: -40, borderRadius: "50%", border: `3px solid ${ZLATO}`, opacity: (1 - prsten) * 0.9, transform: `scale(${0.8 + prsten * 0.6})` }} />
          <div style={{ position: "absolute", inset: -90, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,169,71,.45), transparent 65%)" }} />
          <Img src={staticFile("icon-512.png")} style={{ position: "absolute", inset: 0, width: 380, height: 380, borderRadius: 90, boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
        </div>
        <div style={{ height: 70 }} />
        <div style={{ display: "flex", fontFamily: "Serif", fontWeight: 700, fontSize: 150, color: TEKST, letterSpacing: -2 }}>
          {ime.split("").map((c, i) => {
            const p = k(f, 10 + i * 2.2, 26 + i * 2.2);
            return (
              <span key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: i < 3 ? ZLATO : TEKST }}>
                {c}
              </span>
            );
          })}
        </div>
        <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 50, color: "#a5b2a2", opacity: k(f, 38, 54), marginTop: 10, letterSpacing: 1 }}>
          Lovački dnevnik u tvom džepu
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- 4. FUNKCIJE U MOBITELU ---------- */
const EKRANI = [
  { slika: "3-karta.png", naslov: "Sve čeke na karti", pod: "Hranilišta, solišta i tragovi – i bez signala" },
  { slika: "1-pregled.png", naslov: "Vjetar za svaku čeku", pod: "Znaš na koju sjesti prije nego kreneš" },
  { slika: "2-dnevnik.png", naslov: "Svaki izlazak zapisan", pod: "Odstrel, opažanja, prihrana, dolasci s kamere" },
  { slika: "4-lovci.png", naslov: "Znaš gdje su prijatelji", pod: "Alarm kad je drugi lovac blizu · SOS" },
];
const TRAJ = 75;

const Mobitel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ul = spring({ frame: f, fps, config: { damping: 16 } });
  const rotY = interpolate(f, [0, 300], [-14, 10]);
  const rotX = 6 + Math.sin(f / 40) * 1.5;
  const lebdi = Math.sin(f / 30) * 10;
  return (
    <div style={{ perspective: 2400, position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 640,
          height: 1316,
          borderRadius: 86,
          padding: 22,
          background: "linear-gradient(145deg,#2b302c,#0d0f0d 40%,#1d211e)",
          boxShadow: "0 0 0 3px #3a403b, 0 60px 120px rgba(0,0,0,.7), 0 0 120px rgba(232,169,71,.18)",
          transform: `translateY(${(1 - ul) * 900 + lebdi}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 66, overflow: "hidden", background: "#000" }}>
          {children}
          <div style={{ position: "absolute", top: 20, left: "50%", width: 150, height: 42, marginLeft: -75, borderRadius: 21, background: "#000" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, transparent 35%)", pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
};

const Funkcije = () => {
  const f = useCurrentFrame();
  const i = Math.min(EKRANI.length - 1, Math.floor(f / TRAJ));
  return (
    <AbsoluteFill>
      <Pozadina />
      <Mobitel>
        {EKRANI.map((e, j) => {
          const lok = f - j * TRAJ;
          const ul = k(lok, 0, 14);
          const sc = interpolate(lok, [0, TRAJ], [1.0, 1.05]);
          if (lok < -2 || lok > TRAJ + 16) return null;
          return (
            <div key={j} style={{ position: "absolute", inset: 0, transform: `translateX(${j === 0 ? 0 : (1 - ul) * 100}%)` }}>
              <Img src={staticFile(e.slika)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transform: `scale(${sc})`, transformOrigin: "50% 0%" }} />
            </div>
          );
        })}
      </Mobitel>
      {/* natpis */}
      {EKRANI.map((e, j) => {
        const lok = f - j * TRAJ;
        const ul = k(lok, 4, 18);
        const iz = k(lok, TRAJ - 10, TRAJ);
        if (lok < 0 || lok > TRAJ) return null;
        return (
          <div key={j} style={{ position: "absolute", top: 150, left: 60, right: 60, textAlign: "center", opacity: ul * (1 - iz) }}>
            <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 34, letterSpacing: 6, color: ZLATO, marginBottom: 14 }}>
              0{j + 1} / 0{EKRANI.length}
            </div>
            <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 92, color: TEKST, lineHeight: 1.02, transform: `translateY(${(1 - ul) * 30}px)` }}>{e.naslov}</div>
            <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 40, color: "#a5b2a2", marginTop: 18, transform: `translateY(${(1 - ul) * 20}px)` }}>{e.pod}</div>
          </div>
        );
      })}
      {/* indikator */}
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
        {EKRANI.map((_, j) => (
          <div key={j} style={{ width: j === i ? 60 : 16, height: 16, borderRadius: 8, background: j === i ? ZLATO : "rgba(232,238,228,.25)" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 5. POZIV ---------- */
const Poziv = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 14, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Pozadina sjaj={1.2} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 210, height: 210, borderRadius: 50, opacity: k(f, 0, 12), boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} />
        <div style={{ height: 50 }} />
        <Rijeci tekst="Besplatno." od={4} style={{ fontFamily: "Serif", fontWeight: 700, fontSize: 170, color: TEKST, letterSpacing: -3 }} />
        <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 46, color: "#a5b2a2", marginTop: 6, opacity: k(f, 12, 26) }}>Za sve lovce u Hrvatskoj</div>
        <div style={{ height: 80 }} />
        <div style={{ transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 26, background: "#000", border: "2px solid #5f6368", borderRadius: 28, padding: "26px 54px" }}>
          <svg width="74" height="82" viewBox="0 0 30 33">
            <path d="M1.2.6 17 16.5 1.2 32.4C.6 32 .3 31.4.3 30.6V2.4c0-.8.3-1.4.9-1.8Z" fill="#00d7fe" />
            <path d="M22.3 21.8 17 16.5l5.3-5.3 6.4 3.6c1.8 1 1.8 2.7 0 3.7l-6.4 3.3Z" fill="#ffce00" />
            <path d="M22.3 21.8 17 16.5 1.2 32.4c.6.5 1.5.6 2.6 0l18.5-10.6Z" fill="#ff3a44" />
            <path d="M22.3 11.2 3.8.7C2.7.1 1.8.1 1.2.6L17 16.5l5.3-5.3Z" fill="#00f076" />
          </svg>
          <div style={{ textAlign: "left", color: "#fff" }}>
            <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 30, letterSpacing: 1 }}>PREUZMI NA</div>
            <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 62, lineHeight: 1 }}>Google Play</div>
          </div>
        </div>
        <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 64, color: ZLATO, marginTop: 60, opacity: k(f, 24, 40), letterSpacing: 1 }}>crolovac.com</div>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 52, color: "#a5b2a2", marginTop: 36, opacity: k(f, 44, 60) }}>Lovu mir! 🦌</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Prijelaz: kratki zlatni potez preko ekrana. */
const Potez: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 12], [-120, 120], { extrapolateRight: "clamp", easing: ease });
  return <AbsoluteFill style={{ background: `linear-gradient(100deg, transparent ${x + 35}%, rgba(232,169,71,.35) ${x + 50}%, transparent ${x + 65}%)`, pointerEvents: "none" }} />;
};

export const Reklama = () => {
  const f = useCurrentFrame();
  const glasnoca = interpolate(f, [0, 10, 620, 660], [0, 0.9, 0.9, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: POZ }}>
      <Fontovi />
      <Audio src={staticFile("glazba_chill.wav")} loop volume={glasnoca} />
      <Sequence durationInFrames={78}><Udica /></Sequence>
      <Sequence from={75} durationInFrames={93}><Problem /></Sequence>
      <Sequence from={165} durationInFrames={93}><Logo /></Sequence>
      <Sequence from={255} durationInFrames={303}><Funkcije /></Sequence>
      <Sequence from={555} durationInFrames={105}><Poziv /></Sequence>
      {[75, 165, 255, 555].map((t) => (
        <Sequence key={t} from={t - 4} durationInFrames={14}><Potez /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
