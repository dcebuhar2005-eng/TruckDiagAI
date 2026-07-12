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
        height: "calc(100dvh - 68px)",
        display: "grid",
        gridTemplateRows: "1fr auto",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
  style={{
    height: "60vh",
    overflow: "hidden",
  }}
>
        <ServiceMap />
      </div>

      <div
        style={{
          padding: "12px 16px 16px",
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
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