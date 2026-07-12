"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { t } from "@/app/translations";

const ServiceMap = dynamic(() => import("./ServiceMap"), {
  ssr: false,
});

export default function ServicesPage() {
  return (
    <div
      style={{
        height: "calc(100vh - 136px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <ServiceMap />
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
          {t("haveService")}
        </p>

        <Link href="/services/add">
          <button
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🏢 {t("addService")}
          </button>
        </Link>
      </div>
    </div>
  );
}