"use client";

import Link from "next/link";
import { t } from "./translations";

export default function AddFaultButton() {
  return (
    <Link href="/add">
      <button
        style={{
          backgroundColor: "#16a34a",
          color: "white",
          border: "none",
          padding: "14px 22px",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {t("addFault")}
      </button>
    </Link>
  );
}