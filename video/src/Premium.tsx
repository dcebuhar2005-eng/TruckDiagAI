import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontovi, ZLATO, k } from "./Reklama";

const T = "#e8eee4";

/** Dim: veliki zamućeni oblaci koji polako plove. */
const Dim: React.FC<{ jacina?: number }> = ({ jacina = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {Array.from({ length: 9 }, (_, i) => {
        const x = random(`x${i}`) * 1200 - 200 + Math.sin(f / (90 + i * 13) + i) * 120 + f * (0.25 + random(`v${i}`) * 0.5) * (i % 2 ? 1 : -1);
        const y = 900 + random(`y${i}`) * 1100 + Math.cos(f / (110 + i * 9) + i) * 80 - f * 0.4;
        const s = 520 + random(`s${i}`) * 520;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s * 0.62,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(215,220,210,.3), rgba(215,220,210,0) 70%)",
              filter: "blur(40px)",
              opacity: (0.55 + random(`o${i}`) * 0.45) * jacina,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Snop svjetla odozgo. */
const Snop: React.FC<{ p: number }> = ({ p }) => {
  const f = useCurrentFrame();
  const treptaj = 0.92 + Math.sin(f / 7) * 0.04 + Math.sin(f / 3.1) * 0.02;
  return (
    <AbsoluteFill style={{ opacity: p * treptaj, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: -80,
          width: 1040,
          height: 1700,
          background: "linear-gradient(180deg, rgba(255,240,205,.55) 0%, rgba(255,232,190,.18) 45%, rgba(255,232,190,0) 85%)",
          clipPath: "polygon(41% 0, 59% 0, 100% 100%, 0 100%)",
          filter: "blur(30px)",
        }}
      />
      <div style={{ position: "absolute", left: 540 - 260, top: 1300, width: 520, height: 140, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,235,195,.35), transparent 70%)", filter: "blur(20px)" }} />
    </AbsoluteFill>
  );
};

/** Lišće koje pada (hrastov list, SVG). */
const List: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const kasni = 40 + random(`k${i}`) * 380;
  const t = Math.max(0, f - kasni);
  const x = random(`lx${i}`) * 1080 + Math.sin(t / 22 + i) * 90;
  const y = -120 + t * (2.2 + random(`ly${i}`) * 1.8);
  const rot = t * (2 + random(`lr${i}`) * 3) * (i % 2 ? 1 : -1);
  const vel = 34 + random(`ls${i}`) * 40;
  const blizu = random(`lb${i}`) > 0.85;
  if (y > 2000) return null;
  return (
    <svg
      viewBox="0 0 40 60"
      width={blizu ? vel * 1.8 : vel}
      style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) rotateX(${t * 3}deg)`, filter: blizu ? "blur(3px)" : "none", opacity: blizu ? 0.75 : 0.95 }}
    >
      <path
        d="M20 2c4 6 3 9 7 11s9 1 8 6-5 5-4 9 6 5 4 9-7 2-8 6 2 8-1 10-5 2-6 5c-1-3-3-3-6-5s-1-6-1-10-6-2-8-6 3-5 4-9-3-4-4-9 4-4 8-6S16 8 20 2z"
        fill={i % 3 === 0 ? "#c98a2b" : i % 3 === 1 ? "#e0a63a" : "#a8691f"}
      />
      <path d="M20 8v50" stroke="rgba(60,35,10,.6)" strokeWidth="1.4" />
    </svg>
  );
};

const KARTICE = [
  { e: "🌤️", n: "Kad u lov?", o: "ocjena termina po vremenu i vjetru", s: -1, y: 520 },
  { e: "💨", n: "Zona mirisa", o: "kamo vjetar nosi tvoj miris", s: 1, y: 700 },
  { e: "🗺️", n: "Karta lovišta", o: "čeke i hranilišta, i bez signala", s: -1, y: 900 },
  { e: "📅", n: "Lovni kalendar", o: "što se danas smije loviti", s: 1, y: 1090 },
  { e: "📓", n: "Dnevnik", o: "izlazak zapisan za 10 sekundi", s: -1, y: 520 },
  { e: "🎯", n: "Odstrel", o: "s fotografijama i lokacijom", s: 1, y: 700 },
  { e: "📍", n: "Lovac u blizini", o: "mobitel zavibrira kad je kolega blizu", s: -1, y: 900 },
  { e: "🆘", n: "SOS", o: "112 i koordinate u jednom dodiru", s: 1, y: 1090 },
];

const Kartica: React.FC<{ d: (typeof KARTICE)[number]; od: number; do_: number }> = ({ d, od, do_ }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - od, fps, config: { damping: 13, mass: 0.8 } });
  const iz = k(f, do_ - 10, do_);
  if (f < od || f > do_) return null;
  const lebdi = Math.sin((f + od) / 18) * 8;
  return (
    <div
      style={{
        position: "absolute",
        top: d.y + lebdi,
        ...(d.s < 0 ? { left: 40 } : { right: 150 }),
        width: 400,
        display: "flex",
        gap: 18,
        alignItems: "center",
        padding: "20px 22px",
        borderRadius: 28,
        background: "rgba(14,20,15,.72)",
        border: "2px solid rgba(232,169,71,.55)",
        boxShadow: "0 20px 50px rgba(0,0,0,.55), 0 0 30px rgba(232,169,71,.15)",
        backdropFilter: "blur(10px)",
        transform: `translateX(${(1 - s) * d.s * 140}px) scale(${0.7 + s * 0.3})`,
        opacity: Math.min(1, s * 1.5) * (1 - iz),
      }}
    >
      <div style={{ width: 70, height: 70, borderRadius: 18, background: "rgba(232,169,71,.14)", border: "1.5px solid rgba(232,169,71,.4)", display: "grid", placeItems: "center", fontSize: 40, flex: "none" }}>{d.e}</div>
      <div>
        <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 36, color: T }}>{d.n}</div>
        <div style={{ fontFamily: "Txt", fontWeight: 500, fontSize: 25, color: "#b9c4b5", lineHeight: 1.25, marginTop: 2 }}>{d.o}</div>
      </div>
    </div>
  );
};

const EKRANI = ["3-karta.png", "m_kal_srna.png", "2-dnevnik.png"];

const Mobitel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ul = spring({ frame: f - 10, fps, config: { damping: 18, mass: 1.4 } });
  const upali = k(f, 55, 75);
  const lebdi = Math.sin(f / 26) * 14;
  const rotY = interpolate(f, [0, 420], [-16, 14]) + Math.sin(f / 40) * 3;
  const w = 470;
  const h = w * 2.06;
  // 300–420: pravi ekrani aplikacije
  const ekranIdx = f >= 300 ? Math.min(EKRANI.length - 1, Math.floor((f - 300) / 40)) : -1;
  return (
    <div style={{ position: "absolute", left: (1080 - 120 - w) / 2 + 60, top: 560, perspective: 2200 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 66,
          padding: 14,
          background: "linear-gradient(150deg,#3a403b,#0c0e0c 40%,#262b27)",
          boxShadow: `0 0 0 2px #4a514b, 0 80px 120px rgba(0,0,0,.75), 0 0 ${80 + upali * 80}px rgba(232,169,71,${0.12 + upali * 0.2})`,
          transform: `translateY(${(1 - ul) * 500 + lebdi}px) rotateY(${rotY}deg) rotateX(6deg)`,
          opacity: Math.min(1, ul * 1.4),
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 54, overflow: "hidden", background: "#050705" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #1f5a33 0%, #0e3a1f 55%, #082414 100%)", opacity: upali }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: upali * (ekranIdx >= 0 ? 0 : 1) }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: -40, borderRadius: "50%", border: `3px solid ${ZLATO}`, opacity: 0.5 + Math.sin(f / 10) * 0.2, transform: `scale(${1 + Math.sin(f / 15) * 0.03})` }} />
              <Img src={staticFile("icon-512.png")} style={{ width: 200, height: 200, borderRadius: 46 }} />
            </div>
            <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 54, color: "#fff", marginTop: 54 }}>CroLovac</div>
            <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 28, color: ZLATO, marginTop: 4 }}>lovački dnevnik</div>
          </div>
          {EKRANI.map((e, i) => (
            <Img key={e} src={staticFile(e)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: ekranIdx === i ? 1 : 0, transform: `scale(${ekranIdx === i ? 1 + ((f - 300 - i * 40) / 40) * 0.05 : 1})` }} />
          ))}
          <div style={{ position: "absolute", top: 18, left: "50%", width: 110, height: 32, marginLeft: -55, borderRadius: 16, background: "#000" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,.14) 0%, transparent 35%)" }} />
        </div>
      </div>
    </div>
  );
};

