"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/app/translations";

export default function CausesPage() {
  const [input, setInput] = useState("");
  const [causes, setCauses] = useState<string[]>([]);
  const [userType, setUserType] = useState<"driver" | "mechanic">("driver");
  const [loading, setLoading] = useState(false);

  async function analyzeCauses() {
    if (!input.trim()) {
      setCauses([]);
      return;
    }

    try {
      setLoading(true);
      setCauses([]);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  input,
  userType,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI Error");
      }

      setCauses([data.result]);
    } catch (error) {
      console.error(error);
      setCauses(["AI analysis failed. Check API configuration and try again."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        paddingBottom: "90px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      <Link href="/ai" style={{ textDecoration: "none" }}>
        <button
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
            padding: "0",
            marginBottom: "18px",
            opacity: 0.8,
          }}
        >
          ← {t("backToAi")}
        </button>
      </Link>

      <h1>{t("causesPageTitle")}</h1>

      <p style={{ opacity: 0.75, lineHeight: 1.5 }}>
        {t("causesPageDesc")}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          marginTop: "15px",
        }}
      >
        <button
          onClick={() => setUserType("driver")}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border:
              userType === "driver"
                ? "2px solid #2563eb"
                : "1px solid var(--border)",
            background:
              userType === "driver"
                ? "rgba(37,99,235,0.15)"
                : "var(--background)",
            color: "var(--text)",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🚛 {t("driver")}
        </button>

        <button
          onClick={() => setUserType("mechanic")}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border:
              userType === "mechanic"
                ? "2px solid #2563eb"
                : "1px solid var(--border)",
            background:
              userType === "mechanic"
                ? "rgba(37,99,235,0.15)"
                : "var(--background)",
            color: "var(--text)",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔧 {t("mechanic")}
        </button>
      </div>

      <textarea
        placeholder={t("causesPlaceholder")}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "16px",
          borderRadius: "14px",
          marginTop: "15px",
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--text)",
          outline: "none",
          resize: "vertical",
        }}
      />

      <button
        onClick={analyzeCauses}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "14px",
          background: loading ? "#64748b" : "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 16px",
          borderRadius: "12px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "700",
          fontSize: "15px",
          opacity: loading ? 0.8 : 1,
        }}
      >
        {loading ? "AI analizira..." : t("analyzeCauses")}
      </button>

      {(loading || causes.length > 0) && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "16px",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2>{t("causesResultsTitle")}</h2>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: "1.7",
            }}
          >
            {loading ? "Molim pričekaj, AI analizira grešku..." : causes[0]}
          </div>
        </div>
      )}
    </div>
  );
}