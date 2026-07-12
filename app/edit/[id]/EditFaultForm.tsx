"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const fieldStyle = {
  width: "100%",
  padding: "14px",
  fontSize: "18px",
  border: "2px solid #666",
  borderRadius: "8px",
  backgroundColor: "#111",
  color: "white",
  marginTop: "6px",
};

const labelStyle = {
  fontSize: "18px",
  fontWeight: "bold",
};

export default function EditFaultForm({ fault }: any) {
  const router = useRouter();

  const [brand, setBrand] = useState(fault.brand || "");
  const [model, setModel] = useState(fault.model || "");
  const [engine, setEngine] = useState(fault.engine || "");
  const [symptoms, setSymptoms] = useState(fault.symptoms || "");
  const [finalFault, setFinalFault] = useState(fault.final_fault || "");
  const [solution, setSolution] = useState(fault.solution || "");

  async function saveChanges() {
    const { error } = await supabase
      .from("fault_cases")
      .update({
        brand,
        model,
        engine,
        symptoms,
        final_fault: finalFault,
        solution,
      })
      .eq("id", fault.id);

    if (error) {
      alert("Greška: " + error.message);
      return;
    }

    alert("Izmjene spremljene!");
    router.push("/");
  }

  async function deleteFault() {
    const confirmDelete = window.confirm(
      "Jesi siguran da želiš obrisati ovaj kvar?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("fault_cases")
      .delete()
      .eq("id", fault.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Kvar obrisan!");
    router.push("/");
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px" }}>
      <h1>✏️ Uredi kvar</h1>

      <label style={labelStyle}>Marka</label>
      <input value={brand} onChange={(e) => setBrand(e.target.value)} style={fieldStyle} />
      <br /><br />

      <label style={labelStyle}>Model</label>
      <input value={model} onChange={(e) => setModel(e.target.value)} style={fieldStyle} />
      <br /><br />

      <label style={labelStyle}>Motor</label>
      <input value={engine} onChange={(e) => setEngine(e.target.value)} style={fieldStyle} />
      <br /><br />

      <label style={labelStyle}>Simptomi</label>
      <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={5} style={fieldStyle} />
      <br /><br />

      <label style={labelStyle}>Kvar</label>
      <textarea value={finalFault} onChange={(e) => setFinalFault(e.target.value)} rows={5} style={fieldStyle} />
      <br /><br />

      <label style={labelStyle}>Rješenje</label>
      <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={5} style={fieldStyle} />
      <br /><br />

      <button onClick={saveChanges} style={{ background: "green", color: "white", border: "none", padding: "16px 26px", borderRadius: "8px", fontWeight: "bold", marginRight: "10px", cursor: "pointer" }}>
        💾 SPREMI
      </button>

      <button onClick={() => router.push("/")} style={{ background: "#444", color: "white", border: "none", padding: "16px 26px", borderRadius: "8px", marginRight: "10px", cursor: "pointer" }}>
        🔙 NATRAG
      </button>

      <button onClick={deleteFault} style={{ background: "#dc2626", color: "white", border: "none", padding: "16px 26px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
        🗑️ OBRIŠI
      </button>
    </div>
  );
}