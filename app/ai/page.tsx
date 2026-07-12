"use client";

import Link from "next/link";
import { t } from "@/app/translations";

export default function AiPage() {
  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "20px",
    cursor: "pointer",
    transition: "0.2s",
    height: "100%",
    textDecoration: "none",
    color: "var(--text)",
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>{t("aiCenterTitle")}</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: "15px",
          marginTop: "25px",
        }}
      >
        <Link href="/ai/similar" style={{ textDecoration: "none" }}>
          <div style={cardStyle}>
            <h3>{t("aiSimilarTitle")}</h3>
            <p>{t("aiSimilarDesc")}</p>
          </div>
        </Link>

        <Link href="/ai/causes" style={{ textDecoration: "none" }}>
          <div style={cardStyle}>
            <h3>{t("aiCausesTitle")}</h3>
            <p>{t("aiCausesDesc")}</p>
          </div>
        </Link>

        <Link href="/ai/report" style={{ textDecoration: "none" }}>
          <div style={cardStyle}>
            <h3>{t("aiReportTitle")}</h3>
            <p>{t("aiReportDesc")}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}