const Natpis: React.FC = () => {
  const f = useCurrentFrame();
  const naslov = f < 300 ? (f < 190 ? "Prije lova 🌤️" : "U lovu i poslije 📓") : "Pravi ekrani, prava aplikacija";
  const kljuc = f < 190 ? 0 : f < 300 ? 1 : 2;
  const od = [70, 190, 300][kljuc];
  const p = k(f, od, od + 12);
  return (
    <>
      <div style={{ position: "absolute", top: 230, left: 0, right: 120, textAlign: "center", opacity: k(f, 40, 60) }}>
        <div style={{ fontFamily: "Txt", fontWeight: 600, fontSize: 30, letterSpacing: 10, color: ZLATO }}>CROLOVAC</div>
        <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 66, color: "#fff", lineHeight: 1.05, marginTop: 8, textShadow: "0 6px 30px rgba(0,0,0,.6)" }}>
          Cijeli lov u <span style={{ color: ZLATO }}>jednom mobitelu.</span>
        </div>
      </div>
      {f >= 70 && (
        <div style={{ position: "absolute", top: 450, left: 0, right: 120, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
          <div style={{ background: "#fff", color: "#111", fontFamily: "Disp", fontWeight: 700, fontSize: 32, borderRadius: 14, padding: "8px 22px" }}>{naslov}</div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 330, left: 0, right: 120, display: "flex", justifyContent: "center", opacity: k(f, 80, 100) }}>
        <div style={{ background: "rgba(10,14,11,.75)", border: "1.5px solid rgba(232,169,71,.4)", borderRadius: 999, padding: "10px 26px", fontFamily: "Txt", fontWeight: 600, fontSize: 26, color: T }}>
          CroLovac · <span style={{ color: ZLATO }}>besplatno</span> · QR kod na kraju 📲
        </div>
      </div>
    </>
  );
};

