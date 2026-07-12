"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import Comments from "@/app/Comments";
import Rating from "@/app/Rating";
import Link from "next/link";
import { useParams } from "next/navigation";
import { t, getLanguage } from "@/app/translations";

export default function FaultPage() {
  const params = useParams();
  const id = params.id as string;

  const [fault, setFault] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translated, setTranslated] = useState<any>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    loadFault();
  }, []);

  async function loadFault() {
    const { data: faultData, error } = await supabase
      .from("fault_cases")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !faultData) {
      setLoading(false);
      return;
    }

    setFault(faultData);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", faultData.user_id)
      .single();

    setProfile(profileData);
    setLoading(false);
  }

  async function translateFault() {
    if (!fault) return;

    setTranslating(true);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify({
            vehicle_type: fault.vehicle_type || "",
            engine: fault.engine || "",
            euro_norm: fault.euro_norm || "",
            mileage: fault.mileage || "",
            fault_codes: fault.fault_codes || "",
            measured_parameters: fault.measured_parameters || "",
            changed_parts: fault.changed_parts || "",
            tests_done: fault.tests_done || "",
            symptoms: fault.symptoms || "",
            fault: fault.final_fault || "",
            solution: fault.solution || "",
          }),
          targetLanguage: getLanguage(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setTranslating(false);
        return;
      }

      const translatedText = String(
        data.translatedText || data.result || data.translation || ""
      );

      try {
        const translatedJson = JSON.parse(translatedText);
        setTranslated(translatedJson);
      } catch (error) {
        console.error(error);
        setTranslated({
          fault: translatedText,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTranslating(false);
    }
  }

  const shown = translated || {
    vehicle_type: fault?.vehicle_type,
    engine: fault?.engine,
    euro_norm: fault?.euro_norm,
    mileage: fault?.mileage,
    fault_codes: fault?.fault_codes,
    measured_parameters: fault?.measured_parameters,
    changed_parts: fault?.changed_parts,
    tests_done: fault?.tests_done,
    symptoms: fault?.symptoms,
    fault: fault?.final_fault,
    solution: fault?.solution,
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>⏳ Loading...</div>;
  }

  if (!fault) {
    return <div style={{ padding: "20px" }}>{t("fault")} not found.</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
<Link
  href="/"
  style={{
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "16px",
  }}
>
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 14px",
      borderRadius: "999px",
      background: "rgba(37,99,235,0.12)",
      color: "#3b82f6",
      fontSize: "14px",
      fontWeight: "600",
      border: "1px solid rgba(37,99,235,0.25)",
    }}
  >
     {t("back")}
  </div>
</Link>

      <h1>
        🚛 {fault.brand} {fault.model}
      </h1>
      <div
  style={{
    marginTop: "10px",
    marginBottom: "15px",
    padding: "10px",
    borderRadius: "10px",
    background: fault.is_premium ? "#7c3aed" : "#16a34a",
    color: "white",
    fontWeight: "bold",
  }}
>
  {fault.is_premium ? "💎 PREMIUM" : "🔓 FREE"}

  {fault.difficulty_score > 0 && (
    <div style={{ marginTop: "6px" }}>
      Težina: {fault.difficulty_score}/10
    </div>
  )}

  {fault.difficulty_reason && (
    <div
      style={{
        marginTop: "6px",
        fontWeight: "normal",
        fontSize: "14px",
      }}
    >
      {fault.difficulty_reason}
    </div>
  )}
</div>

      {fault.image_url && (
        <img
          src={fault.image_url}
          alt={t("fault")}
          style={{
            width: "100%",
            maxWidth: "700px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        />
      )}

      <button
        onClick={translateFault}
        disabled={translating}
        style={{
          background: "#f97316",
          color: "white",
          border: "none",
          padding: "12px 18px",
          borderRadius: "8px",
          cursor: translating ? "not-allowed" : "pointer",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        {translating ? "⏳ Translating..." : "🌍 Translate fault"}
      </button>

      {translated && (
        <p style={{ color: "#16a34a", fontWeight: "bold" }}>
          🌍 Translated
        </p>
      )}

      <div className="card-hover" style={{ padding: "15px", borderRadius: "12px" }}>
        <p><b>{t("vehicleType")}:</b> {shown.vehicle_type || "-"}</p>
        <p><b>{t("engine")}:</b> {shown.engine || "-"}</p>
        <p><b>{t("euroNorm")}:</b> {shown.euro_norm || "-"}</p>
        <p><b>{t("mileage")}:</b> {shown.mileage || "-"}</p>
        <p><b>{t("faultCodes")}:</b> {shown.fault_codes || "-"}</p>
        <p><b>{t("measuredParameters")}:</b> {shown.measured_parameters || "-"}</p>
        <p><b>{t("changedParts")}:</b> {shown.changed_parts || "-"}</p>
        <p><b>{t("testsDone")}:</b> {shown.tests_done || "-"}</p>

        <hr style={{ margin: "20px 0" }} />

        <p><b>{t("symptoms")}:</b> {shown.symptoms || "-"}</p>
        <p><b>{t("fault")}:</b> {shown.fault || "-"}</p>
        <p><b>{t("solution")}:</b> {shown.solution || "-"}</p>
      </div>

      {translated && (
        <>
          <hr style={{ margin: "20px 0" }} />

          <h3>Original</h3>

          <div className="card-hover" style={{ padding: "15px", borderRadius: "12px" }}>
            <p><b>{t("vehicleType")}:</b> {fault.vehicle_type || "-"}</p>
            <p><b>{t("engine")}:</b> {fault.engine || "-"}</p>
            <p><b>{t("euroNorm")}:</b> {fault.euro_norm || "-"}</p>
            <p><b>{t("mileage")}:</b> {fault.mileage || "-"}</p>
            <p><b>{t("faultCodes")}:</b> {fault.fault_codes || "-"}</p>
            <p><b>{t("measuredParameters")}:</b> {fault.measured_parameters || "-"}</p>
            <p><b>{t("changedParts")}:</b> {fault.changed_parts || "-"}</p>
            <p><b>{t("testsDone")}:</b> {fault.tests_done || "-"}</p>
            <p><b>{t("symptoms")}:</b> {fault.symptoms || "-"}</p>
            <p><b>{t("fault")}:</b> {fault.final_fault || "-"}</p>
            <p><b>{t("solution")}:</b> {fault.solution || "-"}</p>
          </div>
        </>
      )}

      <Rating faultId={fault.id} />

      <hr style={{ margin: "20px 0" }} />

      <h2>👤 {t("profile")}</h2>

      <Link href={`/user/${fault.user_id}`}>
        <b style={{ cursor: "pointer", color: "#60a5fa" }}>
          {profile?.name || t("unknownUser")}
        </b>
      </Link>

      <Comments faultId={fault.id} />
    </div>
  );
}

