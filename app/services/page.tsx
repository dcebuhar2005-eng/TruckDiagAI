"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { t } from "@/app/translations";

const ServiceMap = dynamic(() => import("./ServiceMap"), {
  ssr: false,
});

export default function ServicesPage() {
  return (
    <main
      style={{
        position: "relative",
        height: "calc(100dvh - 68px - env(safe-area-inset-bottom))",
        overflow: "hidden",
      }}
    >
      {/* MAPA */}
      <ServiceMap />

      {/* FLOATING CTA */}
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: "calc(84px + env(safe-area-inset-bottom))",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            background: "rgba(20,20,20,0.9)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            padding: "14px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            pointerEvents: "auto",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              textAlign: "center",
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
            <div
              style={{
                background: "#16a34a",
                color: "#fff",
                textAlign: "center",
                padding: "15px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🏢 {t("addService")}
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}