"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { t } from "@/app/translations";

export default function SimilarFaultPage() {
  const [question, setQuestion] = useState("");
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaults();
  }, []);

  async function loadFaults() {
    setLoading(true);

    const { data } = await supabase
      .from("fault_cases")
      .select("*")
      .order("created_at", { ascending: false });

    setFaults(data || []);
    setLoading(false);
  }

  const results = useMemo(() => {
    const words = question
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    if (words.length === 0) return [];

    return faults
      .map((item: any) => {
        const text = `
          ${item.vehicle_type || ""}
          ${item.brand || ""}
          ${item.model || ""}
          ${item.engine || ""}
          ${item.euro_norm || ""}
          ${item.fault_codes || ""}
          ${item.measured_parameters || ""}
          ${item.changed_parts || ""}
          ${item.tests_done || ""}
          ${item.symptoms || ""}
          ${item.final_fault || ""}
          ${item.solution || ""}
        `.toLowerCase();

        const score = words.filter((word) => text.includes(word)).length;

        return { ...item, score };
      })
      .filter((item: any) => item.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);
  }, [question, faults]);

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

      <h1 style={{ marginTop: "10px" }}>{t("similarPageTitle")}</h1>

      <p style={{ opacity: 0.75, lineHeight: 1.5 }}>
        {t("similarPageDesc")}
      </p>

      <textarea
        placeholder={t("similarPlaceholder")}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
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

      {loading && (
        <p style={{ marginTop: "18px", opacity: 0.75 }}>
          {t("loadingFaults")}
        </p>
      )}

      {!loading && question.length > 2 && results.length === 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "14px",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {t("noSimilarCases")}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h2 style={{ fontSize: "20px" }}>{t("similarResultsTitle")}</h2>

          <div style={{ display: "grid", gap: "14px" }}>
            {results.map((item: any) => (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  🚛 {item.brand || "-"} {item.model || ""}
                </h3>

                <p>
                  <b>{t("engine")}:</b> {item.engine || "-"}
                </p>

                <p>
                  <b>{t("faultCodes")}:</b> {item.fault_codes || "-"}
                </p>

                <p>
                  <b>{t("fault")}:</b> {item.final_fault || "-"}
                </p>

                <p>
                  <b>{t("match")}:</b> {item.score}
                </p>

                <Link href={`/fault/${item.id}`}>
                  <button
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "15px",
                    }}
                  >
                    📖 {t("openCase")}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}