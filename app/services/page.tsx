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
        position: "relative",
        minHeight: "100dvh",
        paddingBottom: "180px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: "60dvh",
          minHeight: "320px",
          overflow: "hidden",
        }}
      >
        <ServiceMap />
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(68px + env(safe-area-inset-bottom))",
          padding: "12px 16px 14px",
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -6px 20px rgba(0,0,0,0.25)",
          textAlign: "center",
          zIndex: 999,
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            margin: "0 0 8px 0",
            fontSize: "14px",
          }}
        >
          {t("haveService")}
        </p>

        <Link
          href="/services/add"
          style={{
            display: "block",
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#16a34a",
              color: "white",
              border: "none",
              padding: "13px 20px",
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