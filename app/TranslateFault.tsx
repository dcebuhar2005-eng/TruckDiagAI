"use client";

import { useState } from "react";

export default function TranslateFault({
  symptoms,
  fault,
  solution,
}: {
  symptoms: string | null;
  fault: string | null;
  solution: string | null;
}) {
  const [translated, setTranslated] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function translateFault() {
    setLoading(true);
    setTranslated(null);

    try {
      const language = localStorage.getItem("language") || "en";
      console.log("CURRENT LANGUAGE:", language);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: symptoms || "",
          fault: fault || "",
          solution: solution || "",
          language,
        }),
      });

      const data = await response.json();

      console.log("TRANSLATION RESPONSE:", data);

      if (!response.ok || data.error) {
        setTranslated({
          error: data.error || "Translation failed",
        });
        return;
      }

      setTranslated({
        symptoms: data.symptoms || "",
        fault: data.fault || "",
        solution: data.solution || "",
      });
    } catch (error) {
      console.error(error);
      setTranslated({
        error: "Translation failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <button
        onClick={translateFault}
        disabled={loading}
        style={{
          background: "#f97316",
          color: "white",
          border: "none",
          padding: "14px 22px",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "⏳ Translating..." : "🌍 Translate fault"}
      </button>

      {translated?.error && (
        <p style={{ color: "#ef4444", marginTop: "15px" }}>
          {translated.error}
        </p>
      )}

      {translated && !translated.error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--card)",
          }}
        >
          <h3>🌍 Translation</h3>

          <p>
            <b>Symptoms:</b>{" "}
            {translated.symptoms || "No translation returned"}
          </p>

          <p>
            <b>Fault:</b>{" "}
            {translated.fault || "No translation returned"}
          </p>

          <p>
            <b>Solution:</b>{" "}
            {translated.solution || "No translation returned"}
          </p>
        </div>
      )}
    </div>
  );
}