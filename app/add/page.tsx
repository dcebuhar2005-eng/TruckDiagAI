"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { t } from "@/app/translations";

export default function AddFault() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [vehicleType, setVehicleType] = useState("car");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [engine, setEngine] = useState("");
  const [euroNorm, setEuroNorm] = useState("");
  const [mileage, setMileage] = useState("");
  const [faultCodes, setFaultCodes] = useState("");
  const [measuredParameters, setMeasuredParameters] = useState("");
  const [changedParts, setChangedParts] = useState("");
  const [testsDone, setTestsDone] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [finalFault, setFinalFault] = useState("");
  const [solution, setSolution] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
      setCheckingUser(false);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
        setCheckingUser(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function rateFaultWithAI() {
    try {
      const response = await fetch("/api/rate-fault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_type: vehicleType,
          brand,
          model,
          engine,
          euro_norm: euroNorm,
          mileage,
          fault_codes: faultCodes,
          measured_parameters: measuredParameters,
          changed_parts: changedParts,
          tests_done: testsDone,
          symptoms,
          final_fault: finalFault,
          solution,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          score: 0,
          premium: false,
          reason: "AI rating failed",
        };
      }

      const score = Number(data.score) || 0;

      return {
        score,
        premium: Boolean(data.premium) || score >= 7,
        reason: data.reason || "",
      };
    } catch (error) {
      console.error(error);

      return {
        score: 0,
        premium: false,
        reason: "AI rating failed",
      };
    }
  }

  async function saveFault() {
    if (saving || checkingUser) return;

    if (!userId) {
      alert("Session nije pronađen. Odjavi se i ponovno prijavi.");
      return;
    }

    setSaving(true);

    let imageUrl = null;

    if (image) {
      const safeName = image.name.replaceAll(" ", "-");
      const fileName = `${userId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("fault-images")
        .upload(fileName, image);

      if (uploadError) {
        alert("Greška kod uploada slike: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("fault-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const rating = await rateFaultWithAI();

    const { error } = await supabase.from("fault_cases").insert([
      {
        vehicle_type: vehicleType,
        brand,
        model,
        engine,
        euro_norm: euroNorm,
        mileage: mileage ? Number(mileage) : null,
        fault_codes: faultCodes,
        measured_parameters: measuredParameters,
        changed_parts: changedParts,
        tests_done: testsDone,
        symptoms,
        final_fault: finalFault,
        solution,
        user_id: userId,
        image_url: imageUrl,

        is_premium: rating.premium,
        difficulty_score: rating.score,
        difficulty_reason: rating.reason,
      },
    ]);

    if (error) {
      alert("Greška: " + error.message);
      setSaving(false);
      return;
    }

    alert(
      rating.premium
        ? `Kvar spremljen kao PREMIUM. Težina: ${rating.score}/10`
        : `Kvar spremljen kao FREE. Težina: ${rating.score}/10`
    );

    setVehicleType("car");
    setBrand("");
    setModel("");
    setEngine("");
    setEuroNorm("");
    setMileage("");
    setFaultCodes("");
    setMeasuredParameters("");
    setChangedParts("");
    setTestsDone("");
    setSymptoms("");
    setFinalFault("");
    setSolution("");
    setImage(null);
    setSaving(false);
  }

  const inputStyle = {
    width: "100%",
    padding: "14px",
    fontSize: "18px",
  };

  if (checkingUser) {
    return <div style={{ padding: "20px" }}>⏳ Provjeravam prijavu...</div>;
  }

  if (!userId) {
    return (
      <div style={{ padding: "20px" }}>
        Moraš biti prijavljen da bi dodao kvar.
      </div>
    );
  }

  return (
    <div
  style={{
    padding: "20px",
    paddingBottom: "140px",
    maxWidth: "900px",
  }}
>
      <h1>➕ Dodaj novi kvar</h1>

      <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={inputStyle}>
        <option value="car">🚗 Automobil</option>
        <option value="truck">🚛 Kamion</option>
        <option value="machine">🚜 Radni stroj</option>
        <option value="quad">🏍️ Quad / ATV</option>
        <option value="van">🚐 Kombi</option>
      </select>

      <br /><br />

      <input placeholder="Marka" value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} />
      <br /><br />

      <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle} />
      <br /><br />

      <input placeholder="Motor" value={engine} onChange={(e) => setEngine(e.target.value)} style={inputStyle} />
      <br /><br />

      <input placeholder="Euro norma npr. Euro 6" value={euroNorm} onChange={(e) => setEuroNorm(e.target.value)} style={inputStyle} />
      <br /><br />

      <input type="number" placeholder="Kilometraža" value={mileage} onChange={(e) => setMileage(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Kodovi grešaka npr. EMS 5127, P0087..." rows={4} value={faultCodes} onChange={(e) => setFaultCodes(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Mjereni parametri npr. rail desired 2200, actual 1600..." rows={5} value={measuredParameters} onChange={(e) => setMeasuredParameters(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Zamijenjeni dijelovi" rows={5} value={changedParts} onChange={(e) => setChangedParts(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Napravljeni testovi" rows={5} value={testsDone} onChange={(e) => setTestsDone(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Simptomi" rows={5} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Kvar / uzrok" rows={5} value={finalFault} onChange={(e) => setFinalFault(e.target.value)} style={inputStyle} />
      <br /><br />

      <textarea placeholder="Rješenje" rows={5} value={solution} onChange={(e) => setSolution(e.target.value)} style={inputStyle} />
      <br /><br />

      <label style={{ fontSize: "18px", fontWeight: "bold" }}>
        📷 {t("addFaultImage")}
      </label>
      <br /><br />

      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />

      <br /><br />

      <button
        onClick={saveFault}
        disabled={saving || checkingUser}
        style={{
          background: saving ? "#777" : "#16a34a",
          width: "100%",
          color: "white",
          border: "none",
          padding: "16px 26px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
       {saving
  ? `⏳ ${t("analyzingAndSaving")}`
  : `💾 ${t("saveFault")}`}
      </button>
    </div>
  );
}