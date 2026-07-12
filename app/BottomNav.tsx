"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/app/translations";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/",
      icon: "🔧",
      label: t("faults"),
    },
    {
      href: "/services",
      icon: "🗺️",
      label: t("services"),
    },
    {
      href: "/ai",
      icon: "🤖",
      label: t("ai"),
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "68px",
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        boxShadow: "0 -8px 25px rgba(0,0,0,.25)",
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              color: active ? "#f97316" : "var(--text)",
              fontWeight: active ? "bold" : "normal",
              fontSize: "13px",
            }}
          >
            <div style={{ fontSize: "22px" }}>{item.icon}</div>
            <div>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
}