const Kraj: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, #1d4a2b 0%, #0d2615 60%, #07150b 100%)", alignItems: "center", paddingTop: 240, paddingRight: 120, opacity: k(f, 0, 10) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, transform: `scale(${s})` }}>
        <Img src={staticFile("icon-512.png")} style={{ width: 110, height: 110, borderRadius: 26 }} />
        <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 84, color: "#fff" }}>CroLovac</div>
      </div>
      <div style={{ fontFamily: "Disp", fontWeight: 700, fontSize: 48, color: "#fff", marginTop: 30, opacity: k(f, 6, 16) }}>Skeniraj i preuzmi</div>
      <div style={{ fontFamily: "Disp", fontWeight: 900, fontSize: 52, color: ZLATO, opacity: k(f, 8, 18) }}>besplatno 📲</div>
      <div style={{ marginTop: 40, background: "#fff", borderRadius: 36, padding: 26, border: `8px solid ${ZLATO}`, boxShadow: "0 30px 80px rgba(0,0,0,.5)", transform: `scale(${0.85 + k(f, 10, 24) * 0.15})`, opacity: k(f, 10, 20) }}>
        <Img src={staticFile("play_tiktok.svg")} style={{ width: 420, height: 420, display: "block" }} />
        <div style={{ textAlign: "center", fontFamily: "Txt", fontWeight: 600, fontSize: 30, color: "#222", marginTop: 12 }}>📷 Skeniraj kamerom</div>
      </div>
      <div style={{ marginTop: 36, background: ZLATO, color: "#1b1407", fontFamily: "Disp", fontWeight: 900, fontSize: 40, borderRadius: 999, padding: "14px 44px", opacity: k(f, 18, 28) }}>▶ Google Play</div>
      <div style={{ marginTop: 22, fontFamily: "Txt", fontWeight: 600, fontSize: 32, color: ZLATO, opacity: k(f, 22, 32) }}>📱 iPhone? Link je u opisu 👇</div>
    </AbsoluteFill>
  );
};

export const PREMIUM_TRAJANJE = 540;

export const Premium = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 10, PREMIUM_TRAJANJE - 30, PREMIUM_TRAJANJE], [0, 0.7, 0.7, 0], { extrapolateRight: "clamp" });
  const kraj = 430;
  return (
    <AbsoluteFill style={{ background: "#050806" }}>
      <Fontovi />
      <Audio src={staticFile("glazba_chill.wav")} loop volume={vol} />
      {f < kraj + 10 && (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, #16201a 0%, #050806 70%)" }} />
          <Snop p={k(f, 0, 40)} />
          {/* kamen s mahovinom */}
          <div style={{ position: "absolute", left: 160, right: 280, top: 1480, height: 180, borderRadius: "50% 50% 40% 40%", background: "radial-gradient(ellipse at 50% 30%, #3b4a2e, #1a2214 70%)", boxShadow: "0 -6px 30px rgba(120,160,80,.25) inset, 0 40px 80px rgba(0,0,0,.8)" }} />
          <Mobitel />
          {KARTICE.map((d, i) => (
            <Kartica key={d.n} d={d} od={i < 4 ? 80 + i * 22 : 200 + (i - 4) * 22} do_={i < 4 ? 190 : 300} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <List key={i} i={i} />
          ))}
          <Dim jacina={1 - k(f, 60, 120) * 0.5} />
          <Natpis />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.7) 100%)" }} />
        </AbsoluteFill>
      )}
      <Sequence from={kraj}>
        <Kraj />
      </Sequence>
    </AbsoluteFill>
  );
};

